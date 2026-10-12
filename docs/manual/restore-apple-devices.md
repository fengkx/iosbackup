# Import a NAS backup on Windows and restore with Apple Devices

[简体中文](restore-apple-devices.zh-CN.md) · [Restore overview and NAS export](restore.md)

Install/update **Apple Devices** from Microsoft Store. Follow the [NAS export steps in the restore overview](restore.md) to export the complete source UDID folder from NAS/Linux into local staging and prepare its original encryption password. Do not transfer iOS Backup configuration, master keys, or pairing records into Windows.

> **Pending device validation:** These instructions describe moving the project's backup into Apple's backup directory. This project has no recorded complete Apple Devices recognition, decryption, and real-device restore exercise. Check recognition first; stop if it fails.

## 1. Locate the current Windows user's backup directory

The common default for Apple Devices / Microsoft Store iTunes is:

```text
%USERPROFILE%\Apple\MobileSync\Backup
```

Paste it into **Win+R** or File Explorer's address bar. `%USERPROFILE%` expands to the current Windows user's profile. Do not use a NAS user's path or `Program Files`.

If you already have an Apple Devices backup, prefer selecting the device → **General → Manage Backups → right-click a backup → Show in Explorer** to confirm the actual location. If it opens the device backup folder, its parent is `Backup`. If storage was relocated or redirected, establish the actual disk and free space before proceeding; do not change links speculatively.

On first use, when absent, create `Apple`, `MobileSync`, and `Backup` beneath `%USERPROFILE%`. Only empty directories are needed: **do not create a new phone backup just to initialize them**. Apple's current location guide starts from `%USERPROFILE%`; it does not establish that your machine has no custom location. Recognition must still be checked after copying.

Older non-Store iTunes commonly uses `%APPDATA%\Apple Computer\MobileSync\Backup`, a different route from Apple Devices. Do not blindly place copies in both. If installations or locations are ambiguous, establish the location through Manage Backups → Show in Explorer.

## 2. Copy the complete backup without replacing existing folders

1. Wait for computer backup/sync to finish, disconnect the phone, and quit Apple Devices and iTunes. Keep the NAS original and local export.
2. Copy the **whole source UDID folder** from staging directly into the identified `Backup` directory. Preserve the source UDID even for another target phone.
3. Cancel same-name replacement or merge prompts. Use Archive in Manage Backups if available, then check the actual directory. Alternatively, with no jobs, the application closed, and the phone disconnected, move the entire conflicting folder to protected storage outside `MobileSync\Backup`, retaining a copy before import. Never merge files from different dates.
4. Check that copying finished without errors and the structure is:

   ```text
   %USERPROFILE%\Apple\MobileSync\Backup\
   └── <SOURCE-UDID>\
       ├── Info.plist
       ├── Manifest.plist
       ├── Status.plist
       ├── Manifest.db
       └── 00\ … ff\   (original data directories)
   ```

   Avoid `Backup\data\backups\<SOURCE-UDID>`, double UDID nesting, or metadata directly in the `Backup` root. Extract archives first. Network shortcuts, CSV files, and `_unback_` are not the original backup.

## 3. Check recognition before restoring

1. Open Apple Devices, connect the **target phone** by USB, unlock it, and accept the trust prompt. Select the device and General. A replacement phone is sufficient when the original is lost.
2. Check source name and date in Manage Backups, then in the Restore Backup selector. Confirm that the imported backup is selectable before executing. Recognition does not establish a valid password or whole-device compatibility.
3. Save important current target data, check capacity and iOS compatibility, and have the original backup password. Select the backup, supply its password when requested, and confirm Restore. Keep power and USB connected through restart and synchronization.

Use **Restore Backup**, not the factory/system Restore iPhone control. Do not click Back Up Now to make the imported backup appear: that may update the computer backup for the same device.

A new phone at Hello can select From Mac or PC during setup. If a configured replacement must return to Setup Assistant for migration, protect its data before following the appendix's erase procedure. An original phone already managed by the app does not universally need erasing first.

If the backup requires newer iOS, update first. A new phone may need temporary setup without transferring data, an update, and then an erase to return to setup. Do not bypass this by editing `Info.plist`. If Find My must be disabled, act on the confirmed **target phone** only; do not disable the lost original's Find My for this purpose.

Follow the [data verification checklist](restore.md#check-the-restored-data), allow subsequent downloads, and re-enable target protections such as Find My as appropriate. Retain the original backup; arrange automatic backups only after checking the result.

## If you cannot continue

| Symptom | Check and action |
| --- | --- |
| Empty list or unavailable Restore Backup | First confirm device recognition/trust, then the Windows user, actual directory, nesting, four metadata files, and completed copy. Reopen Apple Devices. If still unrecognized, retain the copy/error; do not guess by erasing or renaming. |
| Access denied or skipped files | Re-export with an account that can read the whole backup. The current Windows user needs access to the destination. Do not grant Everyone full control or upload a backup for troubleshooting. |
| Wrong password | Use the original password for this backup, not Windows, NAS, phone, or Apple Account credentials. Resetting a password cannot open the old backup. |
| Incompatibility, corruption, or insufficient space | Check hashes, iOS, and computer/phone capacity. Assess another retained complete backup rather than splicing files or repeatedly overwriting imports. |
| Only some content returns on a new phone | Allow synchronization, sign in to apps, and check backup date and iCloud scope. Success does not guarantee that every deleted item can be recovered. |

## Appendix: Apple references

- [Install Apple Devices](https://support.apple.com/guide/devices-windows/mchl5ded2763/windows)
- [Apple Devices backup and restore](https://support.apple.com/guide/devices-windows/mchla3c8ed03/windows)
- [Backup locations and management](https://support.apple.com/en-us/108809)
- [Transfer to another device](https://support.apple.com/en-us/120001)
- [Backups requiring newer iOS](https://support.apple.com/en-us/108811)
