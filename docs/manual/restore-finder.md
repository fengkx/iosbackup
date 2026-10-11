# Restore with Finder on Mac: preparation and validation scope

[简体中文](restore-finder.zh-CN.md) · [Restore overview](restore.md)

> **Real-device validation pending.** Apple documents computer-backup restoration, but this project has not completed recognition, decryption, and restoration of its backups with Finder on Mac. This is not a validated NAS-import-and-restore tutorial.

## Before starting

Complete the [overview](restore.md) checks for independent copies, backup time, encryption password, target capacity, and OS version. Use Finder on macOS Catalina 10.15 or later.

The main flow can be shared by original and replacement devices. Erasing a configured replacement or updating its OS depends on the branches linked in the overview and Apple's current instructions. Preserve current data before changing the target's state.

## NAS backup import still needs testing

Keep a complete copy of the original backup on a separate computer. Do not edit internal files or rename its UDID to match the target. Apple's [backup-location guidance](https://support.apple.com/en-us/108809) explains its tools' backup storage; it does not establish that copying this project's directory will make it recognizable.

A validated tutorial must record OS/tool versions, directory layout, source date and encryption, whether the correct backup is listed, acceptance of the original password, and the eventual restore result. These steps are still pending, so no unverified directory-overwrite commands are provided.

If the backup is not listed, stop at recognition and retain the original and error details. Repeatedly replacing directories, resetting backup passwords, or erasing the phone is not an established fix.

## Apple's official restoration instructions

For a computer backup already recognized correctly, follow [Apple's restore instructions](https://support.apple.com/en-us/118105): connect and trust the device, select it and Restore Backup, check the date, and supply the original encryption password if asked. Keep it connected through restoration and subsequent synchronization.

This official flow does not replace NAS-import validation. A listed backup is not yet a verified restorable backup.

## Check restored data

Follow the [overview's result checks](restore.md#check-the-result-after-restoration), sample required data, and record outcomes. Recognition, decryption, restoration, and data checks must all complete before marking that device/OS/encryption combination as validated.

For the in-app route, see [Experimental operations](experimental.md).
