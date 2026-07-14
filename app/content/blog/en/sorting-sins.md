---
title: 'A Whimsical "Sin of Sorting": What If You Use a Random Comparator for Sorting?'
desc: What happens if I use a random function as a comparator when sorting?
date: 2026-07-15
edit: 2026-07-15
---

## A Whimsical Thought

Tonight, perhaps out of sheer boredom, a thought struck me: **What if I use a random function as a comparator when sorting?**

Normally, the comparator passed to `sort` should return a boolean indicating `a < b` to decide which element comes first. But what if I make it return randomly? How would the sorting algorithm behave?

And how would different languages handle this kind of "violation" or undefined behavior? Would they produce a shuffled result, or would they throw an error?

Thus, this repository was born: [sorting-sins](https://github.com/Kuriyona/sorting-sins)

The languages tested in this project are:

- JavaScript (Node.js/Bun.js/Deno)
- Python
- Go
- C++
- C#
- Java
- Dart
- Rust (latest & v1.80.0)

> I wrote the code for JavaScript, Python, and Go myself; the other languages were generated with AI assistance.

## Initial Guesses

Initially, I thought other languages might produce something resembling random output, or perhaps throw an error.

I did expect JavaScript to produce a random result, and maybe Rust to fail at compile time — that's the stereotype I have of these two languages.

## Behavior by Language

### JavaScript (Node.js v24.14.0 / Bun.js 1.3.14 / Deno.js 2.9.2)

Using `Math.random() - 0.5`, i.e., a random float in [-0.5, 0.5], as the comparator, run three times:

```js
arr.sort(() => Math.random() - 0.5);
```

```
Run 1: [67, 68, 87, 44, 50, 16, 42, 3, 24, 31, 1, 74, ...]
Run 2: [23, 69, 5, 47, 38, 36, 8, 27, 32, 11, 10, 0, ...]
Run 3: [50, 15, 7, 19, 34, 31, 32, 11, 47, 48, 51, 52, ...]
```

Looks random, as expected.

### Python (Python 3.14.3)

Using `functools.cmp_to_key` to convert the comparator into a key function.

```python
arr.sort(key=cmp_to_key(lambda a, b: random.choice([-1, 0, 1])))
```

```
Run 1: [79, 0, 44, 53, 38, 66, 90, 19, 3, 87, 31, 5, ...]
Run 2: [0, 80, 48, 22, 30, 79, 45, 95, 70, 84, 76, 74, ...]
Run 3: [17, 1, 73, 89, 80, 52, 26, 35, 30, 53, 9, 34, ...]
```

Python also produces random-looking results — not surprising.

### Go (go 1.26.2)

I'm not very familiar with Go, but I managed to write the code.

Using `sort.Slice` with `rand.Intn(2) == 0`:

```go
sort.Slice(arr, func(i, j int) bool {
    return rand.Intn(2) == 0
})
```

```
Run 1: [46, 1, 55, 20, 11, 66, 56, 88, 80, 54, 41, 77, ...]
Run 2: [68, 21, 62, 78, 20, 7, 3, 16, 72, 69, 85, 36, ...]
Run 3: [26, 59, 90, 82, 20, 54, 79, 16, 43, 67, 77, 41, ...]
```

Again, looks random.

### C++ (clang 22.1.8)

Next, the C++ version:

```cpp
std::sort(arr.begin(), arr.end(), [&gen](int, int) {
    return std::uniform_int_distribution<>(0, 1)(gen) == 0;
});
```

```
Run 1: [73, 3, 10, 46, 88, 72, 26, 64, 38, 75, 91, 50, ...]
Run 2: [20, 76, 33, 3, 86, 47, 34, 69, 94, 24, 71, 87, ...]
Run 3: [95, 1, 22, 99, 21, 94, 6, 57, 51, 85, 10, 11, ...]
```

C++ simply runs the code, no matter what input it gets.

### C# (.NET 10.0.301)

```cs
Array.Sort(arr, (a, b) => rng.Next(2) == 0 ? -1 : 1);
```

```
Run 1: [80, 57, 97, 92, 32, 3, 74, 10, 53, 35, 15, 29, ...]
Run 2: [3, 27, 58, 98, 56, 28, 39, 82, 94, 53, 9, 50, ...]
Run 3: [77, 19, 2, 61, 4, 15, 92, 95, 21, 7, 62, 84, ...]
```

### Java (JDK 26.0.1)

```java
arr.sort((a, b) -> rng.nextInt(3) - 1);
```

```
Run 1: [0, 3, 8, 25, 5, 27, 20, 23, 9, 32, 18, 14, ...]
Run 2: [25, 79, 1, 8, 14, 17, 2, 5, 16, 9, 3, 24, ...]
Run 3: [50, 12, 0, 5, 11, 1, 22, 2, 3, 19, 16, 4, ...]
```

### Dart (Dart SDK 3.11.4)

```dart
arr.sort((a, b) => rng.nextInt(3) - 1);
```

```
Run 1: [2, 3, 96, 93, 10, 58, 91, 14, 33, 17, 85, 21, ...]
Run 2: [97, 4, 93, 66, 90, 92, 17, 11, 18, 86, 22, 0, ...]
Run 3: [98, 67, 3, 4, 93, 9, 14, 33, 17, 10, 88, 22, ...]
```

### Rust (rustc 1.97.0)

Finally, Rust. The AI used `rand::Rng` to decide between `Ordering::Less` and `Ordering::Greater`:

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
Run 1: thread 'main' panicked at ...
Run 2: thread 'main' panicked at ...
Run 3: thread 'main' panicked at ...
```

Error message:

```
user-provided comparison function does not correctly implement a total order
```

This was expected. **Rust is the only language that panics** (though not at compile time, as I had initially guessed).

But it does detect at runtime whether your comparator implements a total order, and panics immediately if it doesn't. This kind of language-level safety boundary checks is exactly the stereotype I have of Rust. Better to crash than to let undefined behavior participate in program execution.

## Rust: But Is That Really the Whole Story?

When I finished testing Rust and shared the results with a friend [LaunchPad](https://launchpadx.top/), they tried to reproduce it in Grok and found that it did **not** panic.

![sorting-sins-grok-1](https://r2.kuriyona.com/static/2026/07/15/sorting-sins-grok-1.jpg)

This puzzled me, because on my local machine it definitely panicked.

We naturally suspected a version difference. It turned out the Grok VM was using Rust 1.80.0.

![sorting-sins-grok-2](https://r2.kuriyona.com/static/2026/07/15/sorting-sins-grok-2.jpg)

![sorting-sins-grok-3](https://r2.kuriyona.com/static/2026/07/15/sorting-sins-grok-3.jpg)

My local version was `cargo 1.97.0 (c980f4866 2026-06-30)`, so we tentatively concluded it was a version issue. I initially didn't plan to dig deeper right away, and published the first version of this blog post.

Shortly after publishing, my friend [lfcypo](https://github.com/lfcypo) provided historical version details and a specific explanation of the changes.

With his help and subsequent research, the conclusion is that **two key PRs** shaped the current behavior:

| PR                                                       | Summary                                                                                                                                                                                                                                                                    | Merged     | Released in |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------- |
| [#124032](https://github.com/rust-lang/rust/pull/124032) | Replaces sorting implementation — introduces **driftsort** (for `slice::sort`) and **ipnsort** (for `slice::sort_unstable`). The new implementation actively detects **strict weak ordering** violations and panics; older Timsort/pdqsort could not reliably detect them. | 2024-06-21 | Rust 1.81.0 |
| [#128273](https://github.com/rust-lang/rust/pull/128273) | Improves Ord violation help message — changes panic message to `user-provided comparison function does not correctly implement a total order` and improves documentation.                                                                                                  | 2024-08-11 | Rust 1.81.0 |

The new implementation adds runtime consistency checks, actively panicking for many comparators that violate total order, whereas older sort implementations generally did not perform such checks.

Before 1.81.0 (e.g., 1.80.0): in limited tests, passing a non-deterministic comparator would silently produce seemingly random permutations. Starting from 1.81.0: the sort implementation can detect comparator inconsistency with high probability and panic.

## Summary

| Language      | Behavior                      |
| ------------- | ----------------------------- |
| JavaScript    | (seemingly) silently shuffles |
| Python        | (seemingly) silently shuffles |
| Go            | (seemingly) silently shuffles |
| C++           | (seemingly) silently shuffles |
| C#            | (seemingly) silently shuffles |
| Java          | (seemingly) silently shuffles |
| Dart          | (seemingly) silently shuffles |
| Rust(latest)  | **panic**                     |
| Rust(v1.80.0) | (seemingly) silently shuffles |

Seven languages chose to "pretend nothing happened" in the face of a random comparator, while only Rust (since v1.81.0) chose to panic.

This repository may be extended with more languages in the future (Zig, Swift, Kotlin, etc.), or dive deeper into the output of non-panic languages — to see whether different sorting algorithms exhibit statistical biases under a random comparator.

That's it for now. I'll tinker more when I have time.
