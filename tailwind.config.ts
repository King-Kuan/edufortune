import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // EduFortune brand
        brand: {
          blue: {
            50:  '#e8f1fd',
            100: '#c5d9fa',
            200: '#9bbdf6',
            300: '#6a9ef1',
            400: '#3d82ec',
            500: '#1565e0',   // primary brand blue
            600: '#1254c0',
            700: '#0e4299',
            800: '#0a3177',
            900: '#071f56',
          },
          orange: {
            50:  '#fff3e0',
            100: '#ffe0b2',
            200: '#ffcc80',
            300: '#ffb74d',
            400: '#ffa726',
            500: '#f57c00',   // primary brand orange
            600: '#e65100',
            700: '#bf360c',
            800: '#8d2a08',
            900: '#5c1a05',
          },
        },
        // Dark theme surface palette
        surface: {
          950: '#080c10',   // deepest bg
          900: '#0d1117',   // main bg
          800: '#161b22',   // card bg
          700: '#21262d',   // elevated card
          600: '#30363d',   // border / subtle
          500: '#484f58',   // muted text
          400: '#6e7681',   // placeholder
          300: '#8b949e',   // secondary text
          200: '#b1bac4',   // primary text muted
          100: '#cdd9e5',   // primary text
          50:  '#e6edf3',   // heading text
        },
        // Status colors
        status: {
          optimal:      '#238636',
          optimalBg:    '#0d2e18',
          belowOptimal: '#d29922',
          belowBg:      '#2d2000',
          crowded:      '#da3633',
          crowdedBg:    '#2d0f0e',
        },
      },
      fontFamily: {
        sans:    ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-geist-mono)', 'monospace'],
        display: ['var(--font-plus-jakarta)', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        card:  '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)',
        modal: '0 8px 32px rgba(0,0,0,0.6)',
        glow:  '0 0 20px rgba(21,101,224,0.3)',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.25s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
