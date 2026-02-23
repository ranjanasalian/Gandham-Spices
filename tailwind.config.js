/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        terracotta: "#b45309",
        saffron: "#d97706",
        charcoal: "#0f172a",
        sand: "#fef3c7",
      },
      fontFamily: {
        display: ['"Playfair Display"', "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        monarda: ['"Monarda"', "serif"],
        cuba: ['"Playwrite Cuba"', "serif"],
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-in-up": "fadeInUp 0.8s ease forwards",
        float: "float 12s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
