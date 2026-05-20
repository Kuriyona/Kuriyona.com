import ky from 'ky';
const apiKey = process.env.PUSHPLUS_API_KEY;
export const push = async (message: { title: string; content: string }) => {
  return await ky
    .post(`https://www.pushplus.plus/send`, {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...message, token: apiKey, template: 'markdown' }),
    })
    .json();
};
