/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        yuval: {
          bg: 'var(--yuval-bg)',
          'bg-secondary': 'var(--yuval-bg-secondary)',
          surface: 'var(--yuval-surface)',
          text: 'var(--yuval-text)',
          'text-secondary': 'var(--yuval-text-secondary)',
          'text-tertiary': 'var(--yuval-text-tertiary)',
          'text-muted': 'var(--yuval-text-muted)',
          border: 'var(--yuval-border)',
          'border-secondary': 'var(--yuval-border-secondary)',
          link: 'var(--yuval-link)',
          'link-hover': 'var(--yuval-link-hover)',
          accent: 'var(--yuval-accent)',
          'accent-hover': 'var(--yuval-accent-hover)',
          'accent-text': 'var(--yuval-accent-text)',
          highlight: 'var(--yuval-highlight)',
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
