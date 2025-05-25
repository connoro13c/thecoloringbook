import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth-server';
import { StorageService } from '@/lib/storage';
import { validateFiles } from '@/lib/validation';

const validateAuth = async () => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Unauthorized');
  }
  return user.id;
};

const parseFiles = async (request: NextRequest) => {
  const formData = await request.formData();
  const files = formData.getAll('files') as File[];
  
  if (!files || files.length === 0) {
    throw new Error('No files provided');
  }
  
  return files;
};

export async function POST(request: NextRequest) {
  try {
    const userId = await validateAuth();
    const files = await parseFiles(request);

    const validation = validateFiles(files);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const uploadResults = await Promise.all(
      files.map(async (file) => {
        const timestamp = Date.now();
        const filename = `${timestamp}-${file.name}`;
        
        const result = await StorageService.upload(
          userId,
          filename,
          file,
          { contentType: file.type }
        );
        
        return {
          url: result.url,
          filename: filename,
        };
      })
    );

    return NextResponse.json({
      success: true,
      files: uploadResults,
    });
  } catch (error) {
    console.error('Upload API error:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (error instanceof Error && error.message === 'No files provided') {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}