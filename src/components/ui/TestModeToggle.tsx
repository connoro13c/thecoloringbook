'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function TestModeToggle() {
  const [isTestMode, setIsTestMode] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Check if test mode is enabled in localStorage
    const testMode = localStorage.getItem('test-mode') === 'true'
    setIsTestMode(testMode)
  }, [])

  const toggleTestMode = () => {
    const newTestMode = !isTestMode
    setIsTestMode(newTestMode)
    localStorage.setItem('test-mode', newTestMode.toString())
    
    // Force page reload to pick up the new test mode setting
    window.location.reload()
  }

  // Don't render on server or in production
  if (!isClient || process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      {isTestMode && (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
          TEST MODE
        </Badge>
      )}
      <Button
        onClick={toggleTestMode}
        variant={isTestMode ? "destructive" : "outline"}
        size="sm"
        className="text-xs"
      >
        {isTestMode ? 'Disable' : 'Enable'} Test Mode
      </Button>
    </div>
  )
}
