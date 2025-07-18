import type { Metadata } from 'next'
import './globals.css'
import '../styles/coloring-image.css'

export const metadata: Metadata = {
  title: 'The Coloring Book - Personalized AI Coloring Pages',
  description: 'Instantly create personalized, printable coloring pages from your child\'s photos with AI-powered generation.',
  icons: {
    icon: '/icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
