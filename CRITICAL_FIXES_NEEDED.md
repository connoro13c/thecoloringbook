# Critical Fixes Required for Stripe Payment Integration

## 1. HIGH PRIORITY: File Generation Missing

### Problem
The webhook tries to create presigned URLs for PDF/PNG files that don't exist.

### Required Fix
Create high-resolution PDF and PNG files during or immediately after image generation:

```typescript
// Add to generation service after JPG creation
async function createHighResVersions(pageId: string, imageBase64: string) {
  // Generate PDF using pdf-kit
  const pdfBuffer = await generatePDF(imageBase64);
  const pdfPath = `${userId}/${pageId}/high-res.pdf`;
  await uploadToStorage(pdfBuffer, pdfPath);
  
  // Generate high-res PNG (1024x1024 or higher)
  const pngBuffer = await generateHighResPNG(imageBase64);
  const pngPath = `${userId}/${pageId}/high-res.png`;
  await uploadToStorage(pngBuffer, pngPath);
  
  return { pdfPath, pngPath };
}
```

## 2. HIGH PRIORITY: Fix Webhook Storage Logic

### Problem
Webhook stores presigned URLs instead of permanent file paths.

### Required Fix
```typescript
// CURRENT (WRONG):
pdf_path: pdfUrl.signedUrl,
png_path: pngUrl.signedUrl,

// SHOULD BE:
pdf_path: pdfPath,
png_path: pngPath,
```

## 3. MEDIUM PRIORITY: Add Missing Dependencies

```bash
npm install pdf-kit canvas sharp
```

## 4. MEDIUM PRIORITY: Implement Cold Storage

Add cron job for moving files to cold storage after 90 days:

```typescript
// Add to /api/cron/archive-old-files
export async function POST() {
  const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  
  // Find files older than 90 days
  const { data: oldFiles } = await supabase
    .from('downloads')
    .select('*')
    .lt('last_accessed_at', cutoffDate.toISOString())
    .eq('storage_tier', 'hot');
    
  // Move to cold storage and update tier
  for (const file of oldFiles) {
    await moveToColStorage(file);
    await updateStorageTier(file.id, 'cold');
  }
}
```

## 5. LOW PRIORITY: Email Notifications

Add SendGrid integration for custom donation receipts as specified in paymentplan.md.

## Summary
The current implementation is 70% complete but will fail in production due to missing file generation. The foundational work is solid, but these critical fixes are required before the payment flow can work.
