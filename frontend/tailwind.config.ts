import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        artesanoDark: {
          bg: "#140E0C",
          surface: "#1E1614",
          card: "#261D1A",
          hover: "#322723",
          border: "#44342E",
          input: "#2A201C",
          text: "#F7EFE2",
          muted: "#B8A394",
        },
        borgona: {
          DEFAULT: "#8E2A45",
          dark: "#6F1F36",
          light: "#A83E5B",
        },
        dorado: {
          DEFAULT: "#C9A24D",
          light: "#DFBE73",
          dark: "#9E7B2F",
        },
        rosa: {
          pastel: "#E9B9BE",
          soft: "#F5DCDF",
        },
        kraft: {
          DEFAULT: "#D9C3A0",
          light: "#EADDC7",
        },
        crema: {
          DEFAULT: "#FBF4E8",
          dark: "#F4E5CC",
        },
        marfil: "#FFFCF7",
        chocolate: {
          DEFAULT: "#4A2C2A",
          dark: "#331E1D",
        },
        cacao: "#6B544C",
        estado: {
          exito: "#5F7A4F",
          aviso: "#D4912F",
          error: "#B3261E",
        },
      },
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "serif"],
        sans: ["Lato", "Helvetica", "Arial", "sans-serif"],
      },
      borderRadius: {
        artesanal: "12px",
      },
    },
  },
  plugins: [],
};

export default config;

