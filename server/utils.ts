import ky from 'ky';
const host = process.env.GOTIFY_HOST;
const apiKey = process.env.GOTIFY_API_KEY;
export const push = async (message: { title: string; message: string; priority?: number }) => {
  console.log(JSON.stringify(message));
  return await ky
    .post(`${host}/message?token=${apiKey}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })
    .json();
};
