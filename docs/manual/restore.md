# Restore device data: check the backup first

[简体中文](restore.zh-CN.md) · [Operations manual](../OPERATIONS.md)

After losing a phone or accidentally deleting data, first check whether a backup contains what you need. This preparation applies to both the original and a replacement device; OS version, capacity, and setup state may require different steps.

> **Validation status: real-device testing pending.** This project has no recorded end-to-end result for Finder / Apple Devices recognizing, decrypting, and restoring a backup it produced. Apple's instructions describe restoring computer backups; they do not establish compatibility with this project's backups. In-app whole-device restore also remains Experimental and disabled by default.

## Protect the existing backup first

1. After accidental deletion, disable future automatic backups in device settings. Do not immediately run another backup. Disabling a schedule does not cancel an active job; check its state and wait until there are no active writes.
2. With no backup or other write operations active, retain a consistent independent copy using the [deployment copy guide](instance-recovery.md). Inspect a copy instead of moving or modifying the only original.
3. Check the source device, backup time, and required content. The project incrementally updates the same device directory; **each run does not retain a historical version**. A later backup may reflect the deletion. Look for a separate copy or NAS snapshot from before the deletion. A recent successful job does not establish that the content is still present.

If the phone is lost, its NAS backup may still be available. Locate the saved backup and password first; removing the old device from management is not a recovery step.

## Find the complete original backup set

Under the configured backup root, the source UDID directory normally contains `Info.plist`, `Manifest.plist`, `Status.plist`, `Manifest.db`, and hashed data directories. Check your actual mount configuration in [devices and storage](device-storage.md). Their presence is an initial check, not proof of restorability.

- Retain the complete, consistent original directory and original encrypted-backup password.
- A CSV is only a file inventory. Experimental `_unback_` output is not a replacement restore package either.
- The administrator password, application master key, and device passcode cannot replace the encrypted-backup password. [Resetting the backup password does not decrypt older backups](https://support.apple.com/en-us/108313).

## Prepare the target device

| Check | What to confirm |
| --- | --- |
| Contents | [Computer backups do not include everything](https://support.apple.com/en-us/108771), including some content already synced to iCloud. Not every accidental deletion can be recovered from a local backup. |
| OS version | An older iOS may not accept a backup made with a newer version. Follow [Apple's version guidance](https://support.apple.com/en-us/108811) before reassessing. |
| Capacity | The device needs enough capacity for restored content; the backup directory size alone is not sufficient evidence. |
| Current data | Whole-device restore changes the target's existing state; it does not selectively merge a few files. Preserve current data you still need separately. |
| Replacement setup | Apple's [transfer guide](https://support.apple.com/en-us/120001) requires erasing an already-set-up new device before its migration procedure. Do not apply this requirement indiscriminately to every same-device restore. Confirm the route and copies before following Apple's steps. |
| Accounts and passwords | Prepare the backup password and Apple Account needed for setup, activation, and downloading content again. |

## Choose a restore route

| Route | Current scope |
| --- | --- |
| [Mac: Finder](restore-finder.md) | Preferred documentation route. Preparation and official instructions are provided; recognition and actual restore of this project's backups still need testing. |
| [Windows: Apple Devices](restore-apple-devices.md) | Preferred documentation route. Preparation and official instructions are provided; recognition and actual restore of this project's backups still need testing. |
| [In-app Experimental restore](experimental.md) | Disabled by default and not validated end to end on real devices. It currently selects a backup using the target UDID; do not assume it supports an old phone's backup on a different-UDID replacement. Do not rename directories to bypass this. |

If the only available backup has not been validated, a new experiment is not an established recovery method. Preserve the original and a consistent copy before evaluating routes.

## Check the result after restoration

After restoration and subsequent synchronization finish, unlock the device and sample the photos, messages, contacts, and essential app data you need. Some content may require account sign-in or downloading again. Record the source backup time, target model/iOS, tool version, encryption state, and actual checks. A completion marker or reboot alone does not prove that all required data was recovered.

Use this record to establish the tested scope; one successful combination does not establish compatibility for all devices and systems. On failure, retain the original and record tool errors. Remove device identifiers, accounts, and backup content before sharing.

Recovering the NAS service and its settings instead? Read [deployment recovery](instance-recovery.md). For file lists and extraction boundaries, read [backup inspection](inspection.md).
