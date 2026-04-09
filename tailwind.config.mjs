/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        yuval: {
          bg: '#f5f0e8',
          'bg-secondary': '#ede8df',
          text: '#1a1a1a',
          'text-secondary': '#666666',
          'text-tertiary': '#888888',
          'text-muted': '#bbbbbb',
          border: '#f0ede8',
          'border-secondary': '#e0ddd8',
        },
      },
      fontFamily: {
        heading: ["'Frank Ruhl Libre'", 'Georgia', 'serif'],
        body: ["'Heebo'", 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        reading: '900px',
      },
      letterSpacing: {
        label: '0.12em',
        brand: '0.02em',
      },
    },
  },
  plugins: [],
};
