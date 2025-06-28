'use client'

import { Button } from '@/components/ui/button'

export function Hero() {
  const handleCreatePage = () => {
    // Scroll to upload section when implemented
    const uploadSection = document.getElementById('upload-section')
    if (uploadSection) {
      uploadSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Enhanced Watercolor Background matching inspiration */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-ivory via-accent-aqua/15 to-primary-indigo/25">
        {/* Multiple layered watercolor gradients for depth */}
        <div 
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 80% 60% at 20% 30%, rgba(74, 144, 226, 0.4) 0%, transparent 60%),
              radial-gradient(ellipse 70% 50% at 80% 20%, rgba(255, 107, 157, 0.35) 0%, transparent 55%),
              radial-gradient(ellipse 90% 70% at 30% 80%, rgba(126, 211, 33, 0.3) 0%, transparent 65%),
              radial-gradient(ellipse 65% 45% at 70% 70%, rgba(144, 19, 254, 0.25) 0%, transparent 50%),
              radial-gradient(ellipse 75% 55% at 10% 60%, rgba(245, 166, 35, 0.3) 0%, transparent 55%)
            `,
          }}
        />
        
        {/* Organic watercolor blends */}
        <div 
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 60% 40% at 60% 40%, rgba(100, 200, 150, 0.4) 0%, transparent 70%),
              radial-gradient(ellipse 50% 30% at 40% 60%, rgba(255, 180, 120, 0.35) 0%, transparent 60%),
              radial-gradient(ellipse 40% 60% at 80% 80%, rgba(160, 220, 255, 0.3) 0%, transparent 65%)
            `,
          }}
        />
        
        {/* Soft paper texture */}
        <div 
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23404040' fill-opacity='0.08'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 className="font-playfair text-5xl md:text-6xl lg:text-7xl font-bold text-neutral-slate mb-6 leading-tight">
          Bring Your Kids&apos; 
          <span className="block text-primary-indigo">Adventures to Life!</span>
        </h1>
        
        <p className="font-lato text-xl md:text-2xl text-neutral-slate/80 mb-8 max-w-2xl mx-auto leading-relaxed">
          Instantly create personalized, printable black and white coloring pages with your child&apos;s photos.
        </p>

        <Button 
          onClick={handleCreatePage}
          size="lg"
          className="
            bg-primary-indigo hover:bg-primary-indigo/90 
            text-white font-playfair font-semibold text-lg
            px-8 py-6 rounded-xl
            shadow-lg hover:shadow-xl
            transform hover:scale-105 transition-all duration-300
            border-2 border-primary-indigo/20
          "
        >
          Create Your Coloring Page
        </Button>


      </div>
    </section>
  )
}
