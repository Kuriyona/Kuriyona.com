import ky from 'ky';
const secretKey = process.env.TURNSTILE_SECRET_KEY;

export const verifyTurnstile = async (token: string) => {
  const data = await ky
    .post(`https://challenges.cloudflare.com/turnstile/v0/siteverify`, {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    })
    .json<{ success: boolean }>();
  return data.success;
};
