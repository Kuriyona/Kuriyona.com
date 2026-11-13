/** 时间线条目；按时间正序存放，页面自行倒序 */
export interface TimelineEntry {
  /** `YYYY/MM/DD` */
  date: string;
  text: string;
  /** 展示为徽标，同时是 /about/trans「性别认同历程」的过滤条件 */
  tag?: string;
  /** 外部链接或站内路径 */
  link?: string;
}

export const timeline: TimelineEntry[] = [
  { date: '2008/06/28', text: '出生' },
  { date: '2024/07/04', text: '与第一任相识', tag: '情感' },
  {
    date: '2025/11/22',
    text: '性别认同的初步确定',
    tag: '性别认同',
    link: '/about/trans',
  },
  { date: '2025/11/27', text: '取名「未晞」', tag: '性别认同', link: '/blog/about-name' },
  { date: '2025/12/17', text: '第一段感情开始', tag: '情感' },
  { date: '2026/01/14', text: '开始 GAHT', tag: '性别认同' },
  {
    date: '2026/03/22',
    text: '与家人出柜',
    tag: '性别认同',
    link: 'https://x.com/Kuriyona/status/2080588142462018030',
  },
  { date: '2026/03/29', text: '第一次有真正去自杀的想法，并做出了一些行动的' },
  { date: '2026/04/18', text: '第一段感情结束', tag: '情感' },
  {
    date: '2026/06/10',
    text: '高考结束',
    link: 'https://x.com/Kuriyona/status/2064274240904557051?s=20',
  },
  { date: '2026/06/11', text: '与第二任相识', tag: '情感' },
  { date: '2026/06/28', text: '成年' },
  {
    date: '2026/07/20',
    text: '开到「小证」',
    tag: '性别认同',
    link: 'https://x.com/Kuriyona/status/2079144290828374085',
  },
  { date: '2026/07/25', text: '第二段感情开始', tag: '情感' },
  {
    date: '2026/08/24',
    text: '开到「大证」',
    tag: '性别认同',
    link: 'https://x.com/Kuriyona/status/2091865594065006760',
  },
  {
    date: '2026/08/24',
    text: '开始慢慢有了在家 RLE 的可能',
    tag: '性别认同',
    link: 'https://x.com/Kuriyona/status/2094392084572905681',
  },
  {
    date: '2026/09/15',
    text: '离死亡最近的一次...',
    link: 'https://x.com/Kuriyona/status/2100271658728857609',
  },
  {
    date: '2026/09/16',
    text: '改名「未晞」',
    tag: '性别认同',
    link: 'https://x.com/Kuriyona/status/2102109729539719245',
  },
  {
    date: '2026/09/16',
    text: '第一次在医院开具正规 GAHT 处方并拿药',
    tag: '性别认同',
    link: 'https://x.com/Kuriyona/status/2108499902368223233',
  },
];
