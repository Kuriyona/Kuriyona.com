import { HTTPError } from 'ky';

// 管理接口失败提示：401 直接指向密钥问题（admin 页面最常见的失败原因）
export const adminErrorText = (e: unknown): string => {
  if (e instanceof HTTPError) {
    if (e.response.status === 401) return '密钥无效或已失效，请到「密钥」页重新校验';
    return `请求失败（HTTP ${e.response.status}）`;
  }
  return '无法连接 API';
};
