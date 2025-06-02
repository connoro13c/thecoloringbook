'use client'

import React, { useMemo, useEffect, useState, useRef } from 'react'

interface WatercolorShape {
  id: number
  size: number
  color: string
  x: number
  y: number
  duration: number
  delay: number
  opacity: number
  mouseX: number
  mouseY: number
  baseX: number
  baseY: number
}

export const WatercolorBackground: React.FC = () => {
  const [isClient, setIsClient] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Track mouse movement for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Generate watercolor shapes with refined palette
  const shapes = useMemo(() => {
    const colors = [
      'rgba(91, 106, 191, 0.3)',   // Soft Indigo (primary) - much more visible
      'rgba(217, 137, 148, 0.25)', // Muted Rose (secondary) - much more visible
      'rgba(127, 190, 190, 0.28)', // Gentle Aqua (highlight) - much more visible
      'rgba(147, 125, 194, 0.22)', // Pale lavender - much more visible
      'rgba(134, 168, 131, 0.26)', // Soft green - much more visible
      'rgba(188, 143, 143, 0.24)', // Dusty rose - much more visible
    ]
    
    const generateShape = (id: number): WatercolorShape => {
      const baseX = Math.random() * 100
      const baseY = Math.random() * 100
      return {
        id,
        size: Math.random() * 400 + 200, // 200-600px (bigger shapes)
        color: colors[Math.floor(Math.random() * colors.length)],
        x: baseX, // 0-100% viewport width
        y: baseY, // 0-100% viewport height
        duration: Math.random() * 40 + 30, // 30-70 seconds
        delay: Math.random() * 20, // 0-20 second delay
        opacity: Math.random() * 0.4 + 0.6, // 0.6-1.0 opacity (very visible for testing)
        mouseX: 0,
        mouseY: 0,
        baseX,
        baseY,
      }
    }
    
    return Array.from({ length: 8 }, (_, i) => generateShape(i))
  }, [isClient])

  if (!isClient) {
    return null
  }

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none overflow-hidden">
      {shapes.map((shape) => {
        // Calculate mouse influence on shape position
        const mouseInfluence = 0.02 // How much mouse affects position
        const mouseOffsetX = (mousePos.x - window.innerWidth / 2) * mouseInfluence
        const mouseOffsetY = (mousePos.y - window.innerHeight / 2) * mouseInfluence
        
        return (
          <div
            key={shape.id}
            className="absolute watercolor-shape transition-all duration-1000 ease-out"
            style={{
              width: `${shape.size}px`,
              height: `${shape.size}px`,
              left: `calc(${shape.x}% + ${mouseOffsetX}px)`,
              top: `calc(${shape.y}% + ${mouseOffsetY}px)`,
              background: `radial-gradient(ellipse at center, ${shape.color} 0%, transparent 70%)`,
              borderRadius: '50%',
              filter: 'blur(2px)',
              opacity: shape.opacity,
              transform: 'translate(-50%, -50%)',
              animation: `watercolorFloat ${shape.duration}s infinite ease-in-out ${shape.delay}s`,
              pointerEvents: 'none',
            }}

          />
        )
      })}
      
      {/* Subtle paper texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, #404040 1px, transparent 1px),
            radial-gradient(circle at 75% 75%, #404040 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px',
        }}
      />
      
      <style jsx global>{`
        @keyframes watercolorFloat {
          0%, 100% {
            transform: translate(-50%, -50%) translateY(0px) rotate(0deg) scale(1);
          }
          25% {
            transform: translate(-50%, -50%) translateY(-20px) rotate(2deg) scale(1.05);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-10px) rotate(-1deg) scale(0.95);
          }
          75% {
            transform: translate(-50%, -50%) translateY(-25px) rotate(1deg) scale(1.02);
          }
        }
        
        .watercolor-shape {
          will-change: transform, opacity;
        }
        
        .watercolor-shape::before {
          content: '';
          position: absolute;
          inset: 10%;
          background: inherit;
          border-radius: inherit;
          filter: blur(4px);
          opacity: 0.6;
        }
        
        .watercolor-shape::after {
          content: '';
          position: absolute;
          inset: 20%;
          background: inherit;
          border-radius: inherit;
          filter: blur(1px);
          opacity: 0.8;
        }
      `}</style>
    </div>
  )
}
