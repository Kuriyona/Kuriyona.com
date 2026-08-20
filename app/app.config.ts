import Config from './config.json';

const nav = [
  {
    to: '/blog',
    shortTitleKey: 'blog.short-title',
    titleKey: 'blog.title',
    descKey: 'blog.desc',
  },
  { to: '/timeline', titleKey: 'timeline.title', descKey: 'timeline.desc' },
  {
    to: '/neko',
    shortTitleKey: 'neko.short-title',
    titleKey: 'neko.title',
    descKey: 'neko.desc',
    enabled: false,
  },
  { to: '/status', titleKey: 'status.title', descKey: 'status.desc', enabled: false },
  {
    to: '/about/devices',
    titleKey: 'about.devices.title',
    descKey: 'about.devices.desc',
    enabled: false,
  },
  { to: '/ask-box', titleKey: 'ask-box.title', descKey: 'ask-box.desc' },
];

const timeline = [
  { date: '2008/06/28', text: '出生' },
  { date: '2024/07/04', text: '与第一任相识', tag: '情感' },
  { date: '2025/11/22', text: '性别认同的初步确定', tag: '性别认同' },
  { date: '2025/11/27', text: '取名「未晞」', tag: '性别认同' },
  { date: '2025/12/17', text: '第一段感情开始', tag: '情感' },
  { date: '2026/01/14', text: '开始 GAHT', tag: '性别认同' },
  { date: '2026/03/22', text: '与家人出柜', tag: '性别认同' },
  { date: '2026/03/29', text: '离死亡/自杀最近的一次？' },
  { date: '2026/04/18', text: '第一段感情结束', tag: '情感' },
  { date: '2026/06/10', text: '高考结束' },
  { date: '2026/06/11', text: '与第二任相识', tag: '情感' },
  { date: '2026/06/28', text: '成年' },
  { date: '2026/06/30', text: '放下第一任', tag: '情感' },
  { date: '2026/07/22', text: '开到「小证」', tag: '性别认同' },
  { date: '2026/07/25', text: '第二段感情开始', tag: '情感' },
];

export default defineAppConfig({
  ...Config,
  nav: nav.filter((item) => item.enabled !== false),
  timeline,
  links: {
    main: [
      {
        url: 'https://space.bilibili.com/1337924642',
        title: '鱼块糯 - 哔哩哔哩',
        avatar: 'https://r2.kuriyona.com/img/xFurina/xFurina.jpg',
      },
    ],
    others: [
      {
        url: 'https://github.com/lfcypo',
        title: 'lfcypo - GitHub',
        avatar: 'https://avatars.githubusercontent.com/u/110813385',
      },
      {
        url: 'https://maao.cc/',
        title: "Here's Mars",
        avatar: 'https://maao.cc/favicon.ico',
      },
      {
        url: 'https://launchpadx.top',
        title: '启动台の小窝',
        desc: '用代码改变世界',
        avatar: 'https://avatars.githubusercontent.com/u/67402215',
      },
      {
        url: 'https://paimon.com.cn',
        title: '蜜酱胡萝卜派蒙',
        avatar: 'https://paimon.com.cn/assets/img/logo.png',
      },
      {
        url: 'https://qrasa.cn',
        title: 'Qrasa 的小站',
        avatar:
          'https://blog.qrasa.cn/wp-content/uploads/2025/11/cropped-1764501521-3ca59cafd35748c38efd5d624a25243a-e1765684431787.jpeg',
      },
    ],
    links: [
      {
        url: 'https://zkn.moe',
        title: 'kave',
        desc: '一个灵魂处于布朗运动中的学生',
        avatar: 'https://zkn.moe/profile.jpeg',
      },
      {
        url: 'https://www.nekro.top',
        title: 'Nekro’s SEKAI',
        desc: '自留地、日常记录、经验分享。',
        avatar: 'https://avatars.githubusercontent.com/u/90670998',
      },
      {
        url: 'https://blog.rhen.cloud',
        title: "RhenCloud's Blog",
        desc: '趁世界还未重启之前 约一次爱恋',
        avatar: 'https://blog.rhen.cloud/avatar.webp',
      },
    ],
  },
});
