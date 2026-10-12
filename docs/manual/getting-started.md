# Start with your first backup

[简体中文](getting-started.zh-CN.md) · [Operations manual](../OPERATIONS.md)

Back up your iPhone or iPad to a NAS or Linux host you manage, and follow progress in a browser. Complete one USB backup before adding schedules, Wi-Fi, or encryption changes.

## 1. Choose your host

Read the [requirements](overview.md). Prepare a trusted Docker host, a USB data cable, and enough local storage.

- **Synology NAS**: follow the [Synology guide](synology.md) using the DSM Container Manager interface.
- **Linux host**: follow the [Linux guide](installation.md) using Docker Compose.
- **Existing deployment**: use [upgrade and rollback](upgrade.md); do not initialize existing data directories again.

Windows and macOS can access the browser interface. Running this project's device backup service natively on those systems is outside the current support boundary.

## 2. Connect your device and complete a USB backup

Plug the device into the host running the service. Respond to passcode or Trust prompts on the device. Follow [your first USB backup](usb-backup.md) to pair, run the job, and check its final result.

A successful task, a readable backup manifest, and a successful device restore are three separate checks. There is currently no recorded complete real-device restore; read the [restore overview](restore.md) before planning recovery.

## 3. Set up your routine

Keep a [complete deployment copy](instance-recovery.md) and protect your backup passwords and master key. Then configure what you need:

- [Schedules](scheduling.md): time window, interval, battery, and charging conditions.
- [Wi-Fi backups](wifi.md): prepare wireless connectivity and test one manual backup first.
- [Encryption and passwords](encryption.md): understand the existing encryption state and preserve the original password.
- [Notifications](notifications.md): follow outcomes and verify delivery.

A schedule starts a job when conditions are met, but the device may still ask for its passcode. The same device backup set is updated incrementally; each run does not create an independent historical version. Keep consistent separate copies or NAS snapshots for older states.

If something fails, use [troubleshooting](troubleshooting.md) to check connectivity, permission prompts, and storage before sharing sanitized information for help.
