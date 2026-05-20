import dayjs from 'dayjs';
import ky from 'ky';
const apiKey = process.env.PUSHPLUS_API_KEY;
const DAY_LIMIT = 100;

let date = dayjs().format('YYYY-MM-DD');
let count = 0;

export const checkLimit = () => {
  if (date !== dayjs().format('YYYY-MM-DD')) {
    date = dayjs().format('YYYY-MM-DD');
    count = 0;
  }
  count++;
  return count <= DAY_LIMIT;
};

export const push = async (message: { title: string; content: string }) => {
  if (!checkLimit()) {
    return {
      code: 429,
      message: '请求频率过快',
    };
  }
  return await ky
    .post(`https://www.pushplus.plus/send`, {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...message, token: apiKey, template: 'markdown' }),
    })
    .json();
};
