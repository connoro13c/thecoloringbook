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
      {/* Watercolor Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-ivory via-accent-aqua/20 to-primary-indigo/30">
        {/* Watercolor texture overlay */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              radial-gradient(circle at 25% 25%, rgba(123, 190, 190, 0.4) 0%, transparent 50%),
              radial-gradient(circle at 75% 25%, rgba(217, 137, 148, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 25% 75%, rgba(91, 106, 191, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, rgba(123, 190, 190, 0.2) 0%, transparent 50%)
            `,
          }}
        />
        
        {/* Soft paper texture */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23404040' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
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
          Instantly create personalized, printable coloring pages from your child&apos;s photos.
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

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-4 h-4 bg-secondary-rose/60 rounded-full blur-sm animate-pulse" />
        <div className="absolute top-40 right-16 w-6 h-6 bg-accent-aqua/60 rounded-full blur-sm animate-pulse delay-300" />
        <div className="absolute bottom-32 left-20 w-3 h-3 bg-primary-indigo/60 rounded-full blur-sm animate-pulse delay-700" />
        <div className="absolute bottom-20 right-10 w-5 h-5 bg-secondary-rose/40 rounded-full blur-sm animate-pulse delay-1000" />
      </div>
    </section>
  )
}
