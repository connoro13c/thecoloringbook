import { put } from '@vercel/blob';

export interface UploadResult {
  url: string;
  filename: string;
}

export async function uploadToBlob(
  file: File,
  userId: string
): Promise<UploadResult> {
  const timestamp = Date.now();
  const filename = `${userId}/${timestamp}-${file.name}`;

  try {
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    return {
      url: blob.url,
      filename: blob.pathname,
    };
  } catch (error) {
    console.error('Blob upload error:', error);
    throw new Error('Failed to upload file');
  }
}

export async function uploadMultipleToBlob(
  files: File[],
  userId: string
): Promise<UploadResult[]> {
  const uploadPromises = files.map((file) => uploadToBlob(file, userId));
  return Promise.all(uploadPromises);
}