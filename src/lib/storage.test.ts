/**
 * Tests for storage functionality including file association
 */
import { 
  uploadAnonymousFile, 
  associateFileWithUser, 
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

  describe('uploadAnonymousFile', () => {
    const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })

    it('should upload file to public folder successfully', async () => {
      mockUpload.mockResolvedValue({
        data: { path: 'public/test-uuid-1234-test.jpg' },
        error: null
      })

      const result = await uploadAnonymousFile(mockFile)

      expect(mockUpload).toHaveBeenCalledWith(
        'public/test-uuid-1234-test.jpg',
        mockFile,
        {
          cacheControl: '3600',
          upsert: false
        }
      )
      expect(result).toEqual({
        path: 'public/test-uuid-1234-test.jpg',
        publicUrl: 'https://test.supabase.co/storage/v1/object/public/pages/test-path'
      })
    })

    it('should handle upload errors', async () => {
      mockUpload.mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' }
      })

      await expect(uploadAnonymousFile(mockFile)).rejects.toThrow('Failed to save file to storage')
    })

    it('should call logger progress updates when provided', async () => {
      const mockLogger = {
      updateStorageProgress: jest.fn(),
        context: { id: 1 },
      startTime: Date.now(),
      stepTimes: {},
      jobId: 'test-job',
      reportProgress: jest.fn(),
      reportCost: jest.fn(),
      reportError: jest.fn(),
      reportSuccess: jest.fn(),
      complete: jest.fn(),
      stop: jest.fn(),
      updatePhotoProgress: jest.fn(),
      updateAnalysisProgress: jest.fn(),
      updatePromptProgress: jest.fn(),
      updateGenerationProgress: jest.fn(),
      updateDownloadProgress: jest.fn(),
      updateDatabaseProgress: jest.fn(),
      logStep: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn()
    } as unknown as ProgressiveLogger
      
      mockUpload.mockResolvedValue({
        data: { path: 'public/test-uuid-1234-test.jpg' },
        error: null
      })

      await uploadAnonymousFile(mockFile, mockLogger)

      expect(mockLogger.updateStorageProgress).toHaveBeenCalledWith('Uploading to public storage', expect.any(String))
      expect(mockLogger.updateStorageProgress).toHaveBeenCalledWith('Generating public URL')
    })
  })

  describe('associateFileWithUser', () => {
    it('should move file from public to user folder successfully', async () => {
      mockMove.mockResolvedValue({ error: null })

      const result = await associateFileWithUser('public/test-file.jpg', 'user-123')

      expect(mockMove).toHaveBeenCalledWith('public/test-file.jpg', 'user-123/test-file.jpg')
      expect(mockGetPublicUrl).toHaveBeenCalledWith('user-123/test-file.jpg')
      expect(result).toEqual({
        path: 'user-123/test-file.jpg',
        publicUrl: 'https://test.supabase.co/storage/v1/object/public/pages/test-path'
      })
    })

    it('should handle move errors', async () => {
      mockMove.mockResolvedValue({
        error: { message: 'Move failed' }
      })

      await expect(associateFileWithUser('public/test-file.jpg', 'user-123'))
        .rejects.toThrow('Failed to associate file with user')
    })

    it('should call logger progress updates when provided', async () => {
      const mockLogger = {
        updateStorageProgress: jest.fn(),
        context: { id: 1 },
        startTime: Date.now(),
        stepTimes: {},
        jobId: 'test-job',
        reportProgress: jest.fn(),
        reportCost: jest.fn(),
        reportError: jest.fn(),
        reportSuccess: jest.fn(),
        complete: jest.fn(),
        stop: jest.fn(),
        updatePhotoProgress: jest.fn(),
        updateAnalysisProgress: jest.fn(),
        updatePromptProgress: jest.fn(),
        updateGenerationProgress: jest.fn(),
        updateDownloadProgress: jest.fn(),
        updateDatabaseProgress: jest.fn(),
        logStep: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn()
      } as unknown as ProgressiveLogger
      
      mockMove.mockResolvedValue({ error: null })

      await associateFileWithUser('public/test-file.jpg', 'user-123', mockLogger)

      expect(mockLogger.updateStorageProgress).toHaveBeenCalledWith('Moving file to user folder')
      expect(mockLogger.updateStorageProgress).toHaveBeenCalledWith('Generating signed URL for user')
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
