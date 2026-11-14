/**
 * `https://www.cloudflarestatus.com/api/v2/summary.json` 里本站用到的部分。
 *
 * 只保留节点列表：顶栏抽屉拿 `components[].name` 里的 colo 码去匹配 `cdn-cgi/trace` 的 `colo`。
 * 上游还有 page / incidents / scheduled_maintenances 等字段，本站一律不读，
 * 别再把整份生成出来的 schema 抄回来（只会让类型文件比用它的代码长两个数量级）。
 */
export interface CloudflareSummary {
  components: { name: string }[];
}
