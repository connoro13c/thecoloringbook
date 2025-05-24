import { z } from 'zod';

// File validation schema
export const FileSchema = z.object({
  name: z.string(),
  size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
  type: z.enum(['image/jpeg', 'image/jpg', 'image/png'], {
    errorMap: () => ({ message: 'Only JPEG and PNG files are allowed' }),
  }),
});

// Multiple files validation (1-3 files)
export const FilesSchema = z
  .array(FileSchema)
  .min(1, 'At least one image is required')
  .max(3, 'Maximum 3 images allowed');

export type FileType = z.infer<typeof FileSchema>;
export type FilesType = z.infer<typeof FilesSchema>;

// Validate file client-side
export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  try {
    FileSchema.parse({
      name: file.name,
      size: file.size,
      type: file.type,
    });
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message };
    }
    return { isValid: false, error: 'Invalid file' };
  }
};

// Validate multiple files
export const validateFiles = (files: File[]): { isValid: boolean; error?: string } => {
  try {
    const fileData = files.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    FilesSchema.parse(fileData);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message };
    }
    return { isValid: false, error: 'Invalid files' };
  }
};