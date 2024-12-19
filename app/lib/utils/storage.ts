import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

export async function uploadDocument(
  file: File,
  systemId: string,
  systemName: string
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `systems/${systemId}/${systemName}-${Date.now()}-${file.name}`;

  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: file.type
  }));

  return `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`;
} 