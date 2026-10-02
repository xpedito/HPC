/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Paleta pensada para saúde: azul institucional + tons neutros
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
      },
      // Altura mínima de tap-target para uso com uma mão
      minHeight: {
        'tap': '3rem', // 48px
      },
    },
  },
  plugins: [
    // Normaliza inputs, selects e textareas com classe base Tailwind
    require('@tailwindcss/forms'),
  ],
}
