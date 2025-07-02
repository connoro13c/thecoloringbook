/**
 * Integration tests for authentication and file association flow
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { act } from '@testing-library/react'
import Page from '../page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

// Mock fetch for API calls
global.fetch = jest.fn()

// Mock useAnonymousFiles hook
const mockSaveAnonymousFile = jest.fn()
const mockGetLatestAnonymousFile = jest.fn()
const mockClearAnonymousFiles = jest.fn()

jest.mock('@/lib/hooks/useAnonymousFiles', () => ({
  useAnonymousFiles: () => ({
    anonymousFiles: [],
    saveAnonymousFile: mockSaveAnonymousFile,
    getLatestAnonymousFile: mockGetLatestAnonymousFile,
    clearAnonymousFiles: mockClearAnonymousFiles,
    removeAnonymousFile: jest.fn(),
    hasAnonymousFiles: false,
  }),
}))

// Mock Supabase client
const mockSignInWithOAuth = jest.fn()
const mockOnAuthStateChange = jest.fn()
const mockGetUser = jest.fn()
const mockUnsubscribe = jest.fn()

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithOAuth: mockSignInWithOAuth,
      onAuthStateChange: mockOnAuthStateChange,
      getUser: mockGetUser,
    },
  }),
}))

// Mock file upload component
jest.mock('@/components/forms/PhotoUpload', () => {
  return function PhotoUpload({ onUpload }: { onUpload: (file: File) => void }) {
    return (
      <div data-testid="photo-upload">
        <button
          onClick={() => {
            const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
            onUpload(mockFile)
          }}
        >
          Upload Photo
        </button>
      </div>
    )
  }
})

// Mock AI generation service
jest.mock('@/lib/services/generation-service', () => ({
  generateColoringPage: jest.fn(),
}))

import { generateColoringPage } from '@/lib/services/generation-service'

describe('Authentication and File Association Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } }
    })
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null
    })
  })

  describe('Anonymous User Flow', () => {
    it('should save file for anonymous user and show auth modal', async () => {
      // Mock successful generation
      generateColoringPage.mockResolvedValue({
        success: true,
        imageUrl: 'https://example.com/generated.jpg',
        path: 'public/generated-123.jpg'
      })

      mockSaveAnonymousFile.mockReturnValue({
        id: 'file-1',
        filePath: 'public/generated-123.jpg',
        imageUrl: 'https://example.com/generated.jpg',
        createdAt: '2023-01-01T00:00:00.000Z'
      })

      render(<Page />)

      // Upload a photo
      const uploadButton = screen.getByText('Upload Photo')
      fireEvent.click(uploadButton)

      // Fill in scene description
      const sceneInput = screen.getByPlaceholderText(/describe the magical scene/i)
      fireEvent.change(sceneInput, { target: { value: 'Flying on a unicorn' } })

      // Generate coloring page
      const generateButton = screen.getByText(/create.*coloring page/i)
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(generateColoringPage).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(mockSaveAnonymousFile).toHaveBeenCalledWith(
          'public/generated-123.jpg',
          'https://example.com/generated.jpg',
          expect.objectContaining({
            sceneDescription: 'Flying on a unicorn'
          })
        )
      })

      // Verify save button shows auth modal trigger
      const saveButton = screen.getByText(/save.*this.*page/i)
      expect(saveButton).toBeInTheDocument()
    })

    it('should handle generation errors gracefully', async () => {
      generateColoringPage.mockResolvedValue({
        success: false,
        error: 'Generation failed'
      })

      render(<Page />)

      const uploadButton = screen.getByText('Upload Photo')
      fireEvent.click(uploadButton)

      const sceneInput = screen.getByPlaceholderText(/describe the magical scene/i)
      fireEvent.change(sceneInput, { target: { value: 'Test scene' } })

      const generateButton = screen.getByText(/create.*coloring page/i)
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText(/generation failed/i)).toBeInTheDocument()
      })
    })
  })

  describe('Authenticated User Flow', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })
    })

    it('should save file directly for authenticated user', async () => {
      generateColoringPage.mockResolvedValue({
        success: true,
        imageUrl: 'https://example.com/generated.jpg',
        path: 'user-123/generated-123.jpg'
      })

      render(<Page />)

      const uploadButton = screen.getByText('Upload Photo')
      fireEvent.click(uploadButton)

      const sceneInput = screen.getByPlaceholderText(/describe the magical scene/i)
      fireEvent.change(sceneInput, { target: { value: 'Flying on a unicorn' } })

      const generateButton = screen.getByText(/create.*coloring page/i)
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(generateColoringPage).toHaveBeenCalled()
      })

      // Should not save to anonymous files for authenticated users
      expect(mockSaveAnonymousFile).not.toHaveBeenCalled()
    })
  })

  describe('File Association on Authentication', () => {
    it('should associate anonymous file when user signs in', async () => {
      // Mock API response for file association
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          path: 'user-123/test-file.jpg',
          publicUrl: 'https://example.com/user-123/test-file.jpg'
        })
      })

      // Mock latest anonymous file
      mockGetLatestAnonymousFile.mockReturnValue({
        id: 'file-1',
        filePath: 'public/test-file.jpg',
        imageUrl: 'https://example.com/test-file.jpg',
        createdAt: '2023-01-01T00:00:00.000Z'
      })

      render(<Page />)

      // Trigger auth modal with pending file
      const saveButton = screen.getByText(/save.*this.*page/i) // This would be shown after generation
      fireEvent.click(saveButton)

      // Mock auth state change
      const authCallback = mockOnAuthStateChange.mock.calls[0][0]
      await act(async () => {
        await authCallback('SIGNED_IN', { user: { id: 'user-123' } })
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/v1/associate-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ filePath: 'public/test-file.jpg' }),
        })
      })

      await waitFor(() => {
        expect(mockClearAnonymousFiles).toHaveBeenCalled()
      })
    })

    it('should handle file association errors', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Association failed' })
      })

      mockGetLatestAnonymousFile.mockReturnValue({
        id: 'file-1',
        filePath: 'public/test-file.jpg',
        imageUrl: 'https://example.com/test-file.jpg',
        createdAt: '2023-01-01T00:00:00.000Z'
      })

      render(<Page />)

      const saveButton = screen.getByText(/save.*this.*page/i)
      fireEvent.click(saveButton)

      const authCallback = mockOnAuthStateChange.mock.calls[0][0]
      await act(async () => {
        await authCallback('SIGNED_IN', { user: { id: 'user-123' } })
      })

      await waitFor(() => {
        expect(screen.getByText(/failed to save.*coloring page/i)).toBeInTheDocument()
      })

      // Should not clear files on error
      expect(mockClearAnonymousFiles).not.toHaveBeenCalled()
    })

    it('should handle network errors during file association', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      mockGetLatestAnonymousFile.mockReturnValue({
        id: 'file-1',
        filePath: 'public/test-file.jpg',
        imageUrl: 'https://example.com/test-file.jpg',
        createdAt: '2023-01-01T00:00:00.000Z'
      })

      render(<Page />)

      const saveButton = screen.getByText(/save.*this.*page/i)
      fireEvent.click(saveButton)

      const authCallback = mockOnAuthStateChange.mock.calls[0][0]
      await act(async () => {
        await authCallback('SIGNED_IN', { user: { id: 'user-123' } })
      })

      await waitFor(() => {
        expect(screen.getByText(/failed to save.*coloring page/i)).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing file during association', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'File not found' })
      })

      mockGetLatestAnonymousFile.mockReturnValue({
        id: 'file-1',
        filePath: 'public/non-existent.jpg',
        imageUrl: 'https://example.com/non-existent.jpg',
        createdAt: '2023-01-01T00:00:00.000Z'
      })

      render(<Page />)

      const saveButton = screen.getByText(/save.*this.*page/i)
      fireEvent.click(saveButton)

      const authCallback = mockOnAuthStateChange.mock.calls[0][0]
      await act(async () => {
        await authCallback('SIGNED_IN', { user: { id: 'user-123' } })
      })

      await waitFor(() => {
        expect(screen.getByText(/failed to save.*coloring page/i)).toBeInTheDocument()
      })
    })

    it('should handle authentication without pending files', async () => {
      mockGetLatestAnonymousFile.mockReturnValue(null)

      render(<Page />)

      // Trigger auth without pending file
      const signInButton = screen.getByText(/create account/i)
      fireEvent.click(signInButton)

      const authCallback = mockOnAuthStateChange.mock.calls[0][0]
      await act(async () => {
        await authCallback('SIGNED_IN', { user: { id: 'user-123' } })
      })

      // Should not attempt file association
      expect(global.fetch).not.toHaveBeenCalledWith('/api/v1/associate-file', expect.any(Object))
      expect(mockClearAnonymousFiles).not.toHaveBeenCalled()
    })

    it('should handle rapid auth state changes', async () => {
      mockGetLatestAnonymousFile.mockReturnValue({
        id: 'file-1',
        filePath: 'public/test-file.jpg',
        imageUrl: 'https://example.com/test-file.jpg',
        createdAt: '2023-01-01T00:00:00.000Z'
      })

      global.fetch = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        }), 100))
      )

      render(<Page />)

      const saveButton = screen.getByText(/save.*this.*page/i)
      fireEvent.click(saveButton)

      const authCallback = mockOnAuthStateChange.mock.calls[0][0]
      
      // Trigger multiple rapid auth changes
      await act(async () => {
        authCallback('SIGNED_IN', { user: { id: 'user-123' } })
        authCallback('SIGNED_OUT', null)
        authCallback('SIGNED_IN', { user: { id: 'user-456' } })
      })

      // Should handle gracefully without multiple API calls
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Storage Quota and Error Handling', () => {
    it('should handle localStorage storage quota errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      mockSaveAnonymousFile.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      generateColoringPage.mockResolvedValue({
        success: true,
        imageUrl: 'https://example.com/generated.jpg',
        path: 'public/generated-123.jpg'
      })

      render(<Page />)

      const uploadButton = screen.getByText('Upload Photo')
      fireEvent.click(uploadButton)

      const sceneInput = screen.getByPlaceholderText(/describe the magical scene/i)
      fireEvent.change(sceneInput, { target: { value: 'Test scene' } })

      const generateButton = screen.getByText(/create.*coloring page/i)
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(generateColoringPage).toHaveBeenCalled()
      })

      // Should show error message for storage issues
      await waitFor(() => {
        expect(screen.getByText(/unable to save.*locally/i)).toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })
  })
})
