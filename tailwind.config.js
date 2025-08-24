/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Pastel peach/cream palette
        peach: {
          50: '#FFF5EB',
          100: '#FFEBD6',
          200: '#FFD6AD',
          300: '#FFC285',
          400: '#FFAD5C',
          500: '#FF9933',
        },
        cream: {
          50: '#FFFDF7',
          100: '#FFF9ED',
          200: '#FFF2DB',
          300: '#FFEBC9',
        },
        sage: {
          50: '#F3F6F3',
          100: '#E7EDE7',
          200: '#CFD9CF',
          300: '#B7C6B7',
          400: '#9FAF9F',
        },
        blush: {
          50: '#FFF0F0',
          100: '#FFE0E0',
          200: '#FFC2C2',
          300: '#FFA3A3',
          400: '#FF8585',
        },
        charcoal: {
          50: '#F7F7F7',
          100: '#E5E5E5',
          200: '#CCCCCC',
          300: '#B3B3B3',
          400: '#999999',
          500: '#808080',
          600: '#666666',
          700: '#4D4D4D',
          800: '#333333',
          900: '#1A1A1A',
        },
      },
    },
  },
  plugins: [],
}
