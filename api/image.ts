import Elysia from 'elysia';
import dayjs from 'dayjs';

// s3
import {
  S3Client,
  ListObjectsCommand,
  PutObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: 'us-east-1',
  endpoint: process.env.ENDPOINT,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!
  }
});

const app = new Elysia({ prefix: '/image' })
  .get('/list', async ({ params }) => {
    const list = await s3.send(
      new ListObjectsCommand({
        Bucket: process.env.BUCKET_NAME,
        Prefix: 'image'
      })
    );
    return list.Contents;
  })
  .get(
    '/upload-signed-url',
    async ({ query: { filename, mime, auth }, set }) => {
      if (auth !== process.env.AUTH_KEY) {
        set.status = 401;
        return null;
      }
      const key = `image/${dayjs().format('YYYY-MM')}/${dayjs().format('HH-mm-ss')}-${filename}`;
      const command = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: key,
        ContentType: mime
      });
      return {
        url: await getSignedUrl(s3, command),
        key
      };
    }
  );

export { app as RouteImage };
