import PDFDocument from 'pdfkit';
import sharp from 'sharp';

export interface PDFOptions {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  pageSize?: 'A4' | 'LETTER';
  margin?: number;
}

export interface ImageToPDFOptions extends PDFOptions {
  imageUrls: string[];
  fitToPage?: boolean;
  quality?: number;
}

// Convert image URLs to a PDF buffer
export async function generatePDFFromImages({
  imageUrls,
  title = 'Coloring Page',
  author = 'Coloring Book App',
  subject = 'Custom Generated Coloring Page',
  creator = 'Coloring Book App',
  pageSize = 'A4',
  margin = 50,
  fitToPage = true,
  quality = 90,
}: ImageToPDFOptions): Promise<Buffer> {
  const doc = new PDFDocument({
    size: pageSize,
    margin,
    info: {
      Title: title,
      Author: author,
      Subject: subject,
      Creator: creator,
      CreationDate: new Date(),
    },
  });

  const buffers: Buffer[] = [];
  doc.on('data', (buffer) => buffers.push(buffer));

  // Process each image
  for (let i = 0; i < imageUrls.length; i++) {
    const imageUrl = imageUrls[i];
    
    try {
      // Fetch and process the image
      const imageBuffer = await fetchImageAsBuffer(imageUrl);
      const processedImage = await optimizeImageForPrint(imageBuffer, quality);

          // Add new page for subsequent images
          if (i > 0) {
            doc.addPage();
          }

          // Calculate dimensions to fit page
          const pageWidth = doc.page.width - (margin * 2);
          const pageHeight = doc.page.height - (margin * 2);

          if (fitToPage) {
            // Fit image to page while maintaining aspect ratio
            doc.image(processedImage, margin, margin, {
              fit: [pageWidth, pageHeight],
              align: 'center',
              valign: 'center',
            });
          } else {
            // Center image on page at original size (if it fits)
            doc.image(processedImage, margin, margin, {
              width: Math.min(pageWidth, doc.page.width),
              height: Math.min(pageHeight, doc.page.height),
            });
          }

          // Add page number footer
          doc
            .fontSize(10)
            .fillColor('#666666')
            .text(
              `Page ${i + 1} of ${imageUrls.length}`,
              margin,
              doc.page.height - margin + 10,
              {
                align: 'center',
                width: pageWidth,
              }
            );

        } catch (imageError) {
          console.error(`Failed to process image ${i + 1}:`, imageError);
          
          // Add error page
          if (i > 0) {
            doc.addPage();
          }
          
          const errorPageWidth = doc.page.width - (margin * 2);
          doc
            .fontSize(16)
            .fillColor('#ff0000')
            .text(
              `Error loading image ${i + 1}`,
              margin,
              doc.page.height / 2,
              {
                align: 'center',
                width: errorPageWidth,
              }
            );
        }
      }

      doc.end();
      
      // Wait for PDF generation to complete
      return new Promise<Buffer>((resolve) => {
        doc.on('end', () => resolve(Buffer.concat(buffers)));
      });
}

// Fetch image from URL and return as buffer
async function fetchImageAsBuffer(imageUrl: string): Promise<Buffer> {
  try {
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error fetching image:', error);
    throw new Error(`Failed to fetch image from ${imageUrl}`);
  }
}

// Optimize image for print quality
async function optimizeImageForPrint(
  imageBuffer: Buffer,
  quality: number = 90
): Promise<Buffer> {
  try {
    // Use sharp to optimize the image
    const optimized = await sharp(imageBuffer)
      .jpeg({
        quality,
        progressive: true,
        mozjpeg: true,
      })
      .toBuffer();

    return optimized;
  } catch (error) {
    console.error('Error optimizing image:', error);
    // Return original buffer if optimization fails
    return imageBuffer;
  }
}

// Generate a single-page PDF from one image
export async function generateSinglePagePDF(
  imageUrl: string,
  options: PDFOptions = {}
): Promise<Buffer> {
  return generatePDFFromImages({
    imageUrls: [imageUrl],
    ...options,
  });
}

// Combine multiple PDFs into one
export async function combinePDFs(pdfBuffers: Buffer[]): Promise<Buffer> {
  if (pdfBuffers.length === 0) {
    throw new Error('No PDF buffers provided');
  }

  if (pdfBuffers.length === 1) {
    return pdfBuffers[0];
  }

  // For simplicity, we'll generate a new PDF with all images
  // In a more advanced implementation, you might use pdf-lib to merge actual PDFs
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: 'Combined Coloring Pages',
          Author: 'Coloring Book App',
          Subject: 'Multiple Coloring Pages',
          Creator: 'Coloring Book App',
          CreationDate: new Date(),
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (buffer) => buffers.push(buffer));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Add each PDF as pages
      // Note: This is a simplified approach - in production you'd want to use pdf-lib
      for (let i = 0; i < pdfBuffers.length; i++) {
        if (i > 0) {
          doc.addPage();
        }
        
        // Add a placeholder for each combined PDF
        doc
          .fontSize(16)
          .fillColor('#333333')
          .text(
            `Coloring Page ${i + 1}`,
            50,
            doc.page.height / 2,
            {
              align: 'center',
              width: doc.page.width - 100,
            }
          );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Utility to estimate PDF file size
export function estimatePDFSize(imageCount: number, avgImageSizeKB: number = 500): number {
  // Rough estimation: base PDF overhead + compressed images
  const basePDFOverhead = 50; // KB
  const compressionRatio = 0.8; // 80% of original size after PDF compression
  
  return Math.round(basePDFOverhead + (imageCount * avgImageSizeKB * compressionRatio));
}