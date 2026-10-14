import { HTTPError } from 'ky';

// 管理接口失败提示：401 直接指向密钥问题（admin 页面最常见的失败原因）
export const adminErrorText = (e: unknown): string => {
  if (e instanceof HTTPError) {
    if (e.response.status === 401) return '密钥无效或已失效，请到「密钥」页重新校验';
    return `请求失败（HTTP ${e.response.status}）`;
  }
  return '无法连接 API';
};

// 同上，但优先用响应体里的 `{ message }`（清缓存等接口会把上游原文放在里面）
export const adminErrorMessage = async (e: unknown): Promise<string> => {
  if (!(e instanceof HTTPError)) return '无法连接 API';
  try {
    const body = (await e.response.clone().json()) as { message?: string };
    if (body?.message) return body.message;
  } catch {
    // 响应体不是 JSON：回落到通用文案
  }
  return adminErrorText(e);
};
