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
        display: '1.0',
        tight: '1.1',
        body: '1.3',
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
    },
  },
  plugins: [],
}
