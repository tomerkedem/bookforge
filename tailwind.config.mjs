/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["'Frank Ruhl Libre'", 'serif'],
        body: ["'Heebo'", 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        reading: '68ch',
      },
    },
  },
  // Tailwind v3 RTL support is built-in via rtl: and ltr: variants
  // enabled automatically when dir="rtl" is on an ancestor element
  plugins: [],
};
