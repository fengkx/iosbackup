# 从第一份备份开始

[English](getting-started.md) · [返回操作手册](../OPERATIONS.zh-CN.md)

把 iPhone / iPad 备份到自己管理的 NAS 或 Linux 主机，并在浏览器里查看进度。先完成一次 USB 备份，再逐项配置自动计划、Wi-Fi 和加密。

## 1. 选择你的主机

先阅读[环境与支持范围](overview.zh-CN.md)，准备可运行 Docker 的可信主机、USB 数据线和足够的本地存储空间。

- **群晖 NAS**：按[群晖安装指南](synology.zh-CN.md)，使用 DSM 的 Container Manager 图形界面部署。
- **Linux 主机**：按[Linux 安装指南](installation.zh-CN.md)，使用 Docker Compose 部署。
- **已有实例**：进入[升级与回滚](upgrade.zh-CN.md)，不要重新初始化已有数据目录。

Windows 和 macOS 可以作为浏览器客户端；原生运行本项目的设备备份服务不在当前支持范围内。

## 2. 连接手机，完成 USB 备份

将手机接到实际运行服务的主机 USB 端口，按手机提示输入锁屏密码或确认信任。按[首次 USB 备份](usb-backup.zh-CN.md)完成配对、执行任务并核对最终结果。

任务成功、备份清单可读、能恢复到手机，是三项不同的检查。当前没有完整的真机恢复成功记录；需要恢复时先看[恢复总览](restore.zh-CN.md)。

## 3. 再设置日常备份

保存[完整部署实例副本](instance-recovery.zh-CN.md)，安全保管备份密码与主密钥，再按需设置：

- [自动计划](scheduling.zh-CN.md)：时间窗、间隔、电量和充电条件。
- [Wi-Fi 备份](wifi.zh-CN.md)：先完成无线准备和一次手动测试。
- [加密与密码](encryption.zh-CN.md)：了解已有加密状态，另存原密码。
- [通知](notifications.zh-CN.md)：观察备份结果，验证渠道可用。

自动计划满足条件时会发起任务，但手机仍可能要求输入锁屏密码。当前持续更新同一设备的备份集，不自动保留每次任务的独立历史版本；需要历史状态时，另存一致副本或使用 NAS 快照。

遇到问题，按[故障排查](troubleshooting.zh-CN.md)先核对连接、授权和存储，再准备脱敏信息求助。
