import { useState, useEffect, useCallback } from 'react'

interface AnonymousFile {
  id: string
  filePath: string
  imageUrl: string
  createdAt: string
  metadata?: {
    sceneDescription?: string
    style?: string
    difficulty?: number
  }
}

const STORAGE_KEY = 'coloring-book-anonymous-files'

/**
 * Hook for managing anonymous user file paths in localStorage
 */
export function useAnonymousFiles() {
  const [anonymousFiles, setAnonymousFiles] = useState<AnonymousFile[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const files = JSON.parse(stored)
        setAnonymousFiles(files)
      }
    } catch (error) {
      console.error('Failed to load anonymous files from localStorage:', error)
    }
  }, [])

  // Save a new anonymous file
  const saveAnonymousFile = useCallback((
    filePath: string, 
    imageUrl: string,
    metadata?: AnonymousFile['metadata']
  ) => {
    const newFile: AnonymousFile = {
      id: crypto.randomUUID(),
      filePath,
      imageUrl,
      createdAt: new Date().toISOString(),
      metadata
    }

    setAnonymousFiles(prev => {
      const updated = [newFile, ...prev]
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (error) {
        console.error('Failed to save anonymous file to localStorage:', error)
      }
      return updated
    })

    return newFile
  }, [])

  // Get the most recent anonymous file
  const getLatestAnonymousFile = useCallback(() => {
    return anonymousFiles[0] || null
  }, [anonymousFiles])

  // Clear anonymous files (called after successful auth and association)
  const clearAnonymousFiles = useCallback(() => {
    setAnonymousFiles([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear anonymous files from localStorage:', error)
    }
  }, [])

  // Remove a specific file
  const removeAnonymousFile = useCallback((id: string) => {
    setAnonymousFiles(prev => {
      const updated = prev.filter(file => file.id !== id)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (error) {
        console.error('Failed to update anonymous files in localStorage:', error)
      }
      return updated
    })
  }, [])

  return {
    anonymousFiles,
    saveAnonymousFile,
    getLatestAnonymousFile,
    clearAnonymousFiles,
    removeAnonymousFile,
    hasAnonymousFiles: anonymousFiles.length > 0
  }
}
