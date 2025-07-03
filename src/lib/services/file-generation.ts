import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import { createServiceClient } from '@/lib/supabase/server';

export interface FileGenerationResult {
  pdfPath: string;
  pngPath: string;
  pdfBuffer: Buffer;
  pngBuffer: Buffer;
}

/**
 * Generate PDF from base64 image data
 */
export async function generatePDF(imageBase64: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: 'LETTER', // 8.5" x 11"
        margins: {
          top: 36,    // 0.5 inch
          bottom: 36,
          left: 36,
          right: 36
        }
      });

      const chunks: Buffer[] = [];
      
      // Collect PDF chunks
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Convert base64 to buffer
      const imageBuffer = Buffer.from(imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
      
      // Calculate image dimensions to fit page
      const pageWidth = doc.page.width - 72; // 1 inch margins
      const pageHeight = doc.page.height - 72;
      
      // Add title
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('Your Personalized Coloring Page', 36, 36, { align: 'center' });
      
      // Add image (centered and scaled to fit)
      doc.image(imageBuffer, {
        fit: [pageWidth, pageHeight - 60], // Leave space for title
        align: 'center',
        valign: 'center'
      });
      
      // Add footer
      doc.fontSize(8)
         .font('Helvetica')
         .text('Created with love by The Coloring Book • thecoloringbook.com', 
               36, doc.page.height - 50, 
               { align: 'center', width: pageWidth });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate high-resolution PNG from base64 image data
 */
export async function generateHighResPNG(imageBase64: string): Promise<Buffer> {
  try {
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
    
    // Process with Sharp to ensure high quality and consistent format
    const pngBuffer = await sharp(imageBuffer)
      .png({
        quality: 100,
        compressionLevel: 0, // No compression for highest quality
        adaptiveFiltering: false
      })
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .toBuffer();
    
    return pngBuffer;
  } catch (error) {
    console.error('Error generating high-res PNG:', error);
    throw new Error('Failed to generate high-resolution PNG');
  }
}

/**
 * Upload file buffer to Supabase storage
 */
export async function uploadToStorage(
  buffer: Buffer, 
  filePath: string, 
  contentType: string
): Promise<string> {
  try {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase.storage
      .from('pages')
      .upload(filePath, buffer, {
        contentType,
        upsert: true // Overwrite if exists
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw new Error(`Failed to upload to storage: ${error.message}`);
    }

    return data.path;
  } catch (error) {
    console.error('Upload to storage failed:', error);
    throw error;
  }
}

/**
 * Create high-resolution PDF and PNG versions of a coloring page
 */
export async function createHighResVersions(
  pageId: string, 
  userId: string, 
  imageBase64: string
): Promise<FileGenerationResult> {
  try {
    console.log(`🎨 Generating high-res files for page ${pageId}`);
    
    // Generate PDF and PNG buffers in parallel
    const [pdfBuffer, pngBuffer] = await Promise.all([
      generatePDF(imageBase64),
      generateHighResPNG(imageBase64)
    ]);

    // Define file paths
    const pdfPath = `${userId}/${pageId}/high-res.pdf`;
    const pngPath = `${userId}/${pageId}/high-res.png`;

    // Upload both files to storage in parallel
    await Promise.all([
      uploadToStorage(pdfBuffer, pdfPath, 'application/pdf'),
      uploadToStorage(pngBuffer, pngPath, 'image/png')
    ]);

    console.log(`✅ High-res files uploaded: ${pdfPath}, ${pngPath}`);

    return {
      pdfPath,
      pngPath,
      pdfBuffer,
      pngBuffer
    };
  } catch (error) {
    console.error('Error creating high-res versions:', error);
    throw new Error('Failed to create high-resolution files');
  }
}

/**
 * Generate presigned download URLs for existing files
 */
export async function generateDownloadUrls(
  pdfPath: string, 
  pngPath: string, 
  expiresInSeconds: number = 86400 // 24 hours
): Promise<{ pdfUrl: string; pngUrl: string }> {
  try {
    const supabase = createServiceClient();

    const [pdfResult, pngResult] = await Promise.all([
      supabase.storage.from('pages').createSignedUrl(pdfPath, expiresInSeconds),
      supabase.storage.from('pages').createSignedUrl(pngPath, expiresInSeconds)
    ]);

    if (pdfResult.error) {
      throw new Error(`Failed to generate PDF URL: ${pdfResult.error.message}`);
    }

    if (pngResult.error) {
      throw new Error(`Failed to generate PNG URL: ${pngResult.error.message}`);
    }

    return {
      pdfUrl: pdfResult.data.signedUrl,
      pngUrl: pngResult.data.signedUrl
    };
  } catch (error) {
    console.error('Error generating download URLs:', error);
    throw error;
  }
}
