---
title: Flashing a OnePlus Ace 5 Back to ColorOS 16 from an Unofficial ROM, and Fixing the Camera Along the Way
desc: 'A full write-up of flashing back to ColorOS 16 from an unofficial ROM: three failures, a camera crash, and the unavoidable mess around root and OTA.'
date: 2026-10-19
edit: 2026-10-19
aiGenerated: true
aiReview: 基本核对
aiTranslated: true
---

## Background

After nearly two months as an Apple ecosystem user, I finally decided to leave the Apple ecosystem and flash my old backup phone — this China-market OnePlus Ace 5 (codename `giuliac`, model `PKG110`) — back to ColorOS 16 as a stopgap while waiting for the new phone to go on sale.

At first I thought the job would be nothing more than "download a package, boot into fastboot, flash, reboot." But the part that actually took time wasn't the flashing — it was **figuring out why the flash kept failing**.

This post records the whole process, tidies up the root and OTA situation along the way, and finally covers the camera crash that kept me up until the early morning.

## Two iron rules

Let me put the conclusions first. These two rules cost me real money this time:

1. **Firmware partitions are flashed in the bootloader; logical partitions are flashed in fastbootd.** Mixing them produces the paranormal symptom of "the partition is clearly there, but it simply won't accept writes."
2. **Leave relocking for last.** Only consider `fastboot flashing lock` after the phone boots, everything works, and OTA detection succeeds. I did not relock this time; the bootloader remains unlocked.

## Verifying the package: check the version without extracting 8 GB

The package I had was a full ColorOS 16 OTA: 8.7 GB, 51 partitions. Before flashing, I wanted to confirm the package was correct, but I didn't want to extract it first.

Fortunately, `payload.bin` is stored **uncompressed** in the OTA zip, so it can be read directly by offset:

```powershell
# Read the metadata inside the zip first
tar -xOf .\86d1d2fe214c4a87804106baa2d4af4a.zip 'META-INF/com/android/metadata'

# The starting offset of payload.bin is given by ota-property-files in the metadata
# Read the protobuf manifest at the beginning byte by byte, then whole-word match partition names
```

Only a few fields matter: `android_version`, `version_name`, `product_name`, `pre-device`, `post-build`. This phone's `pre-device` is `OP5D2BL1`; only after it matched did I dare proceed.

I used `payload-dumper-go` to extract:

```powershell
.\payload-dumper-go.exe -c 8 -o .\cos16_img .\86d1d2fe214c4a87804106baa2d4af4a.zip
```

The payload lists 51 partitions, but the dumper only produced 48 images. `checkpoint_gc`, `otapreopt_script`, and `qti_dynamic_partitions` should never have been flashed directly anyway.

## Identifying images: don't mistake EROFS for a corrupt package

> I didn't do this section by hand; it came up when I had [omp](https://omp.sh/) verify the images during the flashing process.

After extracting, I wanted to verify them, and almost concluded I had downloaded a corrupt package.

| Image | Offset | Magic |
|---|---|---|
| `boot` / `init_boot` / `recovery` | 0 | `414E44524F494421` (`ANDROID!`) |
| `vendor_boot` | 0 | `564E4452424F4F54` (`VNDRBOOT`) |
| `dtbo` | 0 | `D7B7AB1E` |
| `vbmeta*` | 0 | `41564230` (`AVB0`) |
| `system` / `vendor` / `odm` / `my_*` | **1024** | `E2E1F5E0` (**EROFS**) |

The trap is in the last row: Android 16's system partitions are **EROFS**, not ext4. If you look for ext4's `53EF`, you'll only conclude that "all the images are broken." Also, `dtbo`'s `D7B7AB1E` looks a bit like ext4's magic, so don't mix them up.

## Flashing: two modes, each doing its own job

After entering fastbootd, confirm identity first:

```powershell
fastboot devices
fastboot getvar product      # expect OP5D2BL1 / giuliac / PKG110
fastboot getvar is-userspace # expect yes
fastboot getvar current-slot # expect a
```

Then flash one by one. Logical partitions and most physical partitions accept `--slot=all`, but this phone's logical partitions **only exist on `_a`**, so using `--slot=all` on that group is rejected; fall back to the single slot.

After flashing, wipe data and boot for the first time:

```powershell
fastboot reboot bootloader
fastboot -w
fastboot erase metadata
fastboot reboot
```

## Trap 1: modem won't accept writes in fastbootd

The first error that made me question my life:

```
Sending sparse 'modem_a' 1/1 (219896 KB)   OKAY
Writing 'modem_a'                          FAILED (remote: 'No such file or directory')
```

`getvar` was even more confusing:

```
partition-size:modem_a  → FAILED (remote: 'Could not open partition')
partition-type:modem_a  → raw        ← this one actually had a value
is-logical:modem_a      → FAILED (remote: 'Partition not found')
```

The partition appears to "exist", yet it just won't accept writes.

The root cause is simple: **fastbootd runs in userspace and has no block device node for `modem_a`**; the partition isn't broken. Switching back to the bootloader and checking, `partition-size:modem_a` is `0x15E00000`, perfectly fine.

So modem must be flashed in the bootloader:

```powershell
fastboot reboot bootloader
fastboot flash --slot=a modem modem.img
```

First try.

## Trap 2: OnePlus's `my_*` partitions don't exist at all

The second trap was even more absurd. All eight `my_*` partitions failed to flash, and at first I thought super space was insufficient.

Then I realized: **when flashing the unofficial ROM, the super partition table had been rebuilt following the AOSP layout**, leaving only the standard layout of `system`, `system_ext`, `product`, `vendor`, `odm`, `system_dlkm`, `vendor_dlkm`. OnePlus's own `my_product`, `my_stock`, `my_bigball`, `my_carrier`, `my_engineering`, `my_heytap`, `my_manifest`, `my_region` were never created.

It wasn't a lack of space; the partitions **simply didn't exist**.

The fix is to create them first, then flash:

```powershell
fastboot create-logical-partition my_stock_a 0x100000
fastboot flash --slot=a my_stock my_stock.img
```

The placeholder size can be arbitrary; `fastboot flash` will resize it to the image's actual size.

Let me also note this phone's final sizes, in case they're useful later:

```
my_product      1520168960 → 0x5A9BF000
my_stock        4491419648 → 0x10BB5A000
my_region        7057408  → 0x6BB000
my_manifest       729088  → 0xB2000
modem           314667008 → 0x15E00000
```

## Trap 3: `getvar` has three ways of saying "doesn't exist"

This one isn't fatal, but it's very easy to misjudge. I calibrated the semantics with a partition name that definitely doesn't exist:

| Query | Partition exists | Partition missing |
|---|---|---|
| `partition-type:X` | `raw` | `FAILED (remote: 'Invalid partition')` |
| `partition-size:X` | `0x...` | `FAILED (remote: 'Could not open partition')` |
| `has-slot:X` | `yes` / `no` | `no` (**no error**) |
| `is-logical:X` | `yes` / `no` | `FAILED (remote: 'Partition not found')` |

So to determine whether a partition exists, **look only at `partition-type` and `is-logical`**. The `has-slot` behavior of returning `no` even when the partition doesn't exist is a merciless trap.

## The flash-back is done, now what

After flashing, the phone booted, and calls, SMS, dual SIM, Wi-Fi, Bluetooth, NFC, fingerprint, and charging all worked; the third-party camera worked too. The strongest integrity evidence was that **system updates could detect an OTA**. At this point, the flash-back was a success.

Let me also lay out the relationship between root and OTA here, so I don't forget next time.

### Root disappears after an OTA

An OTA overwrites `boot`, so KernelSU's patch disappears too. That's not a risk; just patch again.

### Re-rooting: the window of opportunity

After flashing back to ColorOS, the latest official OTA update arrived quickly. After installing it, don't tap "restart now" yet — at this point the new image has already been written to the other slot, while root remains on the old system. Just dump it:

```powershell
adb shell su -c "dd if=/dev/block/by-name/boot_b of=/data/local/tmp/boot_b.img"
adb pull /data/local/tmp/boot_b.img
```

The advantage is that you don't have to wait for a full package, and the image is guaranteed to match. The disadvantage is that **the window closes as soon as you reboot**.

The Ace 5 is an Android 13+ GKI device; KernelSU patches `boot`, so don't flash it to `init_boot`.

### The easier approach: install to the unused slot

KernelSU Manager has an "install to unused slot (after OTA)" option that writes the patched image directly into the other slot; after rebooting you're on the new system with root. Much easier than manual dd.

The cost is that it won't leave a backup of the stock image on your computer. If something goes wrong and you want to roll back, you won't have that dumped `boot`. So this time I still manually dd'd a copy first, at least for peace of mind.

One more small detail: under KernelSU, not finding `ls /system/bin/su` is **normal**. It relies on an execve hook and doesn't actually place a su file. Don't use that to judge whether root is gone.

## Camera crash: the real long tail

The system was flashed and the root situation was clear, but when I opened the stock camera — **instant crash**.

Third-party cameras worked fine, meaning the camera hardware, HAL, and permissions were all fine. The crash log was very consistent:

```
java.lang.UnsatisfiedLinkError: dlopen failed: library "libCombineLutJni.so" not found
    at com.oplus.camera.combinelut.CombineLutJNI.<clinit>
    at com.oplus.ocs.camera.CombineLutHelper.<init>
    at com.oplus.camera.common.utils.Lut3dDataManager.<init>
```

Loading the native library failed. So I first looked for where the library was:

```
$ adb shell find / -name libCombineLutJni.so
/my_product/lib64/libCombineLutJni.so
```

The library is in `/my_product/lib64`, but the camera is a PRODUCT App, and its linker namespace only recognizes `/product/lib64:/system/product/lib64`; it won't look directly at `/my_product/lib64`.

Normally an overlay should merge the two. `/vendor/etc/fstab.qcom` indeed contains:

```
overlay-overlay /product/lib64 overlay ... lowerdir=/my_region/lib64:/my_preload/lib64:/my_product/lib64:/my_heytap/lib64:/my_stock/lib64:/my_engineering/lib64:/product/lib64
```

But checking `/proc/mounts`, **all four overlays** — `/product/app`, `/product/priv-app`, `/product/lib64`, `/product/lib` — **were not mounted**. In the same fstab, `/product/etc/permissions` and `/product/framework` were fine.

I reproduced the mount manually, and the kernel told me why:

```
overlayfs: failed to resolve '/my_preload/lib64': -2
```

`-2` is ENOENT. **The `/my_preload` partition does not exist.**

Removing it and mounting again succeeded immediately; `/product/lib64/libCombineLutJni.so` appeared, and the camera launched.

The full causal chain:

```
my_preload partition missing
  → all four overlays under /product/{app,priv-app,lib64,lib} fail to mount
  → /product/lib64 cannot see the libraries under /my_product/lib64
  → the camera fails to load libCombineLutJni.so → crash
```

The fstab actually contains `overlayfs_remove_missing_lowerdir`, which should automatically skip missing directories. But the boot path on this device executes the raw lowerdir list; that filter function is never called, so a missing directory is a hard ENOENT.

### Why is `my_preload` missing in particular?

Back to the earlier trap: when flashing the unofficial ROM, the super partition table was rebuilt following the AOSP layout, and the stock `my_preload` and `my_company` were deleted along with it. When flashing back, I only created partitions that exist in the full ColorOS 16 OTA, and **the full package doesn't include `my_preload`**.

These two are OPlus preinstalled partitions (the community calls them "双广分区", the Shuāngguǎng partitions); they aren't updated by full OTAs and only exist in downgrade packages / rollback packages / factory images.

There's still evidence on this device: `/my_manifest/etc/my_preload.map` is full of `/my_preload/del-app/...` preinstall lists, proving the factory layout originally had it.

### Rescue: extract just one partition

I downloaded an old full downgrade package `PKG110_16.0.9.400(CN01)`, which contains `my_preload` (1.8 GB) and `my_company` (336 kB).

Note: **extract only the partitions, don't flash the whole package**. This package is older than the current system and carries `wipe=1` and `ota-downgrade=yes`; flashing it wholesale would be deliberately stepping on ARB.

```powershell
.\payload-dumper-go.exe -p my_preload -o .\my_preload_16.0.9.400 .\670f63e2a29741578637222c6b7be73b.zip
```

The extracted image is 1,784,397,824 bytes, EROFS, with an AVB public key SHA-1 of `1a130f9a...66f6`, exactly matching `/vendor/etc/oplus_avb.pubkey` on the device — official signature, passes `avb_keys` verification.

Before flashing, check the space: super's total capacity is 13.58 GiB, about 10.0 GiB used, 3.58 GiB left, plenty for 1.66 GiB.

```powershell
adb reboot fastboot
fastboot getvar is-userspace   # expect yes

fastboot create-logical-partition my_preload_a 1784397824
fastboot flash --slot=a my_preload .\my_preload_16.0.9.400\my_preload.img
fastboot reboot
```

After flashing, `my_preload_a` mounts on dm-verity (`dm-29`, erofs), meaning the hashtree verification passed. Checking the overlay again:

```
overlay-overlay /product/lib64 ... lowerdir=/my_region/lib64:/my_preload/lib64:/my_product/lib64:...
```

All four overlays are back, the library is visible, the camera process stays alive after launch, `dumpsys media.camera` shows an active session, and there are no new records in the crash buffer.

Done.

## A few random thoughts

The biggest takeaway from this whole ordeal: **the hard part of flashing isn't the flashing; it's understanding "why this partition won't accept writes."**

A few concrete lessons:

- **Don't just look at the error; look at the pattern behind it.** `modem` failing to write and `my_*` failing to write both produce ambiguous errors, but one is because fastbootd has no node, and the other is because the partition simply doesn't exist. The solutions are completely different.
- **The "other slot" on A/B devices is a free time machine.** Don't rush to reboot after an OTA install; dump the new image first, and you'll save the hours spent waiting for a full package later.
- **On a device whose super has been rebuilt, the road back to stock is more than "flash the official package."** Partitions absent from the official full package have to be fished out of a downgrade package separately.
- **Remember to keep `my_preload.img`.** Any time super is rebuilt (flashing an unofficial ROM again, full-package flashing, reflashing before relocking), you'll need to recreate and flash this partition, or the camera will crash again. Regular OTAs won't overwrite it, so don't worry.

Finally, flashing carries risk; bricking and data loss are your own responsibility. I actually ran all the commands, but your device may not be exactly the same as mine. Back up before you start.

That's it. I'm going to sleep.
