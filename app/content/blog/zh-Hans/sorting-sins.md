---
title: 一次突发奇想的「排序之罪」：如果对排序使用随机比较器
desc: 如果我在排序的时候用一个随机函数做比较器，会发生什么？
date: 2026-07-15
edit: 2026-07-15
---

## 突发奇想

今天晚上或许是太无聊了，突发奇想到：**如果我在排序的时候用一个随机函数做比较器，会发生什么？**

正常情况下，传递给 `sort` 的比较器应该返回 `a < b` 的真假值，来决定谁排在前面。但假如我让它随机返回，那排序算法会有怎么样的行为呢？

以及不同语言会怎么处理这种「违规」或者未定义行为？是给一个乱序结果，还是会直接报错？

于是就有了这个仓库：[sorting-sins](https://github.com/Kuriyona/sorting-sins)

本项目测试的语言有：

- JavaScript (Node.js & Bun.js & Deno)
- Python
- Go
- C++
- C#
- Java
- Rust (latest & **v1.80.0**)

> 对 JavaScript、Python、Go 的代码我是自己动手写的，其他几个语言是在 AI 的帮助下写的

## 对结果的猜想

一开始，我觉得其他语言可能会给出一个类似随机的结果，或者说给出报错？

不过我当时觉得，JavaScript 应该会给出一个随机的结果，或许 Rust 会在编译时报错，毕竟我对这两个语言的刻板印象就是如此（

## 各语言表现

### JavaScript（Node.js v24.14.0 / Bun.js 1.3.14 / Deno.js 2.9.2）

用 `Math.random() - 0.5` 也就是 [-0.5, 0.5] 的随机浮点做比较器，跑三次：

```js
arr.sort(() => Math.random() - 0.5);
```

```
第一次：[67, 68, 87, 44, 50, 16, 42, 3, 24, 31, 1, 74, ...]
第二次：[23, 69, 5, 47, 38, 36, 8, 27, 32, 11, 10, 0, ...]
第三次：[50, 15, 7, 19, 34, 31, 32, 11, 47, 48, 51, 52, ...]
```

看起来是一个随机的结果，果不其然。

### Python（Python 3.14.3）

使用 `functools.cmp_to_key` 将比较函数转换为 key 函数。

```python
arr.sort(key=cmp_to_key(lambda a, b: random.choice([-1, 0, 1])))
```

```
第一次：[79, 0, 44, 53, 38, 66, 90, 19, 3, 87, 31, 5, ...]
第二次：[0, 80, 48, 22, 30, 79, 45, 95, 70, 84, 76, 74, ...]
第三次：[17, 1, 73, 89, 80, 52, 26, 35, 30, 53, 9, 34, ...]
```

看起来 Python 也是给出一个随机的结果，倒是没有很意外。

### Go（go 1.26.2）

Go 语言我倒不是很熟，勉强写出了代码。

用 `sort.Slice` 配合 `rand.Intn(2) == 0`：

```go
sort.Slice(arr, func(i, j int) bool {
    return rand.Intn(2) == 0
})
```

```
第一次：[46, 1, 55, 20, 11, 66, 56, 88, 80, 54, 41, 77, ...]
第二次：[68, 21, 62, 78, 20, 7, 3, 16, 72, 69, 85, 36, ...]
第三次：[26, 59, 90, 82, 20, 54, 79, 16, 43, 67, 77, 41, ...]
```

看起来依旧是一个类似随机的结果。

### C++（clang 22.1.8）

接下来是 C++ 的版本：

```cpp
std::sort(arr.begin(), arr.end(), [&gen](int, int) {
    return std::uniform_int_distribution<>(0, 1)(gen) == 0;
});
```

```
第一次：[73, 3, 10, 46, 88, 72, 26, 64, 38, 75, 91, 50, ...]
第二次：[20, 76, 33, 3, 86, 47, 34, 69, 94, 24, 71, 87, ...]
第三次：[95, 1, 22, 99, 21, 94, 6, 57, 51, 85, 10, 11, ...]
```

C++ 看起来很直接地运行了代码，不管如何输入，它都会执行下去。

### C#（.NET 10.0.301）

```cs
Array.Sort(arr, (a, b) => rng.Next(2) == 0 ? -1 : 1);
```

```
第一次：[80, 57, 97, 92, 32, 3, 74, 10, 53, 35, 15, 29, ...]
第二次：[3, 27, 58, 98, 56, 28, 39, 82, 94, 53, 9, 50, ...]
第三次：[77, 19, 2, 61, 4, 15, 92, 95, 21, 7, 62, 84, ...]
```

然而当数量级增加至 N = 100000，情况就不同了。

```
Unhandled exception. System.ArgumentException: Unable to sort because the IComparer.Compare() method returns inconsistent results. Either a value does not compare equal to itself, or one value repeatedly compared to another value yields different results. IComparer: 'System.Comparison`1[System.Int32]'.
```

C# 在数组长度达到一定规模后，才能检测出比较器的不一致问题。

### Java（JDK 26.0.1）

```java
arr.sort((a, b) -> rng.nextInt(3) - 1);
```

```
第一次：[0, 3, 8, 25, 5, 27, 20, 23, 9, 32, 18, 14, ...]
第二次：[25, 79, 1, 8, 14, 17, 2, 5, 16, 9, 3, 24, ...]
第三次：[50, 12, 0, 5, 11, 1, 22, 2, 3, 19, 16, 4, ...]
```

和 C# 一样，当数量级增加至 N = 100000，情况就不同了。

```
Exception in thread "main" java.lang.IllegalArgumentException: Comparison method violates its general contract!
```

Java 在数组长度达到一定规模后，同样能检测出比较器的问题。

此检查自 Java 7 起引入。在 Java 7 之前，即便比较器有缺陷，Java 也不会报错，只会直接给出一个乱序的结果。

### Rust（rustc 1.97.0）

终于到 Rust 了。AI 用了 `rand::Rng` 来决定 `Ordering::Less` 还是 `Greater`：

```rust
arr.sort_by(|_, _| {
	if rng.gen::<bool>() {
		Ordering::Less
	} else {
		Ordering::Greater
	}
});
```

```
第一次：thread 'main' panicked at ...
第二次：thread 'main' panicked at ...
第三次：thread 'main' panicked at ...
```

错误信息：

```
user-provided comparison function does not correctly implement a total order
```

倒是在意料之中，**Rust 是唯一一个直接 panic 的语言**（虽然并没有如我所想的在编译时就报错）。

但是它会在运行期检测你的比较器有没有实现 total order（全序），如果没有就当场 panic 给你看。这种在语言层面做安全边界检查的做法，确实是我对 Rust 刻板印象的一贯风格。宁可程序挂了，也不让未定义行为参与入程序运算。

## Rust：可是，当真如此吗？

当我测试完 Rust 之后，与一个朋友 [LaunchPad](https://launchpadx.top/) 分享的时候。对方尝试在 Grok 中复现时，发现并没有 panic。

![sorting-sins-grok-1](https://r2.kuriyona.com/static/2026/07/15/sorting-sins-grok-1.jpg)

这让我很奇怪，因为我在本地运行时，确实会 panic。

于是我们自然而然地怀疑到了版本的问题，是否是因为 Rust 版本的问题导致的？然后发现 Gork VM 中使用的 Rust 版本是 `1.75.0 (82e1608df 2023-12-21)`。

![sorting-sins-grok-2](https://r2.kuriyona.com/static/2026/07/15/sorting-sins-grok-2.jpg)

![sorting-sins-grok-3](https://r2.kuriyona.com/static/2026/07/15/sorting-sins-grok-3.jpg)

而我本地测试用的版本是 `1.97.0 (c980f4866 2026-06-30)`，我们自然而然就基本肯定了是版本的问题，不过我本来短期内也没打算先深入研究，发布了这篇博客的第一个版本。

而发布出没多久，我的一个妹妹 [lfcypo](https://github.com/lfcypo) 便在后续提供了历史版本和具体变更的解释。

经过她的帮助和后续研究，结论是两个关键 PR 塑造了当前行为：

| PR                                                       | PR 信息摘要                                                                                                                                                                            | 合并日期   | 发布版本    |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------- |
| [#124032](https://github.com/rust-lang/rust/pull/124032) | 替换排序实现——引入 **driftsort**（`slice::sort`）和 **ipnsort**（`slice::sort_unstable`）。新实现能主动检测 **strict weak ordering** 违例并 panic，旧版 Timsort/pdqsort 无法可靠检测。 | 2024-06-21 | Rust 1.81.0 |
| [#128273](https://github.com/rust-lang/rust/pull/128273) | 改进 Ord 违例帮助信息——将 panic 信息优化为 `user-provided comparison function does not correctly implement a total order`，并完善文档。                                                | 2024-08-11 | Rust 1.81.0 |

新实现增加了运行时的一致性检查，对于许多违反 total order 的比较器会主动 panic，而旧版排序实现通常不会进行此类检测。

在 1.81.0 之前（如 1.80.0）：在有限的测试中，传入非确定性比较器时，排序静默输出看似随机的排列。自 1.81.0 起：排序实现能以高概率检测到比较器不一致并 panic。

## 总结

| **语言**                              | **行为**                               |
| ------------------------------------- | -------------------------------------- |
| **C++(Clang)**                        | （疑似）随机排列                       |
| **Python**                            | （疑似）随机排列                       |
| **JavaScript (Node.js / Bun / Deno)** | （疑似）随机排列                       |
| **Go**                                | （疑似）随机排列                       |
| **Java**                              | N=100 随机排列，N=1,000,000 **抛异常** |
| **C#**                                | N=100 随机排列，N=1,000,000 **抛异常** |
| **Rust(latest)**                      | **panic**                              |
| **Rust(v1.80.0)**                     | （疑似）随机排列                       |

5 种语言在随机比较器面前都选择了「当作啥都没发生」，而只有 Rust 的 v1.81.0 及以后版本选择了 panic，Java 和 C# 在数组长度达到一定规模后可能抛出错误。

后续我将对各种语言的实际执行次数以及排序结果是否存在规律性进行分析，总之就先这样吧，有空再折腾。
