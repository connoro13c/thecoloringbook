import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth-server';
import { uploadTempPage, uploadUserPage } from '@/lib/storage';
import { validateFiles } from '@/lib/validation';
import { v4 as uuidv4 } from 'uuid';

const validateAuth = async () => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return null; // Allow anonymous users
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

    // Generate single session ID for anonymous users
    const sessionId = userId ? null : uuidv4();

    const uploadResults = await Promise.all(
      files.map(async (file) => {
        const timestamp = Date.now();
        const filename = `${timestamp}-${file.name}`;
        
        if (userId) {
          // Authenticated user - permanent storage
          const result = await uploadUserPage(
            userId,
            filename,
            file,
            { contentType: file.type }
          );
          return {
            filename,
            url: result.signedUrl,
            size: file.size
          };
        }
        
        // Anonymous user - temporary storage
        const result = await uploadTempPage(
          sessionId as string,
          filename,
          file,
          { contentType: file.type }
        );
        return {
          filename,
          url: result.url,
          size: file.size,
          sessionId
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