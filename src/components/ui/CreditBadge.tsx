'use client'

import { useCredits } from '@/lib/hooks/useCredits'
import { Button } from '@/components/ui/button'

interface CreditBadgeProps {
  onDonateClick?: () => void
  className?: string
}

export function CreditBadge({ onDonateClick, className = '' }: CreditBadgeProps) {
  const { credits, loading } = useCredits()

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-8 h-8 bg-neutral-ivory/50 rounded-full animate-pulse" />
        <div className="w-16 h-4 bg-neutral-ivory/50 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Credit Circle */}
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-indigo to-secondary-rose flex items-center justify-center shadow-lg">
          <div className="w-8 h-8 rounded-full bg-neutral-ivory flex items-center justify-center">
            <span className="text-sm font-bold text-primary-indigo">{credits}</span>
          </div>
        </div>
        
        {/* Progress ring for credits */}
        <svg className="absolute inset-0 w-10 h-10 -rotate-90" viewBox="0 0 36 36">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="rgba(91, 106, 191, 0.2)"
            strokeWidth="2"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#5B6ABF"
            strokeWidth="2"
            strokeDasharray={`${Math.min(credits * 10, 100)}, 100`}
          />
        </svg>
      </div>

      {/* Credit Info */}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-neutral-slate">
          {credits} credit{credits !== 1 ? 's' : ''}
        </span>
        {credits === 0 && (
          <Button
            onClick={onDonateClick}
            variant="ghost"
            size="sm"
            className="text-xs text-primary-indigo hover:text-primary-indigo/80 p-0 h-auto font-normal"
          >
            Get more credits
          </Button>
        )}
      </div>
    </div>
  )
}
