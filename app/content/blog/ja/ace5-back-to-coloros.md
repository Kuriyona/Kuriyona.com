---
title: OnePlus Ace 5 を非公式 ROM から ColorOS 16 に戻し、ついでにカメラも復活させた話
desc: 非公式 ROM から ColorOS 16 に戻した全記録：3 度の失敗、カメラのクラッシュ、そして root と OTA の避けて通れない話。
date: 2026-10-19
edit: 2026-10-19
aiGenerated: true
aiReview: 基本核对
aiTranslated: true
---

## きっかけ

約 2 か月間 Apple エコシステムのユーザーをやったあと、結局 Apple エコシステムを手放すことにして、もとのサブ機 —— この OnePlus Ace 5 中国版（コードネーム `giuliac`、型番 `PKG110`）—— を ColorOS 16 に戻してつなぎで使おうと考えた。新しい端末が発売されたら、そのときに改めて決めるつもりだ。

最初は「パッケージを落として、fastboot に入って、焼いて再起動するだけ」くらいに思っていた。ところが実際に時間を食ったのは焼くことではなく、**なぜ焼けないのかを突き止めること**だった。

この記事では一連の流れを記録し、ついでに root と OTA の話も整理する。最後に、明け方まで格闘することになったカメラのクラッシュについても書く。

## 2 つの鉄則

結論を先に書く。この 2 つは今回、実際に痛い目を見て得たものだ：

1. **ファームウェアパーティションは bootloader で、論理パーティションは fastbootd で焼く**。混ぜると「パーティションは確かにあるのに、書き込めない」という怪奇現象が起きる。
2. **再ロックは最後**。起動できて、機能が正常で、OTA を検出できてから初めて `fastboot flashing lock` を検討する。今回は再ロックせず、bootloader は unlocked のままにした。

## パッケージ検証：8GB を展開せずにバージョンを見る

手元のパッケージは ColorOS 16 のフル OTA で、8.7 GB、51 パーティション。焼く前にパッケージが正しいか確認したいが、先に展開するのは面倒だ。

幸い `payload.bin` は OTA zip の中で**非圧縮で保存**されているので、オフセットから直接読める：

```powershell
# まず zip 内の metadata を読む
tar -xOf .\86d1d2fe214c4a87804106baa2d4af4a.zip 'META-INF/com/android/metadata'

# payload.bin の開始オフセットは metadata の ota-property-files で示される
# 先頭の protobuf manifest をバイト単位で読み、パーティション名を完全一致で照合する
```

見るべきフィールドはわずか：`android_version`、`version_name`、`product_name`、`pre-device`、`post-build`。この端末の `pre-device` は `OP5D2BL1` で、一致したので先に進めた。

展開には `payload-dumper-go` を使った：

```powershell
.\payload-dumper-go.exe -c 8 -o .\cos16_img .\86d1d2fe214c4a87804106baa2d4af4a.zip
```

payload には 51 パーティションが書かれているが、dumper が生成したイメージは 48 個だけ。`checkpoint_gc`、`otapreopt_script`、`qti_dynamic_partitions` の 3 つはそもそも直接焼くべきものではない。

## イメージの見分け：EROFS を壊れたパッケージと間違えるな

> この節は手作業ではなく、焼いている最中に [omp](https://omp.sh/) にイメージ検証をさせたときに踏んだものだ。

展開したあと検証しようとして、危うく壊れたパッケージを落としたと思い込むところだった。

| イメージ | オフセット | マジック |
|---|---|---|
| `boot` / `init_boot` / `recovery` | 0 | `414E44524F494421`（`ANDROID!`） |
| `vendor_boot` | 0 | `564E4452424F4F54`（`VNDRBOOT`） |
| `dtbo` | 0 | `D7B7AB1E` |
| `vbmeta*` | 0 | `41564230`（`AVB0`） |
| `system` / `vendor` / `odm` / `my_*` | **1024** | `E2E1F5E0`（**EROFS**） |

罠は最後の行にある：Android 16 のシステムパーティションは **EROFS** で、ext4 ではない。ext4 の `53EF` を探すと「イメージが全部壊れている」という結論しか出ない。しかも `dtbo` の `D7B7AB1E` は ext4 のマジックにも少し似ているので、混同しないように。

## 書き込み：2 つのモード、それぞれの役割

fastbootd に入ったらまず身元を確認する：

```powershell
fastboot devices
fastboot getvar product      # 期待値 OP5D2BL1 / giuliac / PKG110
fastboot getvar is-userspace # 期待値 yes
fastboot getvar current-slot # 期待値 a
```

あとは 1 つずつ焼いていく。論理パーティションと大部分の物理パーティションは `--slot=all` を受け付けるが、この端末の論理パーティションは**`_a` にしか存在しない**ので、その一群に `--slot=all` を使うと拒否される。単一スロットに戻せばよい。

焼き終わったらデータを消して初回起動：

```powershell
fastboot reboot bootloader
fastboot -w
fastboot erase metadata
fastboot reboot
```

## 罠 1：modem は fastbootd で書き込めない

人生を疑い始めた最初のエラー：

```
Sending sparse 'modem_a' 1/1 (219896 KB)   OKAY
Writing 'modem_a'                          FAILED (remote: 'No such file or directory')
```

`getvar` の挙動はもっと不可解だった：

```
partition-size:modem_a  → FAILED (remote: 'Could not open partition')
partition-type:modem_a  → raw        ← これにはなぜか値がある
is-logical:modem_a      → FAILED (remote: 'Partition not found')
```

パーティションは一見「存在する」のに、書き込めない。

原因は単純だった：**fastbootd はユーザー空間で動いており、`modem_a` のブロックデバイスノードを持っていない**。パーティションが壊れているわけではない。bootloader に戻って確認すると、`partition-size:modem_a` は `0x15E00000` でまったく問題ない。

つまり modem は bootloader で焼く必要がある：

```powershell
fastboot reboot bootloader
fastboot flash --slot=a modem modem.img
```

一発で通った。

## 罠 2：OnePlus の `my_*` パーティションはそもそも存在しない

2 つ目の罠はさらにひどい。8 つの `my_*` パーティションを焼くと全部失敗し、最初は super の空き容量不足だと思った。

あとで気づいた：**非公式 ROM を焼くときに super パーティションテーブルが AOSP レイアウトで再構築され**、`system`、`system_ext`、`product`、`vendor`、`odm`、`system_dlkm`、`vendor_dlkm` という標準レイアウトだけが残っていた。OnePlus 独自の `my_product`、`my_stock`、`my_bigball`、`my_carrier`、`my_engineering`、`my_heytap`、`my_manifest`、`my_region` はすべて作られていない。

容量不足ではなく、**そもそもそのパーティションが存在しない**のだ。

解決策は先に作成してから焼く：

```powershell
fastboot create-logical-partition my_stock_a 0x100000
fastboot flash --slot=a my_stock my_stock.img
```

プレースホルダのサイズは適当でよい。`fastboot flash` がイメージの実際のサイズに自動でリサイズしてくれる。

ついでにこの端末の最終サイズを記録しておく。あとで照合するとき用：

```
my_product      1520168960 → 0x5A9BF000
my_stock        4491419648 → 0x10BB5A000
my_region        7057408  → 0x6BB000
my_manifest       729088  → 0xB2000
modem           314667008 → 0x15E00000
```

## 罠 3：`getvar` の「存在しない」には 3 通りの言い方がある

これは致命的ではないが、非常に誤判定しやすい。確実に存在しないパーティション名で意味を較正してみた：

| クエリ | パーティションが存在する | 存在しない |
|---|---|---|
| `partition-type:X` | `raw` | `FAILED (remote: 'Invalid partition')` |
| `partition-size:X` | `0x...` | `FAILED (remote: 'Could not open partition')` |
| `has-slot:X` | `yes` / `no` | `no`（**エラーなし**） |
| `is-logical:X` | `yes` / `no` | `FAILED (remote: 'Partition not found')` |

つまりパーティションが存在するかどうかは、**`partition-type` と `is-logical` だけを見る**。`has-slot` が存在しなくても `no` を返す仕様は、人を殺す気でできている。

## 戻し終わった、それで？

焼き終わって起動すると、電話、SMS、デュアル SIM、Wi-Fi、Bluetooth、NFC、指紋、充電はすべて正常で、カメラ（サードパーティ製）も使えた。最も強い完全性の証拠は、**システム更新で OTA を検出できた**ことだ。ここまで来れば、戻しは成功と言える。

ここで root と OTA の関係も整理しておく。次回忘れないように。

### OTA のあと root は消える

OTA は `boot` を上書きするので、KernelSU のパッチも当然消える。これはリスクではなく、再度パッチを当てればよい。

### 再 root：猶予の窓

ColorOS に戻したあと、ほどなく最新の公式 OTA アップデートが届いた。インストール後に「今すぐ再起動」を押す前に待て —— この時点で新しいイメージはすでに別スロットに書き込まれており、旧システムの root はまだ残っている。そのまま読み出せばよい：

```powershell
adb shell su -c "dd if=/dev/block/by-name/boot_b of=/data/local/tmp/boot_b.img"
adb pull /data/local/tmp/boot_b.img
```

利点はフルパッケージを待たなくてよく、イメージが 100% 一致すること。欠点は**再起動した瞬間に窓が閉じる**ことだ。

Ace 5 は Android 13+ の GKI 端末で、KernelSU がパッチするのは `boot` なので、`init_boot` に焼かないように。

### もっと楽な方法：未使用スロットにインストール

KernelSU Manager には「未使用のスロットにインストール（OTA 後）」があり、パッチ済みイメージをそのまま別スロットに書き込める。再起動すれば root 付きの新システムになる。手動 dd よりずっと楽だ。

代償は、パソコンに純正イメージのバックアップが残らないこと。いざというときロールバックしたくても、dump した `boot` が手元にない。だから今回は先に手動で dd しておいた。少なくとも安心のためだ。

もう 1 つ小さな話：KernelSU では `ls /system/bin/su` で見つからないのが**正常**だ。execve フックで動いており、実際に su ファイルを置いているわけではない。これで root が消えたかどうかを判断しないように。

## カメラのクラッシュ：本当の長い尾

システムは焼けて root の話も整理できた。ところが純正カメラを開くと —— **即落ち**。

サードパーティ製カメラはすべて正常なので、カメラのハードウェア、HAL、権限に問題はない。クラッシュログも非常に安定していた：

```
java.lang.UnsatisfiedLinkError: dlopen failed: library "libCombineLutJni.so" not found
    at com.oplus.camera.combinelut.CombineLutJNI.<clinit>
    at com.oplus.ocs.camera.CombineLutHelper.<init>
    at com.oplus.camera.common.utils.Lut3dDataManager.<init>
```

ネイティブライブラリの読み込み失敗。まずこのライブラリの所在を探す：

```
$ adb shell find / -name libCombineLutJni.so
/my_product/lib64/libCombineLutJni.so
```

ライブラリは `/my_product/lib64` にあるが、カメラは PRODUCT App で、そのリンカ名前空間は `/product/lib64:/system/product/lib64` しか認識せず、`/my_product/lib64` を直接見にはいかない。

通常は overlay が両者をマージするはずだ。`/vendor/etc/fstab.qcom` にも確かに書かれている：

```
overlay-overlay /product/lib64 overlay ... lowerdir=/my_region/lib64:/my_preload/lib64:/my_product/lib64:/my_heytap/lib64:/my_stock/lib64:/my_engineering/lib64:/product/lib64
```

ところが `/proc/mounts` を確認すると、`/product/app`、`/product/priv-app`、`/product/lib64`、`/product/lib` の**4 つの overlay がすべてマウントされていなかった**。同じ fstab にある `/product/etc/permissions` と `/product/framework` は正常だった。

手動でマウントを再現すると、カーネルが原因を教えてくれた：

```
overlayfs: failed to resolve '/my_preload/lib64': -2
```

`-2` は ENOENT。**`/my_preload` パーティションが存在しない。**

それを外して再度マウントすると即座に成功し、`/product/lib64/libCombineLutJni.so` が現れ、カメラも起動できるようになった。

完全な因果連鎖はこうだ：

```
my_preload パーティションが欠落
  → /product/{app,priv-app,lib64,lib} の 4 つの overlay がマウント失敗
  → /product/lib64 から /my_product/lib64 内のライブラリが見えない
  → カメラが libCombineLutJni.so の読み込みに失敗 → クラッシュ
```

fstab には `overlayfs_remove_missing_lowerdir` が書かれており、本来は欠けたディレクトリを自動で飛ばすはずだ。しかしこの端末の起動経路は実際には生の lowerdir リストを実行しており、そのフィルタ関数は呼ばれていない。だから欠けたディレクトリは容赦なく ENOENT になる。

### なぜ `my_preload` だけが欠けているのか

前述の罠に戻る：非公式 ROM を焼くときに super パーティションテーブルが AOSP レイアウトで再構築され、純正の `my_preload`、`my_company` も一緒に削除された。戻すときは ColorOS 16 フル OTA に存在するパーティションだけを作成したが、**フルパッケージには `my_preload` が含まれていない**。

この 2 つは欧加（OPPO/OnePlus）のプリインストールパーティション（コミュニティでは「双広分区」と呼ばれる）で、フル OTA では更新されず、ダウングレードパッケージ / ロールバックパッケージ / 工場出荷イメージにしか入っていない。

この端末には証拠も残っている：`/my_manifest/etc/my_preload.map` に `/my_preload/del-app/...` のプリインストール一覧が並んでおり、工場出荷時のレイアウトには元々存在していたことがわかる。

### 救出：パーティションを 1 つだけ取り出す

古いフルダウングレードパッケージ `PKG110_16.0.9.400(CN01)` を改めてダウンロードした。中に `my_preload`（1.8 GB）と `my_company`（336 kB）が入っている。

注意：**パーティションだけを抽出し、パッケージ全体を焼かない**。このパッケージは現在のシステムより古く、`wipe=1` と `ota-downgrade=yes` も付いている。丸ごと焼くのは自分から ARB を踏みに行くようなものだ。

```powershell
.\payload-dumper-go.exe -p my_preload -o .\my_preload_16.0.9.400 .\670f63e2a29741578637222c6b7be73b.zip
```

抽出したイメージは 1,784,397,824 バイト、EROFS、AVB 公開鍵の SHA-1 は `1a130f9a...66f6` で、端末上の `/vendor/etc/oplus_avb.pubkey` と完全に一致 —— 公式署名であり、`avb_keys` 検証を通せる。

焼く前に空き容量を確認：super の総容量は 13.58 GiB、使用済みは約 10.0 GiB、残り 3.58 GiB で、1.66 GiB を置くには十分すぎる。

```powershell
adb reboot fastboot
fastboot getvar is-userspace   # 期待値 yes

fastboot create-logical-partition my_preload_a 1784397824
fastboot flash --slot=a my_preload .\my_preload_16.0.9.400\my_preload.img
fastboot reboot
```

焼いたあと `my_preload_a` は dm-verity（`dm-29`、erofs）上にマウントされ、hashtree 検証を通ったことがわかる。さらに overlay を確認：

```
overlay-overlay /product/lib64 ... lowerdir=/my_region/lib64:/my_preload/lib64:/my_product/lib64:...
```

4 つの overlay がすべて戻り、ライブラリが見え、カメラ起動後もプロセスは安定して生存し、`dumpsys media.camera` に active session が見え、crash buffer にも新しい記録はない。

完了。

## いくつかの雑感

今回の格闘で最大の感想は：**フラッシュの本当の難しさは焼くことではなく、「なぜこのパーティションが書き込めないのか」を理解すること**だ。

いくつかの具体的な教訓：

- **エラーだけを見ず、その背後にあるパターンを見る**。`modem` が書き込めないのも `my_*` が書き込めないのも、エラーは曖昧だが、前者は fastbootd にノードがないから、後者はパーティションがそもそも存在しないからで、解決策はまったく違う。
- **A/B 端末の「もう 1 つのスロット」は無料のタイムマシン**。OTA インストール後は慌てて再起動せず、まず新しいイメージを dump すれば、あとでフルパッケージを待つ数時間を節約できる。
- **super を再構築した端末で純正に戻る道は「公式パッケージを焼く」だけではない**。公式フルパッケージにないパーティションは、ダウングレードパッケージから個別に取り出す必要がある。
- **`my_preload.img` は取っておくこと**。今後 super を再構築するたび（非公式 ROM の再焼き、フルパッケージ書き込み、再ロック前の再焼き）に、このパーティションを作成して焼き直す必要がある。そうしないとカメラがまたクラッシュする。通常の OTA では上書きされないので心配はいらない。

最後に、フラッシュにはリスクがあり、文鎮化やデータ消失は自己責任だ。コマンドはすべて実際に実行したが、あなたの端末が私のものと完全に同じとは限らない。作業前にバックアップを。

では、寝る。
