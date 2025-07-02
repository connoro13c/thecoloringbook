/**
 * Tests for useAnonymousFiles hook
 */
import { renderHook, act } from '@testing-library/react'
import { useAnonymousFiles } from '../useAnonymousFiles'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

// Mock crypto.randomUUID
let uuidCounter = 0
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => `test-uuid-${++uuidCounter}`),
  },
  writable: true,
})

describe('useAnonymousFiles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Clear console mocks
    jest.spyOn(console, 'error').mockImplementation(() => {})
    // Reset UUID counter
    uuidCounter = 0
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with empty array when no localStorage data', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useAnonymousFiles())

      expect(result.current.anonymousFiles).toEqual([])
      expect(result.current.hasAnonymousFiles).toBe(false)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('coloring-book-anonymous-files')
    })

    it('should load existing files from localStorage', () => {
      const storedFiles = [
        {
          id: 'file-1',
          filePath: 'public/test1.jpg',
          imageUrl: 'https://example.com/test1.jpg',
          createdAt: '2023-01-01T00:00:00.000Z',
          metadata: { sceneDescription: 'Test scene 1' }
        },
        {
          id: 'file-2',
          filePath: 'public/test2.jpg',
          imageUrl: 'https://example.com/test2.jpg',
          createdAt: '2023-01-02T00:00:00.000Z'
        }
      ]
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedFiles))

      const { result } = renderHook(() => useAnonymousFiles())

      expect(result.current.anonymousFiles).toEqual(storedFiles)
      expect(result.current.hasAnonymousFiles).toBe(true)
    })

    it('should handle localStorage parse errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockLocalStorage.getItem.mockReturnValue('invalid json')

      const { result } = renderHook(() => useAnonymousFiles())

      expect(result.current.anonymousFiles).toEqual([])
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load anonymous files from localStorage:', 
        expect.any(Error)
      )
    })
  })

  describe('saveAnonymousFile', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(null)
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2023-01-01T00:00:00.000Z')
    })

    it('should save new anonymous file', () => {
      const { result } = renderHook(() => useAnonymousFiles())

      act(() => {
        const savedFile = result.current.saveAnonymousFile(
          'public/test.jpg',
          'https://example.com/test.jpg',
          { sceneDescription: 'Test scene', style: 'cartoon', difficulty: 3 }
        )

        expect(savedFile).toEqual({
          id: expect.stringMatching(/^test-uuid-\d+$/),
          filePath: 'public/test.jpg',
          imageUrl: 'https://example.com/test.jpg',
          createdAt: '2023-01-01T00:00:00.000Z',
          metadata: { sceneDescription: 'Test scene', style: 'cartoon', difficulty: 3 }
        })
      })

      expect(result.current.anonymousFiles).toHaveLength(1)
      expect(result.current.hasAnonymousFiles).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'coloring-book-anonymous-files',
        expect.stringContaining('test-uuid-')
      )
    })

    it('should save new file without metadata', () => {
      const { result } = renderHook(() => useAnonymousFiles())

      act(() => {
        result.current.saveAnonymousFile('public/test.jpg', 'https://example.com/test.jpg')
      })

      expect(result.current.anonymousFiles[0]).toEqual({
        id: expect.stringMatching(/^test-uuid-\d+$/),
        filePath: 'public/test.jpg',
        imageUrl: 'https://example.com/test.jpg',
        createdAt: '2023-01-01T00:00:00.000Z'
      })
    })

    it('should prepend new files to existing list', () => {
      const existingFiles = [
        {
          id: 'file-1',
          filePath: 'public/old.jpg',
          imageUrl: 'https://example.com/old.jpg',
          createdAt: '2023-01-01T00:00:00.000Z'
        }
      ]
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingFiles))

      const { result } = renderHook(() => useAnonymousFiles())

      act(() => {
        result.current.saveAnonymousFile('public/new.jpg', 'https://example.com/new.jpg')
      })

      expect(result.current.anonymousFiles).toHaveLength(2)
      expect(result.current.anonymousFiles[0].filePath).toBe('public/new.jpg')
      expect(result.current.anonymousFiles[1].filePath).toBe('public/old.jpg')
    })

    it('should handle localStorage save errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const { result } = renderHook(() => useAnonymousFiles())

      act(() => {
        result.current.saveAnonymousFile('public/test.jpg', 'https://example.com/test.jpg')
      })

      expect(result.current.anonymousFiles).toHaveLength(1) // State still updates
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save anonymous file to localStorage:', 
        expect.any(Error)
      )
    })
  })

  describe('getLatestAnonymousFile', () => {
    it('should return the most recent file', () => {
      const files = [
        {
          id: 'file-2',
          filePath: 'public/new.jpg',
          imageUrl: 'https://example.com/new.jpg',
          createdAt: '2023-01-02T00:00:00.000Z'
        },
        {
          id: 'file-1',
          filePath: 'public/old.jpg',
          imageUrl: 'https://example.com/old.jpg',
          createdAt: '2023-01-01T00:00:00.000Z'
        }
      ]
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(files))

      const { result } = renderHook(() => useAnonymousFiles())

      expect(result.current.getLatestAnonymousFile()).toEqual(files[0])
    })

    it('should return null when no files exist', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useAnonymousFiles())

      expect(result.current.getLatestAnonymousFile()).toBeNull()
    })
  })

  describe('clearAnonymousFiles', () => {
    it('should clear all files and localStorage', () => {
      const files = [
        {
          id: 'file-1',
          filePath: 'public/test.jpg',
          imageUrl: 'https://example.com/test.jpg',
          createdAt: '2023-01-01T00:00:00.000Z'
        }
      ]
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(files))

      const { result } = renderHook(() => useAnonymousFiles())

      // Verify files are loaded
      expect(result.current.anonymousFiles).toHaveLength(1)

      act(() => {
        result.current.clearAnonymousFiles()
      })

      expect(result.current.anonymousFiles).toEqual([])
      expect(result.current.hasAnonymousFiles).toBe(false)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('coloring-book-anonymous-files')
    })

    it('should handle localStorage clear errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Failed to remove item')
      })

      const { result } = renderHook(() => useAnonymousFiles())

      act(() => {
        result.current.clearAnonymousFiles()
      })

      expect(result.current.anonymousFiles).toEqual([]) // State still clears
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to clear anonymous files from localStorage:', 
        expect.any(Error)
      )
    })
  })

  describe('removeAnonymousFile', () => {
    it('should remove specific file by id', () => {
      const files = [
        {
          id: 'file-1',
          filePath: 'public/test1.jpg',
          imageUrl: 'https://example.com/test1.jpg',
          createdAt: '2023-01-01T00:00:00.000Z'
        },
        {
          id: 'file-2',
          filePath: 'public/test2.jpg',
          imageUrl: 'https://example.com/test2.jpg',
          createdAt: '2023-01-02T00:00:00.000Z'
        }
      ]
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(files))

      const { result } = renderHook(() => useAnonymousFiles())

      act(() => {
        result.current.removeAnonymousFile('file-1')
      })

      expect(result.current.anonymousFiles).toHaveLength(1)
      expect(result.current.anonymousFiles[0].id).toBe('file-2')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'coloring-book-anonymous-files',
        expect.stringContaining('file-2')
      )
    })

    it('should handle non-existent file id gracefully', () => {
      const files = [
        {
          id: 'file-1',
          filePath: 'public/test1.jpg',
          imageUrl: 'https://example.com/test1.jpg',
          createdAt: '2023-01-01T00:00:00.000Z'
        }
      ]
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(files))

      const { result } = renderHook(() => useAnonymousFiles())

      act(() => {
        result.current.removeAnonymousFile('non-existent-id')
      })

      expect(result.current.anonymousFiles).toHaveLength(1) // No change
      expect(result.current.anonymousFiles[0].id).toBe('file-1')
    })

    it('should handle localStorage update errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      const files = [
        {
          id: 'file-1',
          filePath: 'public/test1.jpg',
          imageUrl: 'https://example.com/test1.jpg',
          createdAt: '2023-01-01T00:00:00.000Z'
        }
      ]
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(files))
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const { result } = renderHook(() => useAnonymousFiles())

      act(() => {
        result.current.removeAnonymousFile('file-1')
      })

      expect(result.current.anonymousFiles).toHaveLength(0) // State still updates
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to update anonymous files in localStorage:', 
        expect.any(Error)
      )
    })
  })

  describe('edge cases', () => {
    it('should handle localStorage being unavailable', () => {
      // Simulate localStorage being unavailable (e.g., private browsing)
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      })

      expect(() => {
        renderHook(() => useAnonymousFiles())
      }).not.toThrow()
    })

    it('should handle corrupted localStorage data', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockLocalStorage.getItem.mockReturnValue('{"incomplete": json')

      const { result } = renderHook(() => useAnonymousFiles())

      expect(result.current.anonymousFiles).toEqual([])
      expect(consoleSpy).toHaveBeenCalled()
    })

    it('should handle localStorage returning non-array data', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {})
      mockLocalStorage.getItem.mockReturnValue('{"not": "an array"}')

      const { result } = renderHook(() => useAnonymousFiles())

      // The hook should still work, just log the error
      expect(result.current.anonymousFiles).toEqual([])
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete file lifecycle', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2023-01-01T00:00:00.000Z')

      const { result } = renderHook(() => useAnonymousFiles())

      // Save first file
      act(() => {
        result.current.saveAnonymousFile(
          'public/file1.jpg',
          'https://example.com/file1.jpg',
          { sceneDescription: 'Scene 1' }
        )
      })

      // Save second file
      act(() => {
        result.current.saveAnonymousFile(
          'public/file2.jpg',
          'https://example.com/file2.jpg',
          { sceneDescription: 'Scene 2' }
        )
      })

      // Verify state
      expect(result.current.anonymousFiles).toHaveLength(2)
      expect(result.current.hasAnonymousFiles).toBe(true)
      expect(result.current.getLatestAnonymousFile()?.filePath).toBe('public/file2.jpg')

      // Remove first file (which is now second in array)
      act(() => {
        result.current.removeAnonymousFile(result.current.anonymousFiles[1].id)
      })

      expect(result.current.anonymousFiles).toHaveLength(1)
      expect(result.current.anonymousFiles[0].filePath).toBe('public/file2.jpg')

      // Clear all files
      act(() => {
        result.current.clearAnonymousFiles()
      })

      expect(result.current.anonymousFiles).toEqual([])
      expect(result.current.hasAnonymousFiles).toBe(false)
      expect(result.current.getLatestAnonymousFile()).toBeNull()
    })
  })
})
