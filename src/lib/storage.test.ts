/**
 * Tests for storage functionality
 */
import { 
  uploadUserImage, 
  generateFilename 
} from './storage'
import type { ProgressiveLogger } from './ai/progressive-logger'

// Mock Supabase client
const mockUpload = jest.fn()
const mockMove = jest.fn()
const mockGetPublicUrl = jest.fn()

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: mockUpload,
        move: mockMove,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  }),
}))

// Mock UUID
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-1234',
}))

describe('Storage Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/pages/test-path' }
    })
  })

  describe('uploadUserImage', () => {
    const mockBuffer = Buffer.from('test image data')

    it('should upload directly to user folder', async () => {
      mockUpload.mockResolvedValue({
        data: { path: 'user-123/test-image.jpg' },
        error: null
      })

      const result = await uploadUserImage(mockBuffer, 'user-123', 'test-image.jpg')

      expect(mockUpload).toHaveBeenCalledWith(
        'user-123/test-image.jpg',
        mockBuffer,
        {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        }
      )
      expect(result).toEqual({
        path: 'user-123/test-image.jpg',
        publicUrl: 'https://test.supabase.co/storage/v1/object/public/pages/test-path'
      })
    })

    it('should handle upload errors', async () => {
      mockUpload.mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' }
      })

      await expect(uploadUserImage(mockBuffer, 'user-123', 'test-image.jpg'))
        .rejects.toThrow('Failed to save user image to storage')
    })
  })

  describe('generateFilename', () => {
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(1234567890)
      jest.spyOn(Math, 'random').mockReturnValue(0.123456789)
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should generate unique filename with default prefix', () => {
      const filename = generateFilename()
      expect(filename).toMatch(/^coloring-\d+-[a-z0-9]+\.jpg$/)
    })

    it('should generate unique filename with custom prefix', () => {
      const filename = generateFilename('test')
      expect(filename).toMatch(/^test-\d+-[a-z0-9]+\.jpg$/)
    })
  })
})
