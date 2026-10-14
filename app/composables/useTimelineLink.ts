/**
 * 时间线条目的跳转处理：外部链接新窗口打开、内部路径走 localePath。
 * `/timeline` 页面与 `TimelineList` 组件共用，避免两处各写一遍。
 */
export const useTimelineLink = () => {
  const localePath = useLocalePath();
  const route = useRoute();

  const isExternal = (link: string) => link.startsWith('http');

  /** 内部链接且指向当前页面（如 /about/trans 上的条目指向自身）→ 不渲染跳转按钮 */
  const isCurrent = (link: string) => !isExternal(link) && localePath(link) === route.path;

  function openLink(link: string) {
    if (isExternal(link)) window.open(link, '_blank', 'noopener');
    else navigateTo(localePath(link));
  }

  const linkIcon = (link: string) =>
    isExternal(link) ? 'material-symbols:open-in-new' : 'material-symbols:arrow-forward';

  return { isExternal, isCurrent, openLink, linkIcon };
};
