/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        runway: {
          black: '#000000',
          deep: '#030303',
          surface: '#1a1a1a',
          white: '#ffffff',
          nearWhite: '#fefefe',
          cloud: '#e9ecf2',
          borderDark: '#27272a',
          charcoal: '#404040',
          nearCharcoal: '#3f3f3f',
          coolSlate: '#767d88',
          midSlate: '#7d848e',
          mutedGray: '#a7a7a7',
          coolSilver: '#c9ccd1',
          lightSilver: '#d0d4d4',
          tailwindGray: '#6b7280',
          darkLink: '#0c0c0c',
          footerGray: '#999999',
          propellerBlue: '#3E59F3',
          propellerDark: '#0F1556',
        },
        cream: {
          50: '#faf8f5',
          100: '#f5f2ee',
          200: '#ebe6df',
          300: '#ddd5cb',
        },
        warm: {
          text: '#1a1a1a',
          muted: '#6b6560',
          light: '#9e9690',
          border: '#e2ddd6',
        },
        gradient: {
          start: '#e85d4a',
          end: '#8b5cf6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tighter: '-1.2px',
        tight: '-0.9px',
        label: '0.35px',
      },
      lineHeight: {
        display: '1.1',
        tight: '1.15',
        body: '1.6',
      },
      borderRadius: {
        sharp: '4px',
        subtle: '6px',
        comfortable: '8px',
        generous: '16px',
      },
      maxWidth: {
        'cinema': '1600px',
      },
      backgroundImage: {
        'gradient-headline': 'linear-gradient(135deg, #e85d4a 0%, #8b5cf6 100%)',
      },
    },
  },
  plugins: [],
}
