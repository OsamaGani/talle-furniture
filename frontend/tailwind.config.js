/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    // 'xs' = 480 px — sits between Tailwind's default mobile (none) and
    // the built-in `sm` (640 px). Useful when an element needs to behave
    // differently on tiny phones (≤375 px iPhone SE) vs. mid-range
    // phones (≥414 px iPhone 14 Pro / Android XL).
    screens: {
      xs: '480px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        primary: {
          50: '#fff5f5',
          100: '#ffe0e0',
          500: '#e53935',
          600: '#d32f2f',
          700: '#b71c1c',
        },
        accent: '#ffd54f',
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
