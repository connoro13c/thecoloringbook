'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface UrlInfo {
  fullUrl: string
  pathname: string
  search: string
  hash: string
  searchParams: Record<string, string>
  hashParams: Record<string, string>
}

export default function DebugAuth() {
  const [urlInfo, setUrlInfo] = useState<UrlInfo>({
    fullUrl: '',
    pathname: '',
    search: '',
    hash: '',
    searchParams: {},
    hashParams: {}
  })

  useEffect(() => {
    setUrlInfo({
      fullUrl: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      searchParams: Object.fromEntries(new URLSearchParams(window.location.search)),
      hashParams: Object.fromEntries(new URLSearchParams(window.location.hash.substring(1)))
    })
  }, [])

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Debug Auth URL</h1>
        <pre className="bg-white p-4 rounded-lg border overflow-auto text-sm">
          {JSON.stringify(urlInfo, null, 2)}
        </pre>
        <div className="mt-4">
          <Link href="/" className="text-blue-600 hover:underline">← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
