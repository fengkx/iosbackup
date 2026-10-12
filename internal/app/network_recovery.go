package app

import (
	"context"
	"net"
	"time"
)

const (
	networkRecoveryInterval  = 15 * time.Second
	networkRecoveryMaxDelay  = 2 * time.Minute
	networkAddressMaxAge     = 24 * time.Hour
	networkQueryFailureLimit = 3
)

type networkRecoveryState struct {
	ip                   string
	lastSeenInList       time.Time
	lastConfirmedWorking time.Time
	queryFailures        int
	configuredIP         string
	nextAttempt          time.Time
	delay                time.Duration
}

// networkRecoveryLoop 独立于自动备份和浏览器刷新；手机恢复可访问后无需新的 mDNS 事件。
func (app *application) networkRecoveryLoop(ctx context.Context) {
	if app.usesUSBMuxd2WiFi() {
		return
	}
	app.recoverNetworkDevices(ctx, time.Now())
	ticker := time.NewTicker(networkRecoveryInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case now := <-ticker.C:
			app.recoverNetworkDevices(ctx, now)
		}
	}
}

// Cache leases are renewed by successful device queries, never by list membership.
// An observed address change invalidates the old lease until the new address works.
func (app *application) recoverNetworkDevices(ctx context.Context, now time.Time) {
	if ctx.Err() != nil || app.usesUSBMuxd2WiFi() || !app.networkRecoveryMu.TryLock() {
		return
	}
	defer app.networkRecoveryMu.Unlock()
	online, err := app.lookupNetworkIPs(ctx)
	if err != nil || ctx.Err() != nil {
		return
	} // 查询失败不能当作全部设备掉线。

	app.mu.Lock()
	if app.networkRecovery == nil {
		app.networkRecovery = make(map[string]networkRecoveryState)
	}
	for udid := range app.networkRecovery {
		if app.configs[udid] == nil || app.deviceRemovalBlockedUnsafe(udid) != nil {
			delete(app.networkRecovery, udid)
		}
	}
	candidates := make(map[string]string)
	for udid, cfg := range app.configs {
		if cfg == nil || app.deviceRemovalBlockedUnsafe(udid) != nil {
			continue
		}
		state := app.networkRecovery[udid]
		if state.configuredIP != cfg.NetworkAddress {
			state = networkRecoveryState{configuredIP: cfg.NetworkAddress}
		}
		if ip, exists := online[udid]; exists {
			if net.ParseIP(ip) != nil {
				if state.ip != ip {
					state.ip = ip
					state.lastConfirmedWorking = time.Time{}
					state.queryFailures = 0
				}
				state.lastSeenInList = now
			}
			state.delay, state.nextAttempt = 0, now.Add(networkRecoveryInterval)
		} else if !app.deviceRemovalBusyUnsafe(udid) && !now.Before(state.nextAttempt) {
			ip := cfg.NetworkAddress
			if ip == "" && !state.lastConfirmedWorking.IsZero() && now.Sub(state.lastConfirmedWorking) < networkAddressMaxAge {
				ip = state.ip
			}
			if net.ParseIP(ip) != nil {
				candidates[udid] = ip
			}
		}
		app.networkRecovery[udid] = state
	}
	app.mu.Unlock()

	for udid, ip := range candidates {
		if ctx.Err() != nil {
			return
		}
		// 网络查询后配置可能已改变；每次操作前重新检查。
		app.mu.RLock()
		cfg := app.configs[udid]
		state := app.networkRecovery[udid]
		eligible := cfg != nil && cfg.NetworkAddress == state.configuredIP &&
			app.deviceRemovalBlockedUnsafe(udid) == nil && !app.deviceRemovalBusyUnsafe(udid)
		app.mu.RUnlock()
		if !eligible {
			continue
		}
		app.addDebugLog(udid, "Wi-Fi 设备已不在注册表，尝试恢复连接")
		err := app.callAddDeviceContext(ctx, udid, ip)
		app.mu.Lock()
		// Preserve observations made while the helper was running.
		current := app.networkRecovery[udid]
		if current.ip != state.ip || current.configuredIP != state.configuredIP {
			app.mu.Unlock()
			continue
		}
		state = current
		if state.delay == 0 || err == nil {
			state.delay = networkRecoveryInterval
		} else {
			state.delay *= 2
		}
		if state.delay > networkRecoveryMaxDelay {
			state.delay = networkRecoveryMaxDelay
		}
		state.nextAttempt = now.Add(state.delay)
		app.networkRecovery[udid] = state
		app.mu.Unlock()
	}
}

// Bind query results to both the mux process and the address observed before I/O.
func (app *application) networkQueryObservation(d *device) (string, uint64) {
	epoch := app.connectionEpoch(d)
	if !isNetworkConnection(d.Connection) || app.usesUSBMuxd2WiFi() {
		return "", epoch
	}
	ips, err := app.lookupNetworkIPs(app.rootCtx)
	ip := ips[d.UDID]
	if err != nil || net.ParseIP(ip) == nil {
		return "", epoch
	}
	app.mu.Lock()
	defer app.mu.Unlock()
	cfg := app.configs[d.UDID]
	if cfg == nil || app.connectionEpochUnsafe(d) != epoch || app.deviceRemovalBlockedUnsafe(d.UDID) != nil {
		return "", epoch
	}
	if app.networkRecovery == nil {
		app.networkRecovery = make(map[string]networkRecoveryState)
	}
	state := app.networkRecovery[d.UDID]
	if state.ip != ip || state.configuredIP != cfg.NetworkAddress {
		state = networkRecoveryState{ip: ip, configuredIP: cfg.NetworkAddress}
	}
	state.lastSeenInList = time.Now()
	app.networkRecovery[d.UDID] = state
	return ip, epoch
}

func (app *application) recordNetworkQuery(d *device, ip string, epoch uint64, working bool, now time.Time) {
	if !isNetworkConnection(d.Connection) || app.usesUSBMuxd2WiFi() || net.ParseIP(ip) == nil {
		return
	}
	// A DHCP change during the command must not renew the previous address lease.
	ips, err := app.lookupNetworkIPs(app.rootCtx)
	if err != nil || ips[d.UDID] != ip {
		return
	}
	app.mu.Lock()
	defer app.mu.Unlock()
	cfg := app.configs[d.UDID]
	state, exists := app.networkRecovery[d.UDID]
	if !exists || cfg == nil || app.deviceRemovalBlockedUnsafe(d.UDID) != nil ||
		state.ip != ip || state.configuredIP != cfg.NetworkAddress || app.connectionEpochUnsafe(d) != epoch {
		return
	}
	if working {
		state.lastConfirmedWorking = now
		state.queryFailures = 0
	} else {
		state.queryFailures++
	}
	app.networkRecovery[d.UDID] = state
	if state.queryFailures >= networkQueryFailureLimit {
		// The recovery worker drains active tasks and applies the normal retry budget.
		app.connectionServices[connectionWiFi].deviceRecovery = true
		app.requestConnectionRefreshUnsafe()
	}
}

func (app *application) unhealthyNetworkDevicesUnsafe() bool {
	for udid, state := range app.networkRecovery {
		if app.configs[udid] != nil && app.deviceRemovalBlockedUnsafe(udid) == nil && state.queryFailures >= networkQueryFailureLimit {
			return true
		}
	}
	return false
}
