---
title: 把一加 Ace 5 從非官方系統刷回 ColorOS 16，順手把相機救了回來
desc: 從非官方系統回刷 ColorOS 16 的完整踩坑記錄：三次翻車、一次相機閃退，以及 root 和 OTA 之間那點繞不開的事。
date: 2026-10-19
edit: 2026-10-19
aiGenerated: true
aiReview: 基本核对
---

## 起因

在做了近兩個月的 Apple 生態用戶之後，我最終還是決定放棄 Apple 生態，並打算把我原來的備用機 —— 這臺一加 Ace 5 國行（代號 `giuliac`，型號 `PKG110`）—— 刷回 ColorOS 16 過渡使用，等待新機發售之後再做決定。

我一開始以爲這活兒頂多是「下個包、進 fastboot、刷完重啓」，結果整個過程下來，真正花時間的不是刷，而是**搞清楚爲什麼刷不進去**。

這篇就把整個過程記一遍，順便把 root 和 OTA 的事也理一理，最後再說那個讓我折騰到凌晨的相機閃退。

## 兩條鐵律

先把結論放前面，這兩條是這次用真金白銀換來的：

1. **固件分區在 bootloader 刷，邏輯分區在 fastbootd 刷**。混着來就會出現「分區明明在，就是寫不進去」這種靈異現象。
2. **回鎖放最後**。必須能開機、功能正常、能檢測到 OTA 之後，才考慮 `fastboot flashing lock`。這次我沒回鎖，bootloader 保持 unlocked。

## 驗包：不解 8GB 也能先看版本

手上的包是 ColorOS 16 全量 OTA，8.7 GB，51 個分區。刷之前總得確認一下這包對不對，但又不想先解壓一遍。

好在 `payload.bin` 在 OTA zip 裏是**未壓縮存儲**的，可以直接按偏移量讀：

```powershell
# 先讀 zip 裏的 metadata
tar -xOf .\86d1d2fe214c4a87804106baa2d4af4a.zip 'META-INF/com/android/metadata'

# payload.bin 的起始偏移由 metadata 裏的 ota-property-files 給出
# 直接按字節把開頭那段 protobuf manifest 讀出來，再全詞匹配分區名
```

要看的字段就那幾個：`android_version`、`version_name`、`product_name`、`pre-device`、`post-build`。這臺機的 `pre-device` 是 `OP5D2BL1`，對上了纔敢往下走。

解包用的是 `payload-dumper-go`：

```powershell
.\payload-dumper-go.exe -c 8 -o .\cos16_img .\86d1d2fe214c4a87804106baa2d4af4a.zip
```

payload 裏寫了 51 個分區，但 dumper 只產出 48 個鏡像，`checkpoint_gc`、`otapreopt_script`、`qti_dynamic_partitions` 這三個本來就不該直接刷。

## 認鏡像：別把 EROFS 當壞包

> 這一段不是我手動做的，是刷機過程中讓 [omp](https://omp.sh/) 順手校驗鏡像時踩到的。

解出來之後本來想校驗一下，結果差點以爲下到了壞包。

| 鏡像 | 偏移 | 魔數 |
|---|---|---|
| `boot` / `init_boot` / `recovery` | 0 | `414E44524F494421`（`ANDROID!`） |
| `vendor_boot` | 0 | `564E4452424F4F54`（`VNDRBOOT`） |
| `dtbo` | 0 | `D7B7AB1E` |
| `vbmeta*` | 0 | `41564230`（`AVB0`） |
| `system` / `vendor` / `odm` / `my_*` | **1024** | `E2E1F5E0`（**EROFS**） |

坑就在最後一行：Android 16 的系統分區是 **EROFS**，不是 ext4。你要是按 ext4 的 `53EF` 去找，只會得出「鏡像全壞了」的結論。而且 `dtbo` 的 `D7B7AB1E` 和 ext4 也長得有點像，別搞混。

## 刷寫：兩個模式，各幹各的

進 fastbootd 之後先確認身份：

```powershell
fastboot devices
fastboot getvar product      # 期望 OP5D2BL1 / giuliac / PKG110
fastboot getvar is-userspace # 期望 yes
fastboot getvar current-slot # 期望 a
```

然後就是逐個刷。邏輯分區和大部分物理分區都可以 `--slot=all`，但這臺機的邏輯分區**只存在於 `_a`**，所以對這堆分區用 `--slot=all` 會被拒，退回單槽就好。

刷完清數據、首啓：

```powershell
fastboot reboot bootloader
fastboot -w
fastboot erase metadata
fastboot reboot
```

## 坑一：modem 在 fastbootd 裏寫不進去

第一個讓我懷疑人生的報錯：

```
Sending sparse 'modem_a' 1/1 (219896 KB)   OKAY
Writing 'modem_a'                          FAILED (remote: 'No such file or directory')
```

`getvar` 的表現更迷惑：

```
partition-size:modem_a  → FAILED (remote: 'Could not open partition')
partition-type:modem_a  → raw        ← 這條居然有值
is-logical:modem_a      → FAILED (remote: 'Partition not found')
```

分區一眼「存在」，但就是寫不進去。

根因其實很簡單：**fastbootd 是用戶態，裏面沒有 `modem_a` 的塊設備節點**，不是分區壞了。切回 bootloader 一查，`partition-size:modem_a` 是 `0x15E00000`，好得很。

所以 modem 得在 bootloader 裏刷：

```powershell
fastboot reboot bootloader
fastboot flash --slot=a modem modem.img
```

一次過。

## 坑二：一加的 `my_*` 分區壓根不存在

第二個坑更離譜。刷那 8 個 `my_*` 分區時全部失敗，一開始我以爲是 super 空間不夠。

後來纔想明白：**刷非官方系統時按 AOSP 佈局重建了 super 分區表**，只留了 `system`、`system_ext`、`product`、`vendor`、`odm`、`system_dlkm`、`vendor_dlkm` 這套標準佈局。一加自己那套 `my_product`、`my_stock`、`my_bigball`、`my_carrier`、`my_engineering`、`my_heytap`、`my_manifest`、`my_region` 全都沒建。

不是空間不足，是**根本沒這個分區**。

解法是先創建再刷：

```powershell
fastboot create-logical-partition my_stock_a 0x100000
fastboot flash --slot=a my_stock my_stock.img
```

佔位尺寸隨便給，`fastboot flash` 會自動 resize 到鏡像實際大小。

順便記一下這臺機最終的尺寸，以後對得上號：

```
my_product      1520168960 → 0x5A9BF000
my_stock        4491419648 → 0x10BB5A000
my_region        7057408  → 0x6BB000
my_manifest       729088  → 0xB2000
modem           314667008 → 0x15E00000
```

## 坑三：`getvar` 的「不存在」有三種說法

這個坑不致命，但特別容易誤判。我拿一個肯定不存在的分區名校準了一下語義：

| 查詢 | 分區存在 | 分區不存在 |
|---|---|---|
| `partition-type:X` | `raw` | `FAILED (remote: 'Invalid partition')` |
| `partition-size:X` | `0x...` | `FAILED (remote: 'Could not open partition')` |
| `has-slot:X` | `yes` / `no` | `no`（**無報錯**） |
| `is-logical:X` | `yes` / `no` | `FAILED (remote: 'Partition not found')` |

所以判斷分區到底在不在，**只看 `partition-type` 和 `is-logical`**。`has-slot` 那個「不存在也返回 no」的設定，坑死人不償命。

## 回刷完了，然後呢

刷完開機，電話、短信、雙卡、Wi-Fi、藍牙、NFC、指紋、充電都正常，相機（第三方）也能用。最硬的完整性證據是：**系統更新裏能檢測到 OTA**。到這一步，回刷算是成功了。

這裏順便把 root 和 OTA 的關係理一下，免得下次又忘。

### OTA 之後 root 會沒

OTA 會覆蓋 `boot`，KernelSU 的 patch 自然也就沒了。這不是風險，重新 patch 就行。

### 重新 root：窗口期

刷回 ColorOS 之後，很快就收到了最新的官方 OTA 更新。裝完之後先別點「立即重啓」—— 這時候新鏡像已經寫進另一個槽位，舊系統的 root 還在，直接讀出來就是：

```powershell
adb shell su -c "dd if=/dev/block/by-name/boot_b of=/data/local/tmp/boot_b.img"
adb pull /data/local/tmp/boot_b.img
```

優點是不用等全量包，鏡像 100% 對版。缺點是**一重啓窗口就關了**。

Ace 5 是 Android 13+ 的 GKI 機型，KernelSU patch 的是 `boot`，別刷到 `init_boot` 上。

### 更省事的做法：安裝到未使用的插槽

KernelSU Manager 裏有個「安裝到未使用的插槽（OTA 後）」，直接把 patch 好的鏡像寫進另一個槽位，重啓之後就是帶 root 的新系統。比手動 dd 省事得多。

代價是它不會在電腦上留下原廠鏡像的備份。真出問題想回滾，手上就沒有那份 dump 出來的 `boot`。所以我這次還是先手動 dd 了一份，至少心裏踏實。

還有個小細節：KernelSU 下 `ls /system/bin/su` 找不到是**正常現象**，它靠 execve hook，不是真的放了個 su 文件。別拿這個判斷 root 丟沒丟。

## 相機閃退：真正的長尾

系統刷好了，root 的事也想明白了，結果打開自帶相機——**秒退**。

第三方相機一切正常，說明攝像頭硬件、HAL、權限都沒問題。崩潰日誌也很固定：

```
java.lang.UnsatisfiedLinkError: dlopen failed: library "libCombineLutJni.so" not found
    at com.oplus.camera.combinelut.CombineLutJNI.<clinit>
    at com.oplus.ocs.camera.CombineLutHelper.<init>
    at com.oplus.camera.common.utils.Lut3dDataManager.<init>
```

加載原生庫失敗。那我先找這個庫在哪：

```
$ adb shell find / -name libCombineLutJni.so
/my_product/lib64/libCombineLutJni.so
```

庫在 `/my_product/lib64`，但相機是 PRODUCT App，它的 linker 命名空間只認 `/product/lib64:/system/product/lib64`，不會直接去看 `/my_product/lib64`。

正常情況應該由 overlay 把兩者合併起來。`/vendor/etc/fstab.qcom` 裏也確實寫了：

```
overlay-overlay /product/lib64 overlay ... lowerdir=/my_region/lib64:/my_preload/lib64:/my_product/lib64:/my_heytap/lib64:/my_stock/lib64:/my_engineering/lib64:/product/lib64
```

結果一查 `/proc/mounts`，`/product/app`、`/product/priv-app`、`/product/lib64`、`/product/lib` 這**四個 overlay 全部沒掛上**。同一份 fstab 裏 `/product/etc/permissions` 和 `/product/framework` 倒是正常的。

手動復現掛載，內核直接告訴我原因：

```
overlayfs: failed to resolve '/my_preload/lib64': -2
```

`-2` 就是 ENOENT。**`/my_preload` 這個分區不存在。**

去掉它再掛，立刻成功，`/product/lib64/libCombineLutJni.so` 馬上出現，相機也就能啓動了。

完整因果鏈是這樣的：

```
my_preload 分區缺失
  → /product/{app,priv-app,lib64,lib} 四個 overlay 掛載失敗
  → /product/lib64 看不到 /my_product/lib64 裏的庫
  → 相機加載 libCombineLutJni.so 失敗 → 閃退
```

fstab 裏其實寫了 `overlayfs_remove_missing_lowerdir`，按理說缺目錄應該自動跳過。但本機啓動路徑實際執行的是原始 lowerdir 列表，那個濾波函數壓根沒被調用，所以缺目錄就是硬 ENOENT。

### 爲什麼偏偏缺 `my_preload`

回到前面那個坑：刷非官方系統時，super 分區表按 AOSP 佈局被重建，原廠的 `my_preload`、`my_company` 一起被刪了。回刷的時候我只創建了 ColorOS 16 全量 OTA 裏存在的分區，而**全量包不包含 `my_preload`**。

這兩個是歐加的預裝分區（社區叫「雙廣分區」），不隨全量 OTA 更新，只在降級包 / 回退包 / 出廠鏡像裏有。

本機還留着證據：`/my_manifest/etc/my_preload.map` 裏全是 `/my_preload/del-app/...` 的預裝清單，說明出廠佈局裏本來就有它。

### 搶救：只取一個分區

我重新去下載了一箇舊的全量降級包 `PKG110_16.0.9.400(CN01)`，裏面帶 `my_preload`（1.8 GB）和 `my_company`（336 kB）。

注意：**只抽分區，不刷整包**。這個包比當前系統舊，還帶 `wipe=1` 和 `ota-downgrade=yes`，整包刷進去就是主動踩 ARB。

```powershell
.\payload-dumper-go.exe -p my_preload -o .\my_preload_16.0.9.400 .\670f63e2a29741578637222c6b7be73b.zip
```

抽出來的鏡像 1,784,397,824 字節，EROFS，AVB 公鑰 SHA-1 是 `1a130f9a...66f6`，和設備上 `/vendor/etc/oplus_avb.pubkey` 完全一致 —— 官方簽名，能過 `avb_keys` 校驗。

刷之前先看空間：super 總容量 13.58 GiB，已用 10.0 GiB 左右，剩 3.58 GiB，放 1.66 GiB 綽綽有餘。

```powershell
adb reboot fastboot
fastboot getvar is-userspace   # 期望 yes

fastboot create-logical-partition my_preload_a 1784397824
fastboot flash --slot=a my_preload .\my_preload_16.0.9.400\my_preload.img
fastboot reboot
```

刷完 `my_preload_a` 掛在 dm-verity 上（`dm-29`，erofs），說明 hashtree 校驗過了。再查 overlay：

```
overlay-overlay /product/lib64 ... lowerdir=/my_region/lib64:/my_preload/lib64:/my_product/lib64:...
```

四個 overlay 全回來了，庫可見，相機啓動後進程穩定存活，`dumpsys media.camera` 裏能看到 active session，crash buffer 也沒有新增記錄。

搞定。

## 幾句碎碎念

這次折騰下來，最大的感受是：**刷機真正難的不是刷，是理解「爲什麼這個分區刷不進去」**。

幾個具體的教訓：

- **別隻看報錯，要看報錯背後的模式**。`modem` 寫不進去和 `my_*` 寫不進去，報錯都模棱兩可，但一個是 fastbootd 沒有節點，一個是分區根本不存在，解法完全不同。
- **A/B 機型的「另一個槽位」是個免費的時間機器**。OTA 裝完別急着重啓，先把新鏡像 dump 出來，能省掉後面等全量包的幾個小時。
- **重建過 super 的機器，回官方的路不止是「刷回官方包」**。官方全量包裏沒有的分區，得去降級包裏單獨撈。
- **`my_preload.img` 記得留着**。以後只要重建 super（再刷非官方系統、整包線刷、回鎖前重刷），都得重新創建並刷入這個分區，不然相機還會閃退。普通 OTA 不會覆蓋它，不用擔心。

最後，刷機有風險，變磚、丟數據都得自己扛。命令我都實際跑過，但你的機器未必和我的完全一樣，動手前先備份。

就這樣，去睡覺了。
