/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cefide: {
          bg: '#0a0a0a',
          surface: '#141414',
          border: '#2a2a2a',
          text: '#f0f0f0',
          muted: '#888888',
          accent: '#c8f000',
          'accent-alt': '#e63946',
          warning: '#f4a261',
          success: '#57cc99',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
