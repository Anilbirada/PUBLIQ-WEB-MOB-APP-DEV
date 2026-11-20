/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // PUBLIQ Luxury Dark & Antique Gold Design System
        primary: '#070B12',       // Primary background (Obsidian Midnight)
        secondary: '#0F1626',     // Elevated card background (Midnight Navy)
        accent: '#D4AF37',        // Primary accent (Antique Gold)
        heading: '#FDFBF7',       // Headings (Warm Ivory / Alabaster)
        body: '#9DA3AE',          // Body text (Editorial Muted Slate)

        // PUBLIQ Brand Tokens
        publiq: {
          dark: '#070B12',
          navy: '#0A111F',
          charcoal: '#121826',
          surface: '#1A2234',
          border: 'rgba(212, 175, 55, 0.2)',
          'border-light': 'rgba(255, 255, 255, 0.08)',
          gold: '#D4AF37',
          champagne: '#E5C378',
          bronze: '#A37B34',
          amber: '#F59E0B',
          ivory: '#FDFBF7',
          cream: '#EDE8DC',
          muted: '#9DA3AE',
        },

        // Semantic aliases
        ivory: '#FDFBF7',
        cream: '#EDE8DC',
        gold: {
          light: '#E5C378',
          DEFAULT: '#D4AF37',
          dark: '#A37B34',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Cormorant Garamond', 'Georgia', 'serif'],
        playfair: ['Playfair Display', 'Cormorant Garamond', 'Georgia', 'serif'],
        cinzel: ['Cinzel', 'Playfair Display', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        inter: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'luxury-soft': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 2px 6px -1px rgba(212, 175, 55, 0.05)',
        'luxury-card': '0 12px 32px -4px rgba(0, 0, 0, 0.7), 0 0 1px 1px rgba(212, 175, 55, 0.15)',
        'luxury-elevated': '0 24px 48px -12px rgba(0, 0, 0, 0.85), 0 0 2px 1px rgba(212, 175, 55, 0.25)',
        'gold-glow': '0 0 24px -2px rgba(212, 175, 55, 0.35)',
        'gold-glow-lg': '0 0 40px -4px rgba(212, 175, 55, 0.45)',
      },
    },
  },
  plugins: [],
};
