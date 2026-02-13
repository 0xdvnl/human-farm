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
        // New design colors
        'cream': '#F2EDE5',
        'cream-warm': '#EAE2D6',
        'beige': '#E5DDD1',
        'terra': '#A0614E',
        'terra-deep': '#8B4D3B',
        'terra-dark': '#6B3A2C',
        'dark': '#1E2A2A',
        'dark-deep': '#162222',
        'dark-surface': '#243333',
        'cyan': '#4EEADB',
        'gold': '#D4A843',
        // Legacy colors (for existing pages)
        'farm-orange': '#A0614E',
        'farm-dark': '#1E2A2A',
        'farm-gray': '#243333',
        'farm-light': '#F2EDE5',
      },
      fontFamily: {
        'mono': ['Space Mono', 'monospace'],
        'sans': ['DM Sans', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
