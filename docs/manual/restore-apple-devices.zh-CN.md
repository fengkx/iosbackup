# 在 Windows 上导入 NAS 备份并用 Apple Devices 恢复

[English](restore-apple-devices.md) · [恢复总览与 NAS 导出步骤](restore.zh-CN.md)

在 Microsoft Store 安装/更新 **Apple Devices（Apple 设备）**。先按[恢复总览的 NAS 导出步骤](restore.zh-CN.md)，从 NAS/Linux 导出完整的来源 UDID 文件夹到电脑本地暂存目录，并准备原加密备份密码。无需搬入 iOS Backup 的配置、主密钥或配对记录。

> **待真机验证：** 本文提供项目目录到 Apple 备份目录的具体步骤；本项目尚无 Apple Devices 识别、解密、整机恢复全部完成的验证记录。先完成识别检查，不能识别时不要继续改写手机。

## 1. 找到当前 Windows 用户的备份目录

Apple Devices / Microsoft Store 版 iTunes 的常见默认位置为：

```text
%USERPROFILE%\Apple\MobileSync\Backup
```

按 **Win+R** 粘贴该路径，或在文件资源管理器地址栏输入。`%USERPROFILE%` 展开为当前 Windows 用户的个人目录。不要使用 NAS 用户目录，也不放到 `Program Files`。

如已有 Apple Devices 备份，优先在应用选设备 → **常规（General）→ 管理备份 → 右键备份 → 在资源管理器中显示**，以实际位置为准。显示的是设备备份文件夹时，上一级才是 `Backup`。目录曾被迁移或重定向时，先确认实际磁盘和空间，不要随意更改链接。

首次使用且没有目录时，可从 `%USERPROFILE%` 起依次新建 `Apple`、`MobileSync`、`Backup`。这里只创建空目录，**不需要先给手机做一次新备份**。Apple 当前的位置说明从 `%USERPROFILE%` 引导查找，不能证明你的电脑没有自定义路径；复制后仍须用应用确认识别。

旧版、非 Microsoft Store 安装的 iTunes 通常使用 `%APPDATA%\Apple Computer\MobileSync\Backup`，与本页 Apple Devices 路线不同。不要向两处盲目各放一份；混装或位置不明确时，先通过“管理备份 → 在资源管理器中显示”核对。

## 2. 复制完整备份，不覆盖现有目录

1. 等电脑备份/同步结束，断开手机，退出 Apple Devices 和 iTunes。保留 NAS 原件及本地导出副本。
2. 将暂存目录中**整个来源 UDID 文件夹**复制到上一步的 `Backup` 下。保持来源 UDID 原名，即使要恢复到另一台手机也不改名。
3. 遇到同名目录或“替换/合并”提示时取消。可先通过“管理备份”的“归档”（若提供）保留已有备份并核对目录；或在无任务、应用退出且手机断开时，把整个冲突目录移到 `MobileSync\Backup` 之外的受保护位置，保留副本后再导入。不要合并不同时间的文件。
4. 核对复制无错误，最终层级应为：

   ```text
   %USERPROFILE%\Apple\MobileSync\Backup\
   └── <来源UDID>\
       ├── Info.plist
       ├── Manifest.plist
       ├── Status.plist
       ├── Manifest.db
       └── 00\ … ff\   （原有数据目录）
   ```

   不要放成 `Backup\data\backups\<来源UDID>` 或 `Backup\<来源UDID>\<来源UDID>`，也不要把四个文件散放在 `Backup` 根目录。先解压；网络快捷方式、CSV、`_unback_` 都不是原始备份。

## 3. 检查识别，再执行恢复

1. 打开 Apple Devices，用 USB 连接**目标手机**，解锁并按提示信任。在边栏选设备，进入“常规（General）”。原机丢失时连接新机即可。
2. 打开“管理备份”，核对来源名称和日期；再打开“恢复备份”（Restore Backup）的选择窗口。确认能选到导入的备份，先不要确认执行。能显示不证明密码正确或整机恢复兼容。
3. 确认目标手机重要内容另有保存、容量和 iOS 版本满足要求，并掌握原备份密码。选择备份后按需输入密码，确认“恢复”；保持电脑供电和 USB 连接，等待设备重启及同步完成。

使用**“恢复备份”（Restore Backup）**，不是用于出厂状态/系统恢复的“恢复 iPhone”（Restore iPhone）。也不要点“立即备份”试图让备份出现，避免更新同一设备的电脑备份。

停在“你好”的新机，在设置中选“从 Mac 或 PC”后接入电脑。已设置的新机若按迁移流程需重新进入设置助理，先保留当前数据，再按附录处理抹掉；可直接由应用管理的原机不需要统一先抹掉。

若提示备份需要较新 iOS，先升级；新机可能需临时完成设置、不传输数据，升级后再抹掉返回设置助理。不要改 `Info.plist` 绕过检查。若要求关闭“查找”，只对确定要恢复的**目标手机**按提示处理；不用因此关闭遗失原机的“查找”。

完成后按[恢复完成核对清单](restore.zh-CN.md#恢复完成后如何核对)检查数据与后续下载，并按需重新启用目标设备的“查找”等保护。保留原始备份，确认结果后再安排自动备份。

## 无法继续时

| 现象 | 检查与处理 |
| --- | --- |
| 列表为空或“恢复备份”不可用 | 确认设备已识别和信任，再检查 Windows 用户、实际目录、层级、四个文件和复制结果。重开 Apple Devices；仍不识别时保留副本和错误，不通过抹机或改名猜测修复。 |
| 复制拒绝访问或跳过文件 | 用能读取整份备份的账号重新导出，目标应由当前 Windows 用户可读。不要给所有人完全控制权限或上传备份求助。 |
| 密码错误 | 使用这份备份的原密码，不是 Windows、NAS、锁屏或 Apple 账户密码。重置密码不能打开旧备份。 |
| 不兼容、损坏或空间不足 | 核对摘要、iOS 版本、电脑和手机空间；评估另一份已保留的完整备份，不混拼文件或反复覆盖导入目录。 |
| 新机只恢复部分内容 | 等待同步、重新登录 App，核对备份日期和 iCloud 内容范围；成功提示不代表所有误删数据可找回。 |

## 附录：Apple 官方参考

- [安装 Apple Devices](https://support.apple.com/zh-cn/guide/devices-windows/mchl5ded2763/windows)
- [Apple Devices 的备份和恢复流程](https://support.apple.com/zh-cn/guide/devices-windows/mchla3c8ed03/windows)
- [电脑备份目录与管理备份](https://support.apple.com/zh-cn/108809)
- [迁移到另一台设备](https://support.apple.com/zh-cn/120001)
- [备份要求较新版本 iOS](https://support.apple.com/zh-cn/108811)
