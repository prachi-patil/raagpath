import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // RaagPath brand palette
        saffron: '#FF6B35',
        raga:    '#2D1B69',
        gold:    '#F5A623',
      },
    },
  },
  plugins: [],
}

export default config
