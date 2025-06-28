import React from 'react'

// Image/Photo Icon - based on the "View full size image" from your reference
export const ImageIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect 
      x="6" y="8" width="36" height="28" rx="3" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
    />
    <rect 
      x="8" y="10" width="32" height="24" rx="2" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeDasharray="2,2"
      fill="none"
    />
    <circle 
      cx="34" cy="18" r="3" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      fill="none"
    />
    <path 
      d="m8 28 8-8 4 4 8-8 8 6" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
)

// Upload/Download Icon - based on the "Download" from your reference
export const UploadIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M24 32V16" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round"
    />
    <path 
      d="m16 24 8-8 8 8" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
    />
    <path 
      d="M8 34h32" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round"
    />
    <path 
      d="M12 38h24" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
  </svg>
)

// Classic Cartoon Icon - simple smiling face like in reference
export const ClassicCartoonIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle 
      cx="24" cy="24" r="18" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="18" cy="20" r="1.5" fill="currentColor"/>
    <circle cx="30" cy="20" r="1.5" fill="currentColor"/>
    <path 
      d="M16 30c2 3 6 4 8 4s6-1 8-4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
      fill="none"
    />
  </svg>
)

// Ghibli Style Icon - Totoro character like in reference
export const GhibliIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Main body */}
    <path 
      d="M24 8c-7 0-12 5-12 12v10c0 3 3 6 6 6h12c3 0 6-3 6-6V20c0-7-5-12-12-12z" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
      fill="none"
    />
    {/* Ears */}
    <path 
      d="M16 8c0-3 2-5 4-5M28 8c0-3 2-5 4-5" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    {/* Eyes */}
    <circle cx="19" cy="18" r="1.5" fill="currentColor"/>
    <circle cx="29" cy="18" r="1.5" fill="currentColor"/>
    {/* Nose/mouth area */}
    <path 
      d="M22 24h4" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
    <path 
      d="M24 24v2" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
    {/* Whiskers */}
    <path 
      d="M12 20h4M32 20h4M12 24h4M32 24h4" 
      stroke="currentColor" 
      strokeWidth="1" 
      strokeLinecap="round"
    />
  </svg>
)

// Mandala Pattern Icon - based on the mandala flower from your reference
export const MandalaIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle 
      cx="24" cy="24" r="18" 
      stroke="currentColor" 
      strokeWidth="2" 
      fill="none"
    />
    <circle 
      cx="24" cy="24" r="12" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      fill="none"
    />
    <circle 
      cx="24" cy="24" r="6" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      fill="none"
    />
    <path 
      d="M24 6a6 6 0 0 1 0 12M42 24a6 6 0 0 1-12 0M24 42a6 6 0 0 1 0-12M6 24a6 6 0 0 1 12 0" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
      fill="none"
    />
    <path 
      d="M35.3 12.7a4 4 0 0 1-5.6 5.6M35.3 35.3a4 4 0 0 1-5.6-5.6M12.7 35.3a4 4 0 0 1 5.6-5.6M12.7 12.7a4 4 0 0 1 5.6 5.6" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
      fill="none"
    />
  </svg>
)

// Refresh/Create Another Icon - based on the circular arrow from your reference
export const RefreshIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M40 24c0 8.8-7.2 16-16 16s-16-7.2-16-16 7.2-16 16-16c4 0 7.6 1.5 10.4 4" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round"
      fill="none"
    />
    <path 
      d="m32 8 2.4 4L40 14" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
)

// Magic Wand/Generate Icon - for the generate button
export const MagicWandIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M12 36L36 12" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round"
    />
    <path 
      d="M36 8v8M32 12h8" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <circle cx="12" cy="36" r="2" fill="currentColor"/>
    <path 
      d="M8 8v4M6 10h4M20 4v4M18 6h4M42 28v4M40 30h4" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
    <path 
      d="M16 20l2 2-2 2-2-2z" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
)
