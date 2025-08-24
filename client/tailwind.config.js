/** @type {import('tailwindcss').Config} */
module.exports = {
    experimental: {
    optimizeUniversalDefaults: true, // makes Tailwind use hex instead of oklch
  },
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
  extend: {
    colors: {
        // Override Tailwind's defaults with hex/rgb
        violet: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6', // 💡 hex instead of oklch()
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        pink: {
          50:  '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899', // 💡 hex instead of oklch()
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        slate: colors.slate, // keep safe ones
      },
  },
},
  corePlugins: {
    preflight: true,
  },
  future: {
    disableColorFunction: true, // Forces Tailwind to output hex instead of oklch
  },
   plugins: {
    'postcss-preset-env': {
      stage: 1,
      features: {
        'color-function': { unresolved: 'warn' }, // convert oklch() → rgb()
      },
    },
  },
};
