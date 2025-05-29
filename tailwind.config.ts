import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design system colors from DesignSpec.md
        'primary-indigo': '#5B6ABF',  // Soft Indigo
        'secondary-rose': '#D98994',  // Muted Rose
        'accent-aqua': '#7FBEBE',     // Gentle Aqua
        'neutral-ivory': '#FCF8F3',   // Warm Ivory
        'neutral-slate': '#404040',   // Rich Slate
      },
      fontFamily: {
        'playfair': ['Playfair Display', 'serif'],
        'lato': ['Lato', 'sans-serif'],
      },
      backgroundImage: {
        'watercolor-gradient': 'linear-gradient(135deg, #FCF8F3 0%, #7FBEBE 50%, #5B6ABF 100%)',
      },
    },
  },
  plugins: [],
}

export default config
