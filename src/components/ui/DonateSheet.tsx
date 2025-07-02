'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

interface DonateSheetProps {
  isOpen: boolean
  onClose: () => void
}

const PRESET_AMOUNTS = [
  { amount: 5, credits: 20, label: 'Supporter pack', popular: false },
  { amount: 10, credits: 40, label: 'Popular choice', popular: true },
  { amount: 25, credits: 100, label: 'Patron pack', popular: false }
]

export function DonateSheet({ isOpen, onClose }: DonateSheetProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleDonate = async (amount: number) => {
    setLoading(true)
    try {
      // Placeholder for donation logic
      console.log('Donating:', amount)
      onClose() // Close the sheet after successful donation
    } catch (error) {
      console.error('Donation failed:', error)
      setLoading(false)
    }
  }

  const customCredits = Math.floor(parseFloat(customAmount || '0') / 0.25)

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-neutral-ivory rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-slate/10">
          <div>
            <h2 className="font-playfair text-xl font-bold text-neutral-slate">
              Support our mission
            </h2>
            <p className="text-sm text-neutral-slate/70 mt-1">
              All proceeds go to Stanford Children&apos;s Hospital
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Preset Amounts */}
          <div className="space-y-3">
            <h3 className="font-medium text-neutral-slate">Choose an amount:</h3>
            {PRESET_AMOUNTS.map(({ amount, credits, label, popular }) => (
              <div
                key={amount}
                onClick={() => setSelectedAmount(amount)}
                className={`
                  relative p-4 rounded-xl cursor-pointer transition-all duration-200 border-2
                  ${selectedAmount === amount
                    ? 'border-primary-indigo bg-primary-indigo/5'
                    : 'border-neutral-slate/10 hover:border-primary-indigo/30'
                  }
                  ${popular ? 'ring-2 ring-secondary-rose/30' : ''}
                `}
              >
                {popular && (
                  <div className="absolute -top-2 left-4 bg-secondary-rose text-white text-xs px-2 py-1 rounded-full font-medium">
                    Most popular
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-neutral-slate">${amount}</div>
                    <div className="text-sm text-neutral-slate/70">{label}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary-indigo">{credits} credits</div>
                    <div className="text-xs text-neutral-slate/70">
                      ${(amount / credits).toFixed(2)} per image
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="space-y-3">
            <h3 className="font-medium text-neutral-slate">Or enter custom amount:</h3>
            <div className="space-y-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-slate/70">$</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="pl-8"
                  min="0.25"
                  step="0.25"
                />
              </div>
              {customAmount && parseFloat(customAmount) >= 0.25 && (
                <p className="text-sm text-neutral-slate/70">
                  = {customCredits} credit{customCredits !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          {/* Impact Message */}
          <div className="bg-accent-aqua/10 rounded-lg p-4 border border-accent-aqua/20">
            <p className="text-sm text-neutral-slate/80">
              💖 Your donation helps provide coloring therapy and creative activities 
              for children at Stanford Children&apos;s Hospital.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const amount = selectedAmount || parseFloat(customAmount || '0')
                if (amount >= 0.25) {
                  handleDonate(amount)
                }
              }}
              disabled={
                loading || 
                (!selectedAmount && (!customAmount || parseFloat(customAmount) < 0.25))
              }
              className="flex-1 bg-primary-indigo hover:bg-primary-indigo/90"
            >
              {loading ? 'Processing...' : 'Donate & get credits'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
