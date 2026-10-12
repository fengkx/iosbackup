# Restore phone data from a NAS / Linux backup

[简体中文](restore.zh-CN.md) · [Back to operations](../OPERATIONS.md)

The route after losing a phone or deleting data is: **identify the source in iOS Backup → copy its complete backup from NAS/Linux → place it in the computer's backup directory → restore with Finder or Apple Devices**. You can export without the original phone. When restoring to another phone, keep the source folder name; do not substitute the new phone's UDID.

> **Validation scope:** Export instructions follow this project's storage layout; the computer steps build on Apple's backup management and restore procedures. This project has no recorded end-to-end result covering recognition, decryption, and a real-device restore through this route. Start with copying and recognition checks. If recognition fails, stop there rather than erasing a phone to experiment.

## 1. Identify the source in iOS Backup and pause writes

1. Expand the **source device** card. Record its name, UDID, and last successful backup time. In Backup Settings, record Save Location, disable automatic backup, and save. Match the UDID to the folder, rather than relying on a device nickname.
2. Confirm the backup predates the deletion. The project updates the same device backup set; **it does not automatically retain a version for every run**. If a later backup already includes the deletion, look for an earlier NAS snapshot or independent copy. A recent success record does not mean the deleted data remains.
3. Wait for backup, unpack, restore, and other active jobs on **all devices** to finish, then stop the iOS Backup container to keep files stable during copying. Disabling a schedule does not cancel an active job. On Synology, stop the container in Container Manager. With Compose, run this from the actual deployment directory:

   ```bash
   docker compose stop iosbackup
   ```

   Stopping the service also pauses other devices' schedules. Do not delete container data or force-kill an active write. After copying and checking, `docker compose start iosbackup` can start the original instance; keep the source device's automatic schedule disabled for now.

If the Web UI is unavailable, locate the backup through deployment mounts directly. Export does not require another backup, pairing, or enabling Allow Restore. Removed devices may still have files on disk; see [Devices and storage](device-storage.md).

## 2. Locate the complete device folder on the host

Save Location is the **backup parent directory inside the container**. The source UDID is a child directory. Official Compose maps `./data/backups:/backups`, with `./` relative to the deployment directory. UDIDs below are placeholders:

| Web UI Save Location | Complete backup inside the container | Complete backup on the NAS/Linux host |
| --- | --- | --- |
| `/backups` | `/backups/<SOURCE-UDID>` | `<deployment>/data/backups/<SOURCE-UDID>` |
| `/backups/family` | `/backups/family/<SOURCE-UDID>` | `<deployment>/data/backups/family/<SOURCE-UDID>` |

For example, a deployment at `/volume1/docker/iosbackup` has the default source at `/volume1/docker/iosbackup/data/backups/<SOURCE-UDID>`. This Synology example does not replace your actual mount configuration. Inspect custom mounts in Container Manager, or run this host command, which prints mount paths only (replace `iosbackup` if the container has another name):

```bash
docker inspect iosbackup --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}'
```

Replace the matching container mount prefix in Save Location with its host path, then append the source UDID. Changing Save Location does not move an old backup: also check previous locations. For a directly run Linux application, use its configured location without translating Docker mounts.

**Copy the whole UDID folder, preserving its structure:**

```text
<SOURCE-UDID>/
├── Info.plist
├── Manifest.plist
├── Status.plist
├── Manifest.db
├── 00/
├── 01/
├── …                 # Hashed data directories; keep the actual contents
└── ff/
```

Keep the four metadata/status files and all data files together. `Manifest.db` or photo files alone are insufficient. File presence is only an initial check. Read-only inspection of device name, system version, and backup date in `Info.plist` can help identify a backup; **do not edit plists, the database, or internal filenames**.

- Export CSV produces an inventory; Unpack produces the `_unback_` browsing copy. Neither is a restore package. There is currently no one-click Web download of a complete restore package.
- `/configs`, the application master key, and `/var/lib/lockdown` pairing records belong to [deployment recovery](instance-recovery.md). Do not put them in Apple's `MobileSync/Backup`.
- Leave encrypted backups encrypted. Restoration needs the **original password used for this backup**. A password stored by iOS Backup is not automatically available to Finder/Apple Devices. Admin credentials, the phone passcode, and the Apple Account password are not substitutes; resetting a password cannot decrypt an old backup.

## 3. Export to a separate staging directory on the computer

Allow local space for the entire backup. An archive, extracted folder, and imported copy each need space if retained together. Backups may contain private photos, messages, and account data; use storage you control and protected transfers.

### Synology / NAS: copy with a file manager

1. With the container stopped, open the host directory from step 2 in File Station or your NAS file manager.
2. Access an existing SMB share in Mac Finder or Windows File Explorer. **Copy** the complete source UDID folder into a new local `iosbackup-restore-staging` directory. Do not cut the original or mistake a network shortcut for a local copy.
3. Alternatively, compress/download the whole folder using the NAS file manager, then extract it in local staging. Locate the UDID folder containing the four files; some extractors add an outer archive-name folder.
4. Check for denied access, skipped files, or failed transfers. Compare source and copy file counts and total bytes, not allocated disk space. For large backups, prefer the archive and SHA-256 method below over relying only on a progress bar.

### Linux / SSH: optional archive method

Run on the **NAS/Linux host** after replacing all three variables. `export_parent` must already exist, be writable and protected, and be **outside the source backup directory**. The service must be stopped, the account must be able to read the entire backup, and free space must be sufficient.

```bash
(
  set -eu
  backup_root='/path/to/iosbackup/data/backups'
  source_udid='SOURCE-DEVICE-UDID'
  export_parent='/path/to/private-export'

  case "$source_udid" in ''|*[!A-Za-z0-9-]*) echo 'Invalid source UDID'; exit 1 ;; esac
  for file in Info.plist Manifest.plist Status.plist Manifest.db; do
    test -s "$backup_root/$source_udid/$file" || { echo "Missing: $file"; exit 1; }
  done
  umask 077
  export_dir=$(mktemp -d "$export_parent/iosbackup-export.XXXXXX")
  tar -czf "$export_dir/backup.tar.gz" -C "$backup_root" "$source_udid"
  tar -tzf "$export_dir/backup.tar.gz" > /dev/null
  (cd "$export_dir" && sha256sum backup.tar.gz > backup.tar.gz.sha256)
  printf 'Export directory: %s\n' "$export_dir"
)
```

This creates a fresh export directory without replacing an earlier export. Compression **adds no encryption**. If reads, free space, or archiving fail, stop and redo the export; do not use a partial archive. NAS systems lacking tools such as `sha256sum` can use their file manager's checksum function.

Download both `backup.tar.gz` and `backup.tar.gz.sha256` through an existing SFTP/SMB connection into local staging. Verify the transfer before extracting your own archive:

| Computer | Run in the directory containing the archive |
| --- | --- |
| Mac Terminal | `shasum -a 256 -c backup.tar.gz.sha256` must report `OK` |
| Windows PowerShell | `Get-FileHash -Algorithm SHA256 .\backup.tar.gz`; compare Hash with the digest in `Get-Content .\backup.tar.gz.sha256`, ignoring letter case |

After a match, extract into a new empty directory. On Mac, double-click the `.tar.gz`. On Windows, use a compatible extractor, or run `tar -xzf ..\backup.tar.gz` from a newly created empty child directory. Find `<SOURCE-UDID>/Info.plist` at the correct level. Apple tools do not import the `.tar.gz` itself. Matching hashes prove identical transferred bytes, not backup completeness or restorability.

## 4. Import into the computer's backup directory and restore

| Computer | Directory and detailed instructions |
| --- | --- |
| Mac | [Finder: copy into MobileSync/Backup, check recognition, then restore](restore-finder.md) |
| Windows | [Apple Devices: locate MobileSync/Backup, check recognition, then restore](restore-apple-devices.md) |
| Experimental in-app restore | [Current entry points and limits](experimental.md): off by default, selects by target UDID, and has no separate source selector. Do not rename an old backup to attempt a new-phone restore. |

A whole-device restore changes the target's current data. Save anything still needed separately. Import steps apply to the original or another phone; a new phone may start at Hello, older iOS may require updating, and target capacity must be sufficient. Confirm recognition and possession of the original password before proceeding to device-writing steps. A password stored by the application is not proof that the computer has validated it.

Computer backups do not contain everything, including some content already synced to iCloud. Restoring is not a selective merge of one deleted file into the phone's current state.

## Check the restored data

Wait for restoration, restart, and subsequent synchronization, then unlock and check the photos, messages, contacts, and key app data you need. Sign in to relevant Apple Accounts and allow app downloads or iCloud sync as needed. A completion message alone does not establish that the desired data is present.

Record backup date, iOS Backup version, source/target models and iOS, computer OS and Apple tool version, encryption, and the recognition/password/restore/data-check results. Redact UDIDs, accounts, and content before reporting. Keep the NAS original and export copy; decide on the target's new backup schedule only after checking the result.

## Appendix: Apple references

This guide adds iOS Backup storage and export steps. The references describe Apple tool behavior (checked 2026-10-12):

- [Locate and manage computer backups](https://support.apple.com/en-us/108809)
- [Restore from a computer backup](https://support.apple.com/en-us/118105)
- [Forgotten encrypted-backup passwords](https://support.apple.com/en-us/108313)
- [Backups requiring a newer iOS version](https://support.apple.com/en-us/108811)
- [Transfer an old backup to a new device](https://support.apple.com/en-us/120001)
- [What computer backups include and exclude](https://support.apple.com/en-us/108771)
