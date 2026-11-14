/** 管理端导航条目；`layouts/admin.vue` 的侧栏/顶部菜单与顶栏标题共用（管理端只有中文） */
export interface AdminNavEntry {
  to: string;
  icon: string;
  label: string;
}

/** 第一个是面板主页（`/admin`：密钥校验 + 管理入口） */
export const adminNav: AdminNavEntry[] = [
  { to: '/admin', icon: 'material-symbols:home', label: '主页' },
  { to: '/admin/r2', icon: 'material-symbols:upload', label: '文件上传' },
  { to: '/admin/ask-box', icon: 'material-symbols:forum', label: '提问箱审核' },
  { to: '/admin/city', icon: 'material-symbols:map', label: '城市地图' },
  { to: '/admin/cache', icon: 'material-symbols:delete-sweep', label: '缓存清除' },
  { to: '/admin/music', icon: 'material-symbols:music-note', label: '音乐缓存' },
];
