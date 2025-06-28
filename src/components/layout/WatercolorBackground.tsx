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
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Generate watercolor shapes with enhanced dreamy palette inspired by the reference
  const shapes = useMemo(() => {
    const colors = [
      'rgba(74, 144, 226, 0.35)',  // Vibrant Sky Blue (primary)
      'rgba(255, 107, 157, 0.3)',  // Warm Coral Pink (secondary)
      'rgba(126, 211, 33, 0.32)',  // Fresh Spring Green (highlight)
      'rgba(144, 19, 254, 0.28)',  // Dreamy Lavender Purple
      'rgba(245, 166, 35, 0.3)',   // Sunny Gold Yellow
      'rgba(100, 200, 150, 0.35)', // Soft mint green
      'rgba(255, 180, 120, 0.32)', // Warm peach
      'rgba(160, 220, 255, 0.3)',  // Light sky blue
    ]
    
    const generateShape = (id: number): WatercolorShape => {
      const baseX = Math.random() * 100
      const baseY = Math.random() * 100
      return {
        id,
        size: Math.random() * 500 + 250, // 250-750px (larger, more organic shapes)
        color: colors[Math.floor(Math.random() * colors.length)],
        x: baseX, // 0-100% viewport width
        y: baseY, // 0-100% viewport height
        duration: Math.random() * 50 + 40, // 40-90 seconds (slower, more dreamy)
        delay: Math.random() * 25, // 0-25 second delay
        opacity: Math.random() * 0.3 + 0.4, // 0.4-0.7 opacity (softer)
        mouseX: 0,
        mouseY: 0,
        baseX,
        baseY,
      }
    }
    
    return Array.from({ length: 12 }, (_, i) => generateShape(i)) // More shapes for richer effect
  }, [isClient])

  // Generate bokeh light effects
  const bokehLights = useMemo(() => {
    const generateBokeh = (id: number) => ({
      id,
      size: Math.random() * 15 + 5, // 5-20px
      x: Math.random() * 100,
      y: Math.random() * 100,
      opacity: Math.random() * 0.6 + 0.2, // 0.2-0.8
      duration: Math.random() * 8 + 6, // 6-14 seconds
      delay: Math.random() * 10,
    })
    
    return Array.from({ length: 25 }, (_, i) => generateBokeh(i))
  }, [isClient])

  if (!isClient) {
    return null
  }

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none overflow-hidden">
      {shapes.map((shape) => {
        return (
          <div
            key={shape.id}
            className="absolute watercolor-shape"
            style={{
              width: `${shape.size}px`,
              height: `${shape.size}px`,
              left: `${shape.x}%`,
              top: `${shape.y}%`,
              background: `radial-gradient(ellipse ${Math.random() * 20 + 40}% ${Math.random() * 20 + 40}% at ${Math.random() * 40 + 30}% ${Math.random() * 40 + 30}%, ${shape.color} 0%, ${shape.color.replace('0.', '0.0')} 50%, transparent 85%)`,
              borderRadius: `${Math.random() * 20 + 40}% ${Math.random() * 20 + 40}% ${Math.random() * 20 + 40}% ${Math.random() * 20 + 40}%`,
              filter: 'blur(3px)',
              opacity: shape.opacity,
              transform: 'translate(-50%, -50%)',
              animation: `watercolorFloat ${shape.duration}s infinite ease-in-out ${shape.delay}s`,
              pointerEvents: 'none',
            }}

          />
        )
      })}

      {/* Bokeh light effects inspired by the reference image */}
      {bokehLights.map((bokeh) => (
        <div
          key={`bokeh-${bokeh.id}`}
          className="absolute rounded-full bg-white"
          style={{
            width: `${bokeh.size}px`,
            height: `${bokeh.size}px`,
            left: `${bokeh.x}%`,
            top: `${bokeh.y}%`,
            opacity: bokeh.opacity,
            filter: 'blur(1px)',
            transform: 'translate(-50%, -50%)',
            animation: `bokehFloat ${bokeh.duration}s infinite ease-in-out ${bokeh.delay}s`,
            pointerEvents: 'none',
          }}
        />
      ))}
      
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
            transform: translate(-50%, -50%) translateY(-30px) rotate(3deg) scale(1.08);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-15px) rotate(-2deg) scale(0.92);
          }
          75% {
            transform: translate(-50%, -50%) translateY(-35px) rotate(2deg) scale(1.05);
          }
        }
        
        @keyframes bokehFloat {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: var(--opacity-start, 0.3);
          }
          25% {
            transform: translate(-50%, -50%) translateY(-10px) scale(1.2);
            opacity: calc(var(--opacity-start, 0.3) * 1.5);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-5px) scale(0.8);
            opacity: var(--opacity-start, 0.3);
          }
          75% {
            transform: translate(-50%, -50%) translateY(-12px) scale(1.1);
            opacity: calc(var(--opacity-start, 0.3) * 1.2);
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
