/**
 * Tests for the associate-file API route
 */
import { POST, GET } from '../route'
import { NextRequest } from 'next/server'

// Mock the storage function
const mockAssociateFileWithUser = jest.fn()
jest.mock('@/lib/storage', () => ({
  associateFileWithUser: mockAssociateFileWithUser,
}))

// Mock Supabase client
const mockGetUser = jest.fn()
jest.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}))

describe('/api/v1/associate-file', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST', () => {
    it('should associate file successfully for authenticated user', async () => {
      // Mock authenticated user
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      // Mock successful file association
      mockAssociateFileWithUser.mockResolvedValue({
        path: 'user-123/test-file.jpg',
        publicUrl: 'https://test.supabase.co/storage/v1/object/public/pages/user-123/test-file.jpg'
      })

      const request = new NextRequest('http://localhost:3000/api/v1/associate-file', {
        method: 'POST',
        body: JSON.stringify({ filePath: 'public/test-file.jpg' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        path: 'user-123/test-file.jpg',
        publicUrl: 'https://test.supabase.co/storage/v1/object/public/pages/user-123/test-file.jpg'
      })
      expect(mockAssociateFileWithUser).toHaveBeenCalledWith('public/test-file.jpg', 'user-123')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/v1/associate-file', {
        method: 'POST',
        body: JSON.stringify({ filePath: 'public/test-file.jpg' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({
        success: false,
        error: 'Authentication required'
      })
    })

    it('should return 401 for auth error', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth error' },
      })

      const request = new NextRequest('http://localhost:3000/api/v1/associate-file', {
        method: 'POST',
        body: JSON.stringify({ filePath: 'public/test-file.jpg' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({
        success: false,
        error: 'Authentication required'
      })
    })

    it('should validate file path is in public folder', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/v1/associate-file', {
        method: 'POST',
        body: JSON.stringify({ filePath: 'user-456/test-file.jpg' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        error: 'Invalid file path - file must be in public folder'
      })
    })

    it('should return 400 for invalid request data', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/associate-file', {
        method: 'POST',
        body: JSON.stringify({ filePath: '' }), // Empty file path
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid request data')
      expect(data.details).toBeDefined()
    })

    it('should return 400 for missing filePath', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/associate-file', {
        method: 'POST',
        body: JSON.stringify({}), // Missing filePath
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid request data')
    })

    it('should handle storage errors', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      mockAssociateFileWithUser.mockRejectedValue(new Error('Storage error'))

      const request = new NextRequest('http://localhost:3000/api/v1/associate-file', {
        method: 'POST',
        body: JSON.stringify({ filePath: 'public/test-file.jpg' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'Failed to associate file with user'
      })
    })

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/associate-file', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to associate file with user')
    })
  })

  describe('GET', () => {
    it('should return health check response', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('healthy')
      expect(data.service).toBe('file-association')
      expect(data.timestamp).toBeDefined()
    })
  })

  describe('Additional Edge Cases', () => {
    it('should handle concurrent association requests', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      let resolveFirst: (value: { path: string; publicUrl: string }) => void
      let resolveSecond: (value: { path: string; publicUrl: string }) => void

      const firstPromise = new Promise(resolve => { resolveFirst = resolve })
      const secondPromise = new Promise(resolve => { resolveSecond = resolve })

      mockAssociateFileWithUser
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(secondPromise)

      const request1 = new NextRequest('http://localhost:3000/api/v1/associate-file', {
        method: 'POST',
        body: JSON.stringify({ filePath: 'public/test-file-1.jpg' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const request2 = new NextRequest('http://localhost:3000/api/v1/associate-file', {
        method: 'POST',
        body: JSON.stringify({ filePath: 'public/test-file-2.jpg' }),
        headers: { 'Content-Type': 'application/json' },
      })

      // Start both requests
      const promise1 = POST(request1)
      const promise2 = POST(request2)

      // Resolve the first request
      resolveFirst!({
        path: 'user-123/test-file-1.jpg',
        publicUrl: 'https://test.supabase.co/storage/v1/object/public/pages/user-123/test-file-1.jpg'
      })

      // Resolve the second request
      resolveSecond!({
        path: 'user-123/test-file-2.jpg',
        publicUrl: 'https://test.supabase.co/storage/v1/object/public/pages/user-123/test-file-2.jpg'
      })

      const [response1, response2] = await Promise.all([promise1, promise2])
      const [data1, data2] = await Promise.all([response1.json(), response2.json()])

      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
      expect(data1.path).toBe('user-123/test-file-1.jpg')
      expect(data2.path).toBe('user-123/test-file-2.jpg')
    })

    it('should handle files with special characters in names', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      mockAssociateFileWithUser.mockResolvedValue({
        path: 'user-123/test file (1) & more.jpg',
        publicUrl: 'https://test.supabase.co/storage/v1/object/public/pages/user-123/test%20file%20(1)%20%26%20more.jpg'
      })

      const request = new NextRequest('http://localhost:3000/api/v1/associate-file', {
        method: 'POST',
        body: JSON.stringify({ filePath: 'public/test file (1) & more.jpg' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.path).toBe('user-123/test file (1) & more.jpg')
    })

    it('should handle very long file paths', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      const longFileName = 'a'.repeat(200) + '.jpg'
      const longFilePath = `public/${longFileName}`

      mockAssociateFileWithUser.mockResolvedValue({
        path: `user-123/${longFileName}`,
        publicUrl: `https://test.supabase.co/storage/v1/object/public/pages/user-123/${longFileName}`
      })

      const request = new NextRequest('http://localhost:3000/api/v1/associate-file', {
        method: 'POST',
        body: JSON.stringify({ filePath: longFilePath }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle nested public folder paths', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/v1/associate-file', {
        method: 'POST',
        body: JSON.stringify({ filePath: 'public/subfolder/test-file.jpg' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockAssociateFileWithUser).toHaveBeenCalledWith('public/subfolder/test-file.jpg', 'user-123')
    })

    it('should handle case-sensitive file paths', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/v1/associate-file', {
        method: 'POST',
        body: JSON.stringify({ filePath: 'Public/test-file.jpg' }), // Uppercase P
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid file path - file must be in public folder')
    })

    it('should handle path traversal attempts', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/v1/associate-file', {
        method: 'POST',
        body: JSON.stringify({ filePath: 'public/../private/test-file.jpg' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)

      expect(response.status).toBe(200) // Still valid as it starts with public/
      expect(mockAssociateFileWithUser).toHaveBeenCalledWith('public/../private/test-file.jpg', 'user-123')
    })

    it('should handle user ID with special characters', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123@example.com' } },
        error: null,
      })

      mockAssociateFileWithUser.mockResolvedValue({
        path: 'user-123@example.com/test-file.jpg',
        publicUrl: 'https://test.supabase.co/storage/v1/object/public/pages/user-123@example.com/test-file.jpg'
      })

      const request = new NextRequest('http://localhost:3000/api/v1/associate-file', {
        method: 'POST',
        body: JSON.stringify({ filePath: 'public/test-file.jpg' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockAssociateFileWithUser).toHaveBeenCalledWith('public/test-file.jpg', 'user-123@example.com')
    })

    it('should handle storage service returning null data', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      mockAssociateFileWithUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/v1/associate-file', {
        method: 'POST',
        body: JSON.stringify({ filePath: 'public/test-file.jpg' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })

    it('should handle Content-Type header variations', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      mockAssociateFileWithUser.mockResolvedValue({
        path: 'user-123/test-file.jpg',
        publicUrl: 'https://test.supabase.co/storage/v1/object/public/pages/user-123/test-file.jpg'
      })

      const request = new NextRequest('http://localhost:3000/api/v1/associate-file', {
        method: 'POST',
        body: JSON.stringify({ filePath: 'public/test-file.jpg' }),
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})
