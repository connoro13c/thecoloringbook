import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth-server'
import { z } from 'zod'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getUserPageSignedUrl } from '@/lib/storage'
import PDFDocument from 'pdfkit'

const supabase = createSupabaseClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Validation schema
const exportPdfSchema = z.object({
  pageId: z.string().uuid('Invalid page ID')
})

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authClient = await createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = user.id

    // Parse and validate request body
    const body = await request.json()
    const validation = exportPdfSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { pageId } = validation.data

    // Get the page record
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .eq('user_id', userId)
      .single()

    if (pageError || !page) {
      return NextResponse.json(
        { error: 'Page not found or access denied' },
        { status: 404 }
      )
    }

    // Check if payment is required and hasn't been made
    if (!page.paid) {
      return NextResponse.json(
        { error: 'Payment required for PDF export' },
        { status: 402 }
      )
    }

    try {
      // Get the JPG image
      const imageUrl = await getUserPageSignedUrl(page.jpg_path)
      const imageResponse = await fetch(imageUrl)
      
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch image')
      }

      const imageBuffer = await imageResponse.arrayBuffer()

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      })

      // Add title
      doc.fontSize(20)
         .text('Coloring Page', 50, 50)
      
      // Add metadata
      doc.fontSize(12)
         .text(`Style: ${page.style}`, 50, 80)
         .text(`Created: ${new Date(page.created_at).toLocaleDateString()}`, 50, 100)

      // Add image (centered and scaled to fit page)
      const pageWidth = doc.page.width - 100 // Account for margins
      const pageHeight = doc.page.height - 200 // Account for title and margins
      
      doc.image(Buffer.from(imageBuffer), 50, 130, {
        fit: [pageWidth, pageHeight],
        align: 'center',
        valign: 'center'
      })

      // Stream the PDF
      const chunks: Buffer[] = []
      
      doc.on('data', (chunk) => {
        chunks.push(chunk)
      })

      return new Promise<NextResponse>((resolve) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks)
          
          resolve(new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="coloring-page-${pageId}.pdf"`
            }
          }))
        })

        doc.end()
      })

    } catch (error) {
      console.error('Failed to generate PDF:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF'
      
      return NextResponse.json(
        { error: 'Failed to generate PDF', details: errorMessage },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Export PDF API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}