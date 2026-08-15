import Config from '../Kuriyona/config.json';

const nav = [
  { to: '/blog', title: 'Blog' },
  { to: '/neko', title: 'Neko', enabled: false },
  { to: '/status', titleKey: 'status.title', enabled: false },
  { to: '/ask-box', titleKey: 'ask-box.title' },
];

export default defineAppConfig({
  ...Config,
  nav: nav.filter((item) => item.enabled !== false),
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
