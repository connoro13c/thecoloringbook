import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { PDFDocument } from 'pdf-lib'
import { createClient } from '@supabase/supabase-js'
import { StorageService } from '@/lib/storage'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const makePdfSchema = z.object({
  jobId: z.string().uuid()
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { jobId } = makePdfSchema.parse(body)

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.status !== 'COMPLETED' && job.status !== 'PAID') {
      return NextResponse.json(
        { error: 'Job must be completed before creating PDF' },
        { status: 400 }
      )
    }

    if (!job.output_url) {
      return NextResponse.json(
        { error: 'No output image available' },
        { status: 400 }
      )
    }

    // If PDF already exists, return it
    if (job.pdf_url) {
      return NextResponse.json({
        pdfUrl: job.pdf_url,
        jobId: job.id
      })
    }

    try {
      // Download the PNG image from storage
      const imagePath = job.output_url.split('/uploads/')[1]
      const pngBytes = await StorageService.download(imagePath)

      // Create PDF document
      const pdfDoc = await PDFDocument.create()
      
      // Set document metadata
      pdfDoc.setTitle('Coloring Page')
      pdfDoc.setSubject(`Generated from: ${job.prompt}`)
      pdfDoc.setCreator('Coloring Book App')
      pdfDoc.setProducer('Coloring Book App')
      pdfDoc.setCreationDate(new Date())

      // Add page (US Letter size: 8.5\" x 11\" = 612 x 792 points)
      const page = pdfDoc.addPage([612, 792])
      
      // Embed PNG image
      const pngImage = await pdfDoc.embedPng(pngBytes)
      
      // Calculate dimensions to fit the page with margin
      const margin = 36 // 0.5 inch margin
      const maxWidth = 612 - (margin * 2) // 540 points
      const maxHeight = 792 - (margin * 2) // 720 points
      
      const imgDims = pngImage.scale(1)
      let width = imgDims.width
      let height = imgDims.height
      
      // Scale down if image is too large
      if (width > maxWidth || height > maxHeight) {
        const scaleX = maxWidth / width
        const scaleY = maxHeight / height
        const scale = Math.min(scaleX, scaleY)
        width *= scale
        height *= scale
      }
      
      // Center the image on the page
      const x = (612 - width) / 2
      const y = (792 - height) / 2
      
      // Draw the image
      page.drawImage(pngImage, {
        x,
        y,
        width,
        height
      })

      // Generate PDF bytes
      const pdfBytes = await pdfDoc.save()

      // Upload PDF to storage
      const pdfFilename = `${jobId}_coloring_page.pdf`
      const uploadResult = await StorageService.upload(
        userId,
        pdfFilename,
        new Uint8Array(pdfBytes),
        { contentType: 'application/pdf' }
      )

      // Update job with PDF URL
      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          pdf_url: uploadResult.url,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)

      if (updateError) {
        console.error('Failed to update job with PDF URL:', updateError)
      }

      return NextResponse.json({
        pdfUrl: uploadResult.url,
        jobId: job.id
      })

    } catch (pdfError) {
      console.error('PDF creation failed:', pdfError)
      return NextResponse.json(
        { error: 'Failed to create PDF' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Make PDF API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}