/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        urgency: {
          low: '#10b981', // green
          medium: '#f59e0b', // amber
          high: '#ef4444', // red
          critical: '#dc2626', // dark red
        },
      },
      animation: {
        'blob': 'blob 7s infinite',
        'shake': 'shake 0.5s',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

