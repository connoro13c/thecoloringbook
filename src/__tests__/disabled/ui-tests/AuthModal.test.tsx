/**
 * Tests for AuthModal component and file association logic
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthModal } from '../AuthModal'

// Mock fetch
global.fetch = jest.fn()

// Mock window.location for redirect URL tests
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
    href: 'http://localhost:3000',
  },
  writable: true,
  configurable: true,
})

// Mock Supabase client
const mockSignInWithOAuth = jest.fn()
const mockOnAuthStateChange = jest.fn()
const mockUnsubscribe = jest.fn()

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithOAuth: mockSignInWithOAuth,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }),
}))

describe('AuthModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onAuthSuccess: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } }
    })
  })

  it('should render modal when isOpen is true', () => {
    render(<AuthModal {...defaultProps} />)
    
    expect(screen.getByText('Create account to download')).toBeInTheDocument()
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()
  })

  it('should not render modal when isOpen is false', () => {
    render(<AuthModal {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByText('Create account to download')).not.toBeInTheDocument()
  })

  it('should show different text when pendingFilePath is provided', () => {
    render(<AuthModal {...defaultProps} pendingFilePath="public/test-file.jpg" />)
    
    expect(screen.getByText('Save this coloring page')).toBeInTheDocument()
    expect(screen.getByText('Continue as guest')).toBeInTheDocument()
  })

  it('should handle Google sign-in', async () => {
    mockSignInWithOAuth.mockResolvedValue({ error: null })
    
    render(<AuthModal {...defaultProps} />)
    
    const signInButton = screen.getByText('Continue with Google')
    fireEvent.click(signInButton)
    
    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })
  })

  it('should show loading state during sign-in', async () => {
    mockSignInWithOAuth.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<AuthModal {...defaultProps} />)
    
    const signInButton = screen.getByText('Continue with Google')
    fireEvent.click(signInButton)
    
    expect(screen.getByText('Signing in...')).toBeInTheDocument()
  })

  it('should handle sign-in errors', async () => {
    mockSignInWithOAuth.mockResolvedValue({ 
      error: { message: 'Sign-in failed' } 
    })
    
    render(<AuthModal {...defaultProps} />)
    
    const signInButton = screen.getByText('Continue with Google')
    fireEvent.click(signInButton)
    
    await waitFor(() => {
      expect(screen.getByText('Sign-in failed')).toBeInTheDocument()
    })
  })

  it('should handle close button', () => {
    const mockOnClose = jest.fn()
    render(<AuthModal {...defaultProps} onClose={mockOnClose} />)
    
    const closeButton = screen.getByText('Maybe later')
    fireEvent.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  describe('Auth State Change with File Association', () => {
    it('should associate file when user signs in with pendingFilePath', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, path: 'user-123/test-file.jpg' })
      })
      global.fetch = mockFetch

      const mockOnAuthSuccess = jest.fn()
      const mockOnClose = jest.fn()

      render(
        <AuthModal 
          {...defaultProps} 
          pendingFilePath="public/test-file.jpg"
          onAuthSuccess={mockOnAuthSuccess}
          onClose={mockOnClose}
        />
      )

      // Simulate auth state change
      const authCallback = mockOnAuthStateChange.mock.calls[0][0]
      await authCallback('SIGNED_IN', { user: { id: 'user-123' } })

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/associate-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath: 'public/test-file.jpg' }),
      })

      await waitFor(() => {
        expect(mockOnAuthSuccess).toHaveBeenCalled()
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('should handle file association errors', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Association failed' })
      })
      global.fetch = mockFetch

      render(
        <AuthModal 
          {...defaultProps} 
          pendingFilePath="public/test-file.jpg"
        />
      )

      // Simulate auth state change
      const authCallback = mockOnAuthStateChange.mock.calls[0][0]
      await authCallback('SIGNED_IN', { user: { id: 'user-123' } })

      await waitFor(() => {
        expect(screen.getByText('Failed to save your coloring page. Please try again.')).toBeInTheDocument()
      })
    })

    it('should show associating state during file association', async () => {
      const mockFetch = jest.fn().mockImplementation(() => new Promise(() => {})) // Never resolves
      global.fetch = mockFetch

      render(
        <AuthModal 
          {...defaultProps} 
          pendingFilePath="public/test-file.jpg"
        />
      )

      // Simulate auth state change
      const authCallback = mockOnAuthStateChange.mock.calls[0][0]
      authCallback('SIGNED_IN', { user: { id: 'user-123' } })

      await waitFor(() => {
        expect(screen.getByText('Saving your page...')).toBeInTheDocument()
      })
    })

    it('should call onAuthSuccess without file association when no pendingFilePath', async () => {
      const mockOnAuthSuccess = jest.fn()
      const mockOnClose = jest.fn()

      render(
        <AuthModal 
          {...defaultProps}
          onAuthSuccess={mockOnAuthSuccess}
          onClose={mockOnClose}
        />
      )

      // Simulate auth state change
      const authCallback = mockOnAuthStateChange.mock.calls[0][0]
      await authCallback('SIGNED_IN', { user: { id: 'user-123' } })

      await waitFor(() => {
        expect(mockOnAuthSuccess).toHaveBeenCalled()
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('should unsubscribe from auth state changes on unmount', () => {
      const { unmount } = render(<AuthModal {...defaultProps} />)
      
      unmount()
      
      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle network errors during file association', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'))
      global.fetch = mockFetch

      render(
        <AuthModal 
          {...defaultProps} 
          pendingFilePath="public/test-file.jpg"
        />
      )

      // Simulate auth state change
      const authCallback = mockOnAuthStateChange.mock.calls[0][0]
      await authCallback('SIGNED_IN', { user: { id: 'user-123' } })

      await waitFor(() => {
        expect(screen.getByText('Failed to save your coloring page. Please try again.')).toBeInTheDocument()
      })
    })

    it('should disable buttons during file association', async () => {
      const mockFetch = jest.fn().mockImplementation(() => new Promise(() => {})) // Never resolves
      global.fetch = mockFetch

      render(
        <AuthModal 
          {...defaultProps} 
          pendingFilePath="public/test-file.jpg"
        />
      )

      // Simulate auth state change to trigger association
      const authCallback = mockOnAuthStateChange.mock.calls[0][0]
      authCallback('SIGNED_IN', { user: { id: 'user-123' } })

      await waitFor(() => {
        const googleButton = screen.getByRole('button', { name: /saving your page/i })
        const closeButton = screen.getByRole('button', { name: /continue as guest/i })
        
        expect(googleButton).toBeDisabled()
        expect(closeButton).toBeDisabled()
      })
    })

    it('should handle malformed API responses', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ malformed: 'response' }) // Missing required fields
      })
      global.fetch = mockFetch

      render(
        <AuthModal 
          {...defaultProps} 
          pendingFilePath="public/test-file.jpg"
        />
      )

      const authCallback = mockOnAuthStateChange.mock.calls[0][0]
      await authCallback('SIGNED_IN', { user: { id: 'user-123' } })

      // Should still complete the flow even with malformed response
      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalled()
      })
    })

    it('should handle invalid file paths', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid file path' })
      })
      global.fetch = mockFetch

      render(
        <AuthModal 
          {...defaultProps} 
          pendingFilePath="invalid/path/file.jpg"
        />
      )

      const authCallback = mockOnAuthStateChange.mock.calls[0][0]
      await authCallback('SIGNED_IN', { user: { id: 'user-123' } })

      await waitFor(() => {
        expect(screen.getByText('Failed to save your coloring page. Please try again.')).toBeInTheDocument()
      })
    })

    it('should handle concurrent auth state changes', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
      global.fetch = mockFetch

      render(
        <AuthModal 
          {...defaultProps} 
          pendingFilePath="public/test-file.jpg"
        />
      )

      const authCallback = mockOnAuthStateChange.mock.calls[0][0]
      
      // Trigger multiple rapid state changes
      authCallback('SIGNED_IN', { user: { id: 'user-123' } })
      authCallback('SIGNED_OUT', null)
      authCallback('SIGNED_IN', { user: { id: 'user-456' } })

      // Should only process the last valid sign-in
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
      })
    })

    it('should handle auth state changes when modal is closed', async () => {
      const mockFetch = jest.fn()
      global.fetch = mockFetch

      const { rerender } = render(
        <AuthModal 
          {...defaultProps} 
          pendingFilePath="public/test-file.jpg"
        />
      )

      // Close modal
      rerender(
        <AuthModal 
          {...defaultProps} 
          isOpen={false}
          pendingFilePath="public/test-file.jpg"
        />
      )

      const authCallback = mockOnAuthStateChange.mock.calls[0][0]
      await authCallback('SIGNED_IN', { user: { id: 'user-123' } })

      // Should not attempt file association when modal is closed
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle API timeout errors', async () => {
      const mockFetch = jest.fn().mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      )
      global.fetch = mockFetch

      render(
        <AuthModal 
          {...defaultProps} 
          pendingFilePath="public/test-file.jpg"
        />
      )

      const authCallback = mockOnAuthStateChange.mock.calls[0][0]
      await authCallback('SIGNED_IN', { user: { id: 'user-123' } })

      await waitFor(() => {
        expect(screen.getByText('Failed to save your coloring page. Please try again.')).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('should handle empty pendingFilePath edge case', async () => {
      const mockOnAuthSuccess = jest.fn()
      
      render(
        <AuthModal 
          {...defaultProps} 
          pendingFilePath=""
          onAuthSuccess={mockOnAuthSuccess}
        />
      )

      const authCallback = mockOnAuthStateChange.mock.calls[0][0]
      await authCallback('SIGNED_IN', { user: { id: 'user-123' } })

      // Should not attempt file association with empty path
      expect(global.fetch).not.toHaveBeenCalled()
      await waitFor(() => {
        expect(mockOnAuthSuccess).toHaveBeenCalled()
      })
    })

    it('should handle user object without ID', async () => {
      const mockFetch = jest.fn()
      global.fetch = mockFetch

      render(
        <AuthModal 
          {...defaultProps} 
          pendingFilePath="public/test-file.jpg"
        />
      )

      const authCallback = mockOnAuthStateChange.mock.calls[0][0]
      await authCallback('SIGNED_IN', { user: {} }) // User without ID

      // Should not attempt file association without user ID
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle sign-in with different OAuth providers', async () => {
      mockSignInWithOAuth.mockResolvedValue({ error: null })

      render(<AuthModal {...defaultProps} />)

      const signInButton = screen.getByText('Continue with Google')
      fireEvent.click(signInButton)

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: expect.objectContaining({
          redirectTo: 'http://localhost:3000/auth/callback'
        })
      })
    })

    it('should handle OAuth redirect errors', async () => {
      mockSignInWithOAuth.mockResolvedValue({ 
        error: { 
          message: 'OAuth redirect failed',
          status: 400
        } 
      })

      render(<AuthModal {...defaultProps} />)

      const signInButton = screen.getByText('Continue with Google')
      fireEvent.click(signInButton)

      await waitFor(() => {
        expect(screen.getByText('OAuth redirect failed')).toBeInTheDocument()
      })
    })
  })
})
