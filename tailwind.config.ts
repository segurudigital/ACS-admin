import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
      },
      colors: {
        navy: {
          deep: "#003366",
          medium: "#006699", 
          light: "#0099CC",
        },
        accent: {
          yellow: "#FFCC00",
          orange: "#F5821F",
        },
        neutral: {
          white: "#FFFFFF",
          light: "#F5F5F5",
          gray: "#666666",
        }
      },
    },
  },
  plugins: [],
} satisfies Config;