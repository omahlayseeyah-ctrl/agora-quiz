import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        agora: {
          blue: "#2F8FE0",
          lightblue: "#EAF4FD",
          skyblue: "#5BB4F0",
          dark: "#0B1B2B",
          black: "#111418",
          green: "#1EA672",
          greendark: "#158157",
          red: "#E4483B",
          reddark: "#B8362B",
        },
      },
      fontFamily: {
        poppins: ["var(--font-poppins)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
        nunito: ["var(--font-nunito)", "sans-serif"],
        roboto: ["var(--font-roboto)", "sans-serif"],
        lenard: ["var(--font-lenard)", "serif"],
      },
      boxShadow: {
        card: "0 4px 24px rgba(47,143,224,0.12)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
