# 从 NAS / Linux 备份恢复手机数据

[English](restore.md) · [返回操作手册](../OPERATIONS.zh-CN.md)

手机丢失或数据误删后，恢复路线是：**在 iOS Backup 确认来源 → 从 NAS/Linux 复制完整备份 → 放到电脑的备份目录 → 用 Finder 或 Apple Devices 恢复到手机**。原手机不在身边，也可以先导出备份。另一台手机使用同一份来源备份，不要把目录改成新手机的 UDID。

> **验证范围：** 导出步骤依据本项目的实际存储布局；电脑端步骤依据 Apple 的备份管理与恢复流程整理。本项目尚无这条路线从识别、解密到真机恢复的完整成功记录。可以先复制和检查识别；识别失败时停在该步骤，不要先抹掉手机来试错。

## 1. 在 iOS Backup 确认来源并暂停写入

1. 展开**来源设备**的卡片，记录设备名称、UDID、最近成功备份时间。在“备份设置”记录“保存位置”，关闭“自动备份”并保存。UDID 对应磁盘上的设备目录名，不要只凭设备昵称挑文件夹。
2. 确认备份时间早于误删时间。项目持续更新同一设备的备份集，**不会自动保留每次运行的历史版本**。若已备份过删除后的状态，寻找误删前的 NAS 快照或独立副本；新的成功记录不代表旧数据仍在。
3. 等所有设备的备份、解包、恢复等活动任务结束，再停止 iOS Backup 容器，避免复制期间变化。关闭计划不会取消正在运行的任务。群晖可在 Container Manager 停止对应容器；Compose 部署可在实际部署目录运行：

   ```bash
   docker compose stop iosbackup
   ```

   停服务会暂停其他设备的计划。不要删除容器数据或强杀正在写入的任务。复制与核对结束后可用 `docker compose start iosbackup` 启动原实例；来源设备的自动备份先保持关闭。

Web UI 不可用时，可根据部署挂载直接找到备份；不需要为了导出而重新备份、重新配对或开启“允许恢复”。已移除设备的备份仍可能在磁盘上，见[设备与存储](device-storage.zh-CN.md)。

## 2. 找到宿主机上的完整设备目录

“保存位置”是**容器内的备份父目录**，其下才是来源 UDID 目录。官方 Compose 映射 `./data/backups:/backups`；`./` 相对于部署目录。以下 UDID 均为占位符：

| Web UI 保存位置 | 容器里的完整备份 | NAS/Linux 宿主机上的完整备份 |
| --- | --- | --- |
| `/backups` | `/backups/<来源UDID>` | `<部署目录>/data/backups/<来源UDID>` |
| `/backups/family` | `/backups/family/<来源UDID>` | `<部署目录>/data/backups/family/<来源UDID>` |

例如部署目录为 `/volume1/docker/iosbackup`，默认来源就是 `/volume1/docker/iosbackup/data/backups/<来源UDID>`。这只是群晖示例，以实际挂载为准。自定义挂载可在 Container Manager 的卷设置查看，或在主机上执行只显示挂载关系的命令（容器名不同时替换 `iosbackup`）：

```bash
docker inspect iosbackup --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}'
```

将“保存位置”对应的容器挂载前缀换成宿主机路径，再接上来源 UDID。改过保存位置时，旧备份不会自动搬过去，也要检查以前的位置。直接在 Linux 运行程序时使用实际配置的保存位置，无需换算 Docker 挂载。

**复制整个 UDID 文件夹，保持内部结构：**

```text
<来源UDID>/
├── Info.plist
├── Manifest.plist
├── Status.plist
├── Manifest.db
├── 00/
├── 01/
├── …                 # 散列数据目录；以实际备份内容为准
└── ff/
```

四个清单/状态文件与全部数据文件一起保留，不能只取 `Manifest.db` 或照片文件。文件存在只是初步检查。可只读查看 `Info.plist` 的设备名称、系统版本、备份时间来辅助匹配，**不要编辑 plist、数据库或内部文件名**。

- “导出 CSV”只是清单，“解包…”的 `_unback_` 是浏览副本，都不能当作恢复包。当前没有一键下载完整恢复包的 Web 按钮。
- `/configs`、应用主密钥和 `/var/lib/lockdown` 配对记录用于[恢复服务实例](instance-recovery.zh-CN.md)，不放进 Apple 的 `MobileSync/Backup`。
- 加密备份保留加密状态，恢复时输入**创建这份备份时的原备份密码**。NAS 上保存过密码，不等于 Finder/Apple Devices 能自动读取；管理员、锁屏和 Apple 账户密码不能替代它。重置密码不能解密旧备份。

## 3. 导出到电脑的独立暂存目录

电脑需容纳完整备份；若保留压缩包、解压目录和导入副本，要分别预留空间。备份可能含私人照片、消息和账号数据，使用自己控制的磁盘与受保护的传输方式。

### 群晖 / NAS：通过文件管理器复制

1. 容器停止后，在 File Station 或 NAS 文件管理器中打开上一步确定的宿主机目录。
2. 通过已有 SMB 共享在 Mac Finder 或 Windows 文件资源管理器中访问它，**复制**整个来源 UDID 文件夹到电脑新建的 `iosbackup-restore-staging` 文件夹。不要剪切原件，也不要把网络快捷方式当作本地副本。
3. 也可用 NAS 的压缩/下载功能取回整个目录，在电脑暂存目录解压。核对最终找到的是包含四个文件的 UDID 文件夹；某些工具会额外套一层压缩包名称文件夹。
4. 确认没有权限不足、跳过或失败提示，比较源与副本的文件数量和总字节数（不是“占用空间”）。大型备份优先用下方归档加 SHA-256 校验，避免仅靠进度条判断。

### Linux / SSH：可选的打包方式

在 **NAS/Linux 主机**执行。先替换三项变量；`export_parent` 是已存在、可写且**在来源备份目录之外**的受保护目录。确认服务已停止、当前账号能读取整份备份，并有足够空间。

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

命令生成新的导出目录，不覆盖已有导出；压缩**不会额外加密**。有读文件、空间或打包错误时停止并重做，不使用半成品。没有 `sha256sum` 等工具的 NAS 可用其文件管理器的校验功能。

通过已有 SFTP/SMB 连接把 `backup.tar.gz` 和 `backup.tar.gz.sha256` 一起下载到电脑暂存目录。先核对传输，再解压自己生成的归档：

| 电脑 | 在存放压缩包的目录执行 |
| --- | --- |
| Mac 终端 | `shasum -a 256 -c backup.tar.gz.sha256`，必须显示 `OK` |
| Windows PowerShell | `Get-FileHash -Algorithm SHA256 .\backup.tar.gz`，将 Hash 与 `Get-Content .\backup.tar.gz.sha256` 中的摘要比较，忽略字母大小写 |

一致后解压到新的空文件夹。Mac 可双击 `.tar.gz`；Windows 可用支持此格式的解压工具，或在已建好的空文件夹运行 `tar -xzf ..\backup.tar.gz`。检查 `<来源UDID>/Info.plist` 这一层；不要把 `.tar.gz` 本身交给 Apple 工具。摘要一致证明传输字节相同，不证明备份完整或可恢复。

## 4. 放到电脑备份目录并恢复

| 电脑 | 导入位置与详细步骤 |
| --- | --- |
| Mac | [Finder：放入 MobileSync/Backup，检查识别并恢复](restore-finder.zh-CN.md) |
| Windows | [Apple Devices：定位 MobileSync/Backup，检查识别并恢复](restore-apple-devices.zh-CN.md) |
| 站内实验恢复 | [现有入口与限制](experimental.zh-CN.md)：默认关闭，按目标设备 UDID 取备份，没有独立来源选择器；不要通过改名旧备份尝试新机恢复 |

整机恢复会改变目标设备当前数据，先单独保存仍需保留的内容。原机和另一台手机共用导入步骤；新机可能从“你好”设置流程进入，系统太旧需先升级，目标容量也须足够。先确认备份被识别，并掌握原密码，再进入会改写设备的步骤；应用保存过密码不代表电脑已经验证过它。

电脑备份不包含所有内容，例如部分已同步到 iCloud 的数据；恢复也不是把一个误删文件合并回当前手机。

## 恢复完成后如何核对

等待恢复、重启及后续同步完成，再解锁检查需要的照片、消息、联系人和关键应用数据。登录相关 Apple 账户，按需重新下载 App 或同步 iCloud 内容。完成提示本身不能证明目标数据齐全。

记录来源备份时间、iOS Backup 版本、源/目标机型与 iOS、电脑系统与 Apple 工具版本、是否加密，以及识别、密码、恢复、抽查四项结果。反馈前遮去 UDID、账号及内容。保留 NAS 原件与导出副本，确认结果后再决定目标设备的新备份计划。

## 附录：Apple 官方参考

本页补充 iOS Backup 的存储和导出过程；以下资料用于核对 Apple 工具行为（核对日期：2026-10-12）：

- [查找和管理电脑上的备份](https://support.apple.com/zh-cn/108809)
- [从电脑备份恢复设备](https://support.apple.com/zh-cn/118105)
- [忘记加密备份密码](https://support.apple.com/zh-cn/108313)
- [备份需要较新版本 iOS 时的处理](https://support.apple.com/zh-cn/108811)
- [旧设备备份迁移到新设备](https://support.apple.com/zh-cn/120001)
- [电脑备份包含与不包含的内容](https://support.apple.com/zh-cn/108771)
