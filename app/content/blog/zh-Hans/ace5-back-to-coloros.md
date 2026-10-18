---
title: 把一加 Ace 5 从非官方系统刷回 ColorOS 16，顺手把相机救了回来
desc: 从非官方系统回刷 ColorOS 16 的完整踩坑记录：三次翻车、一次相机闪退，以及 root 和 OTA 之间那点绕不开的事。
date: 2026-10-19
edit: 2026-10-19
---

## 起因

在做了近两个月的 Apple 生态用户之后，我最终还是决定放弃 Apple 生态，并打算把我原来的备用机 —— 这台一加 Ace 5 国行（代号 `giuliac`，型号 `PKG110`）—— 刷回 ColorOS 16 过渡使用，等待新机发售之后再做决定。

我一开始以为这活儿顶多是「下个包、进 fastboot、刷完重启」，结果整个过程下来，真正花时间的不是刷，而是**搞清楚为什么刷不进去**。

这篇就把整个过程记一遍，顺便把 root 和 OTA 的事也理一理，最后再说那个让我折腾到凌晨的相机闪退。

## 两条铁律

先把结论放前面，这两条是这次用真金白银换来的：

1. **固件分区在 bootloader 刷，逻辑分区在 fastbootd 刷**。混着来就会出现「分区明明在，就是写不进去」这种灵异现象。
2. **回锁放最后**。必须能开机、功能正常、能检测到 OTA 之后，才考虑 `fastboot flashing lock`。这次我没回锁，bootloader 保持 unlocked。

## 验包：不解 8GB 也能先看版本

手上的包是 ColorOS 16 全量 OTA，8.7 GB，51 个分区。刷之前总得确认一下这包对不对，但又不想先解压一遍。

好在 `payload.bin` 在 OTA zip 里是**未压缩存储**的，可以直接按偏移量读：

```powershell
# 先读 zip 里的 metadata
tar -xOf .\86d1d2fe214c4a87804106baa2d4af4a.zip 'META-INF/com/android/metadata'

# payload.bin 的起始偏移由 metadata 里的 ota-property-files 给出
# 直接按字节把开头那段 protobuf manifest 读出来，再全词匹配分区名
```

要看的字段就那几个：`android_version`、`version_name`、`product_name`、`pre-device`、`post-build`。这台机的 `pre-device` 是 `OP5D2BL1`，对上了才敢往下走。

解包用的是 `payload-dumper-go`：

```powershell
.\payload-dumper-go.exe -c 8 -o .\cos16_img .\86d1d2fe214c4a87804106baa2d4af4a.zip
```

payload 里写了 51 个分区，但 dumper 只产出 48 个镜像，`checkpoint_gc`、`otapreopt_script`、`qti_dynamic_partitions` 这三个本来就不该直接刷。

## 认镜像：别把 EROFS 当坏包

> 这一段不是我手动做的，是刷机过程中让 [omp](https://omp.sh/) 顺手校验镜像时踩到的。

解出来之后本来想校验一下，结果差点以为下到了坏包。

| 镜像 | 偏移 | 魔数 |
|---|---|---|
| `boot` / `init_boot` / `recovery` | 0 | `414E44524F494421`（`ANDROID!`） |
| `vendor_boot` | 0 | `564E4452424F4F54`（`VNDRBOOT`） |
| `dtbo` | 0 | `D7B7AB1E` |
| `vbmeta*` | 0 | `41564230`（`AVB0`） |
| `system` / `vendor` / `odm` / `my_*` | **1024** | `E2E1F5E0`（**EROFS**） |

坑就在最后一行：Android 16 的系统分区是 **EROFS**，不是 ext4。你要是按 ext4 的 `53EF` 去找，只会得出「镜像全坏了」的结论。而且 `dtbo` 的 `D7B7AB1E` 和 ext4 也长得有点像，别搞混。

## 刷写：两个模式，各干各的

进 fastbootd 之后先确认身份：

```powershell
fastboot devices
fastboot getvar product      # 期望 OP5D2BL1 / giuliac / PKG110
fastboot getvar is-userspace # 期望 yes
fastboot getvar current-slot # 期望 a
```

然后就是逐个刷。逻辑分区和大部分物理分区都可以 `--slot=all`，但这台机的逻辑分区**只存在于 `_a`**，所以对这堆分区用 `--slot=all` 会被拒，退回单槽就好。

刷完清数据、首启：

```powershell
fastboot reboot bootloader
fastboot -w
fastboot erase metadata
fastboot reboot
```

## 坑一：modem 在 fastbootd 里写不进去

第一个让我怀疑人生的报错：

```
Sending sparse 'modem_a' 1/1 (219896 KB)   OKAY
Writing 'modem_a'                          FAILED (remote: 'No such file or directory')
```

`getvar` 的表现更迷惑：

```
partition-size:modem_a  → FAILED (remote: 'Could not open partition')
partition-type:modem_a  → raw        ← 这条居然有值
is-logical:modem_a      → FAILED (remote: 'Partition not found')
```

分区一眼「存在」，但就是写不进去。

根因其实很简单：**fastbootd 是用户态，里面没有 `modem_a` 的块设备节点**，不是分区坏了。切回 bootloader 一查，`partition-size:modem_a` 是 `0x15E00000`，好得很。

所以 modem 得在 bootloader 里刷：

```powershell
fastboot reboot bootloader
fastboot flash --slot=a modem modem.img
```

一次过。

## 坑二：一加的 `my_*` 分区压根不存在

第二个坑更离谱。刷那 8 个 `my_*` 分区时全部失败，一开始我以为是 super 空间不够。

后来才想明白：**刷非官方系统时按 AOSP 布局重建了 super 分区表**，只留了 `system`、`system_ext`、`product`、`vendor`、`odm`、`system_dlkm`、`vendor_dlkm` 这套标准布局。一加自己那套 `my_product`、`my_stock`、`my_bigball`、`my_carrier`、`my_engineering`、`my_heytap`、`my_manifest`、`my_region` 全都没建。

不是空间不足，是**根本没这个分区**。

解法是先创建再刷：

```powershell
fastboot create-logical-partition my_stock_a 0x100000
fastboot flash --slot=a my_stock my_stock.img
```

占位尺寸随便给，`fastboot flash` 会自动 resize 到镜像实际大小。

顺便记一下这台机最终的尺寸，以后对得上号：

```
my_product      1520168960 → 0x5A9BF000
my_stock        4491419648 → 0x10BB5A000
my_region        7057408  → 0x6BB000
my_manifest       729088  → 0xB2000
modem           314667008 → 0x15E00000
```

## 坑三：`getvar` 的「不存在」有三种说法

这个坑不致命，但特别容易误判。我拿一个肯定不存在的分区名校准了一下语义：

| 查询 | 分区存在 | 分区不存在 |
|---|---|---|
| `partition-type:X` | `raw` | `FAILED (remote: 'Invalid partition')` |
| `partition-size:X` | `0x...` | `FAILED (remote: 'Could not open partition')` |
| `has-slot:X` | `yes` / `no` | `no`（**无报错**） |
| `is-logical:X` | `yes` / `no` | `FAILED (remote: 'Partition not found')` |

所以判断分区到底在不在，**只看 `partition-type` 和 `is-logical`**。`has-slot` 那个「不存在也返回 no」的设定，坑死人不偿命。

## 回刷完了，然后呢

刷完开机，电话、短信、双卡、Wi-Fi、蓝牙、NFC、指纹、充电都正常，相机（第三方）也能用。最硬的完整性证据是：**系统更新里能检测到 OTA**。到这一步，回刷算是成功了。

这里顺便把 root 和 OTA 的关系理一下，免得下次又忘。

### OTA 之后 root 会没

OTA 会覆盖 `boot`，KernelSU 的 patch 自然也就没了。这不是风险，重新 patch 就行。

### 重新 root：窗口期

刷回 ColorOS 之后，很快就收到了最新的官方 OTA 更新。装完之后先别点「立即重启」—— 这时候新镜像已经写进另一个槽位，旧系统的 root 还在，直接读出来就是：

```powershell
adb shell su -c "dd if=/dev/block/by-name/boot_b of=/data/local/tmp/boot_b.img"
adb pull /data/local/tmp/boot_b.img
```

优点是不用等全量包，镜像 100% 对版。缺点是**一重启窗口就关了**。

Ace 5 是 Android 13+ 的 GKI 机型，KernelSU patch 的是 `boot`，别刷到 `init_boot` 上。

### 更省事的做法：安装到未使用的插槽

KernelSU Manager 里有个「安装到未使用的插槽（OTA 后）」，直接把 patch 好的镜像写进另一个槽位，重启之后就是带 root 的新系统。比手动 dd 省事得多。

代价是它不会在电脑上留下原厂镜像的备份。真出问题想回滚，手上就没有那份 dump 出来的 `boot`。所以我这次还是先手动 dd 了一份，至少心里踏实。

还有个小细节：KernelSU 下 `ls /system/bin/su` 找不到是**正常现象**，它靠 execve hook，不是真的放了个 su 文件。别拿这个判断 root 丢没丢。

## 相机闪退：真正的长尾

系统刷好了，root 的事也想明白了，结果打开自带相机——**秒退**。

第三方相机一切正常，说明摄像头硬件、HAL、权限都没问题。崩溃日志也很固定：

```
java.lang.UnsatisfiedLinkError: dlopen failed: library "libCombineLutJni.so" not found
    at com.oplus.camera.combinelut.CombineLutJNI.<clinit>
    at com.oplus.ocs.camera.CombineLutHelper.<init>
    at com.oplus.camera.common.utils.Lut3dDataManager.<init>
```

加载原生库失败。那我先找这个库在哪：

```
$ adb shell find / -name libCombineLutJni.so
/my_product/lib64/libCombineLutJni.so
```

库在 `/my_product/lib64`，但相机是 PRODUCT App，它的 linker 命名空间只认 `/product/lib64:/system/product/lib64`，不会直接去看 `/my_product/lib64`。

正常情况应该由 overlay 把两者合并起来。`/vendor/etc/fstab.qcom` 里也确实写了：

```
overlay-overlay /product/lib64 overlay ... lowerdir=/my_region/lib64:/my_preload/lib64:/my_product/lib64:/my_heytap/lib64:/my_stock/lib64:/my_engineering/lib64:/product/lib64
```

结果一查 `/proc/mounts`，`/product/app`、`/product/priv-app`、`/product/lib64`、`/product/lib` 这**四个 overlay 全部没挂上**。同一份 fstab 里 `/product/etc/permissions` 和 `/product/framework` 倒是正常的。

手动复现挂载，内核直接告诉我原因：

```
overlayfs: failed to resolve '/my_preload/lib64': -2
```

`-2` 就是 ENOENT。**`/my_preload` 这个分区不存在。**

去掉它再挂，立刻成功，`/product/lib64/libCombineLutJni.so` 马上出现，相机也就能启动了。

完整因果链是这样的：

```
my_preload 分区缺失
  → /product/{app,priv-app,lib64,lib} 四个 overlay 挂载失败
  → /product/lib64 看不到 /my_product/lib64 里的库
  → 相机加载 libCombineLutJni.so 失败 → 闪退
```

fstab 里其实写了 `overlayfs_remove_missing_lowerdir`，按理说缺目录应该自动跳过。但本机启动路径实际执行的是原始 lowerdir 列表，那个滤波函数压根没被调用，所以缺目录就是硬 ENOENT。

### 为什么偏偏缺 `my_preload`

回到前面那个坑：刷非官方系统时，super 分区表按 AOSP 布局被重建，原厂的 `my_preload`、`my_company` 一起被删了。回刷的时候我只创建了 ColorOS 16 全量 OTA 里存在的分区，而**全量包不包含 `my_preload`**。

这两个是欧加的预装分区（社区叫「双广分区」），不随全量 OTA 更新，只在降级包 / 回退包 / 出厂镜像里有。

本机还留着证据：`/my_manifest/etc/my_preload.map` 里全是 `/my_preload/del-app/...` 的预装清单，说明出厂布局里本来就有它。

### 抢救：只取一个分区

我重新去下载了一个旧的全量降级包 `PKG110_16.0.9.400(CN01)`，里面带 `my_preload`（1.8 GB）和 `my_company`（336 kB）。

注意：**只抽分区，不刷整包**。这个包比当前系统旧，还带 `wipe=1` 和 `ota-downgrade=yes`，整包刷进去就是主动踩 ARB。

```powershell
.\payload-dumper-go.exe -p my_preload -o .\my_preload_16.0.9.400 .\670f63e2a29741578637222c6b7be73b.zip
```

抽出来的镜像 1,784,397,824 字节，EROFS，AVB 公钥 SHA-1 是 `1a130f9a...66f6`，和设备上 `/vendor/etc/oplus_avb.pubkey` 完全一致 —— 官方签名，能过 `avb_keys` 校验。

刷之前先看空间：super 总容量 13.58 GiB，已用 10.0 GiB 左右，剩 3.58 GiB，放 1.66 GiB 绰绰有余。

```powershell
adb reboot fastboot
fastboot getvar is-userspace   # 期望 yes

fastboot create-logical-partition my_preload_a 1784397824
fastboot flash --slot=a my_preload .\my_preload_16.0.9.400\my_preload.img
fastboot reboot
```

刷完 `my_preload_a` 挂在 dm-verity 上（`dm-29`，erofs），说明 hashtree 校验过了。再查 overlay：

```
overlay-overlay /product/lib64 ... lowerdir=/my_region/lib64:/my_preload/lib64:/my_product/lib64:...
```

四个 overlay 全回来了，库可见，相机启动后进程稳定存活，`dumpsys media.camera` 里能看到 active session，crash buffer 也没有新增记录。

搞定。

## 几句碎碎念

这次折腾下来，最大的感受是：**刷机真正难的不是刷，是理解「为什么这个分区刷不进去」**。

几个具体的教训：

- **别只看报错，要看报错背后的模式**。`modem` 写不进去和 `my_*` 写不进去，报错都模棱两可，但一个是 fastbootd 没有节点，一个是分区根本不存在，解法完全不同。
- **A/B 机型的「另一个槽位」是个免费的时间机器**。OTA 装完别急着重启，先把新镜像 dump 出来，能省掉后面等全量包的几个小时。
- **重建过 super 的机器，回官方的路不止是「刷回官方包」**。官方全量包里没有的分区，得去降级包里单独捞。
- **`my_preload.img` 记得留着**。以后只要重建 super（再刷非官方系统、整包线刷、回锁前重刷），都得重新创建并刷入这个分区，不然相机还会闪退。普通 OTA 不会覆盖它，不用担心。

最后，刷机有风险，变砖、丢数据都得自己扛。命令我都实际跑过，但你的机器未必和我的完全一样，动手前先备份。

就这样，去睡觉了。
