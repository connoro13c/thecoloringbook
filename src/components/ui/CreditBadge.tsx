'use client'

import { useCredits } from '@/lib/hooks/useCredits'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

interface CreditBadgeProps {
  onDonateClick?: () => void
  className?: string
}

export function CreditBadge({ onDonateClick, className = '' }: CreditBadgeProps) {
  const { credits, loading } = useCredits()

  if (loading) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm ${className}`}>
        <div className="w-4 h-4 bg-neutral-ivory/50 rounded-full animate-pulse" />
        <div className="w-12 h-3 bg-neutral-ivory/50 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg border border-white/50 transition-all hover:shadow-xl hover:bg-white/95 ${className}`}>
      {/* Sparkle Icon */}
      <Sparkles className="w-4 h-4 text-primary-indigo" />
      
      {/* Credit Count */}
      <span className="text-sm font-semibold text-neutral-slate tracking-wide">
        {credits}
      </span>
      
      {/* CTA for zero credits */}
      {credits === 0 && (
        <Button
          onClick={onDonateClick}
          variant="ghost"
          size="sm"
          className="text-xs text-primary-indigo hover:text-primary-indigo/80 px-2 py-1 h-auto font-medium ml-1"
        >
          Get more
        </Button>
      )}
    </div>
  )
}
