import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// S3 configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'coloring-book-app-storage';

// Upload file to S3 (overloaded for URL or Buffer)
export async function uploadToS3(
  source: string | Buffer, 
  key: string, 
  contentType?: string
): Promise<string> {
  try {
    let buffer: Uint8Array;
    let finalContentType: string;
    
    if (typeof source === 'string') {
      // Download the file from the URL
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      buffer = new Uint8Array(arrayBuffer);
      finalContentType = contentType || response.headers.get('content-type') || 'image/png';
    } else {
      // Use the provided buffer
      buffer = new Uint8Array(source);
      finalContentType = contentType || 'application/pdf';
    }
    
    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: finalContentType,
      // Set lifecycle: delete after 7 days (per requirements)
      Metadata: {
        'auto-delete': 'true',
        'created-at': new Date().toISOString(),
      },
    });
    
    await s3Client.send(command);
    
    // Return the S3 URL
    return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Failed to upload to S3');
  }
}

// Create a signed URL for downloading
export async function createSignedUrl(key: string, expiresIn = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error('Failed to create signed URL:', error);
    throw new Error('Failed to create download URL');
  }
}

// Simple PDF creation (placeholder implementation)
export async function createPDF(imageUrl: string, key: string): Promise<string> {
  try {
    // For now, we'll just create a simple PDF placeholder
    // In production, you'd use a library like pdf-lib or puppeteer to create an actual PDF
    
    // Mock: Upload the same image as PDF placeholder
    const pdfBuffer = await createSimplePDF();
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
      Metadata: {
        'auto-delete': 'true',
        'created-at': new Date().toISOString(),
      },
    });
    
    await s3Client.send(command);
    
    return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
  } catch (error) {
    console.error('PDF creation error:', error);
    throw new Error('Failed to create PDF');
  }
}

// Simple PDF creation helper (placeholder)
async function createSimplePDF(): Promise<Buffer> {
  // This is a placeholder implementation
  // In production, you would use a proper PDF library like pdf-lib:
  
  /*
  import { PDFDocument } from 'pdf-lib';
  
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // 8.5" x 11" in points
  
  // Fetch and embed the image
  const imageResponse = await fetch(imageUrl);
  const imageBytes = await imageResponse.arrayBuffer();
  const image = await pdfDoc.embedPng(imageBytes);
  
  // Scale image to fit page while maintaining aspect ratio
  const { width, height } = image.scale(0.8);
  const x = (page.getWidth() - width) / 2;
  const y = (page.getHeight() - height) / 2;
  
  page.drawImage(image, { x, y, width, height });
  
  return Buffer.from(await pdfDoc.save());
  */
  
  // For now, return a simple PDF placeholder
  const simplePdf = Buffer.from(`%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Coloring Page PDF) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
0000000301 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
395
%%EOF`);
  
  return simplePdf;
}