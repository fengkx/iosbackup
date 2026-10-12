# Import a NAS backup on Mac and restore with Finder

[简体中文](restore-finder.zh-CN.md) · [Restore overview and NAS export](restore.md)

For macOS Catalina 10.15 or later. First follow the [NAS export steps in the restore overview](restore.md) to export the complete source UDID folder from NAS/Linux into local staging, and have its original encryption password ready. Finder uses this original backup, not iOS Backup configuration or pairing records.

> **Pending device validation:** These instructions describe moving the project's backup into Apple's backup directory. This project has no recorded complete Finder recognition, decryption, and real-device restore exercise. Check recognition before proceeding; stop if it fails.

## 1. Place the backup in the Mac backup directory

1. Wait for computer backup/sync tasks to finish, disconnect the phone temporarily, and close the device-management window. Keep the NAS original and local export; work with a copy.
2. In Finder, press **Shift–Command–G** and paste the path below. `~` means the logged-in Mac user's home, not a NAS account:

   ```text
   ~/Library/Application Support/MobileSync/Backup/
   ```

   If missing, create the empty directory in Terminal, then use Go to Folder again. Do not add `sudo`:

   ```bash
   mkdir -p "$HOME/Library/Application Support/MobileSync/Backup"
   ```

3. Copy the **entire source UDID folder** from staging directly into `Backup`. Keep its name even when the target is another phone. Do not include the outer `data/backups` or archive-name directory.
4. If a folder with the same name exists, **cancel: do not merge or replace**. For a recognized existing backup, use Archive in Finder's Manage Backups if available, then inspect the resulting directory. Alternatively, with no tasks and the phone disconnected, move the entire conflicting folder to protected storage outside `MobileSync/Backup`, keeping an independent copy before importing. Never combine files from two backup sets.
5. Check that copying finished and the files are readable. The layout should be:

   ```text
   ~/Library/Application Support/MobileSync/Backup/
   └── <SOURCE-UDID>/
       ├── Info.plist
       ├── Manifest.plist
       ├── Status.plist
       ├── Manifest.db
       └── 00/ … ff/   (original data directories)
   ```

   `Backup/<SOURCE-UDID>/<SOURCE-UDID>/Info.plist` is nested too deeply; `Backup/Info.plist` lacks the device folder. Correct only the imported copy's outer placement, leaving its internals unchanged. Do not substitute a symlink to the NAS for a local copy.

## 2. Check that Finder recognizes the backup

1. Connect the **target phone** by USB, unlock it, and respond to the computer trust prompt. Select the device in Finder's sidebar and open General. A replacement phone does not require the lost original to be present.
2. In Manage Backups, check the source name and date. Use Show in Finder, when available, to confirm the imported directory.
3. Open the Restore Backup selection window and check the backup name, time, and encryption indication before confirming execution. A listed backup proves recognition only, not a valid password or a successful whole-device restore.

Use **Restore Backup**, not Restore iPhone, which is for factory/system restoration. The backup selector is not an arbitrary file picker: it cannot directly import a `.tar.gz` or `Manifest.db`.

## 3. Restore to the original or another phone

1. Save important existing target data elsewhere, check capacity, and have the original backup password and necessary Apple Account credentials. Leave the NAS original intact.
2. A device already accessible in Finder can continue through General → Restore Backup. A new phone at Hello can select From Mac or PC during setup. If a configured replacement phone must return to Setup Assistant for migration, protect its current data before following the appendix's erase instructions; erasing first is not a universal requirement for every same-phone restore.
3. If iOS is too old, update it. A phone in Setup Assistant may need temporary setup without transferring data, an update, and then an erase to return to setup. Follow the referenced version procedure only after protecting existing data and backup copies. Do not edit `Info.plist` to fake compatibility.
4. Select the checked backup, supply its **original encryption password** when requested, and confirm Restore. If prompted to disable Find My, act only on the **target device** after deciding to restore and retaining account credentials; this does not require disabling Find My on a lost original phone.
5. Keep power and USB connected through restoration, restart, and synchronization. Follow the [data verification checklist](restore.md#check-the-restored-data), and re-enable protections such as Find My on the target as appropriate.

## If you cannot continue

| Symptom | Check and action |
| --- | --- |
| Source absent from the list | Check the Mac user, `Backup/<SOURCE-UDID>/Info.plist` depth, all four metadata files and data directories, completed transfer, and current-user read access. Reconnect and reopen Finder. If still unrecognized, retain the copy and message as an unresolved compatibility result. |
| Only today's computer backup appears | Check whether a same-name backup conflicted or was updated. Do not use Back Up Now to make an import appear; compare against the independent export. |
| Wrong password | Use this backup's original password. Resetting backup encryption, turning encryption off, or editing a plist cannot decrypt the old backup. |
| Corruption, incompatibility, or insufficient space | Check transfer hashes/errors, target iOS, and computer/phone capacity. Do not splice in files from another backup or repeatedly erase the phone. |
| Missing restored content | Allow synchronization and check backup date, iCloud scope, and app sign-ins. Export success does not mean the deleted content existed in that backup. |

## Appendix: Apple references

- [Mac backup and restore controls](https://support.apple.com/guide/mac-help/mchla3c8ed03/mac)
- [Backup locations and management](https://support.apple.com/en-us/108809)
- [Restore from a computer backup](https://support.apple.com/en-us/118105)
- [Transfer to another device](https://support.apple.com/en-us/120001)
- [Backups requiring newer iOS](https://support.apple.com/en-us/108811)
