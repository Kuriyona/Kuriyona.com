import Config from '../Kuriyona/config.json';

export default defineAppConfig({
  ...Config,
  links: {
    main: [
      {
        url: 'https://space.bilibili.com/1337924642',
        title: '鱼块糯 - 哔哩哔哩',
        avatar: 'https://r2.kuriyona.com/img/xFurina/xFurina.jpg',
      },
      {
        url: 'https://github.com/lfcypo',
        title: 'lfcypo - GitHub',
        avatar: 'https://avatars.githubusercontent.com/u/110813385',
      },
    ],
    others: [
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
    ],
  },
});
