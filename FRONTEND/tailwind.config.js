/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  // 👇 ESTE PRESET ES CLAVE EN v4
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        gg: { teal: "#1FA3AF", tealLight: "#54C6D3", ink: "#0E2A2F" },
      },
      borderRadius: { xl2: "1.25rem" },
    },
  },
  plugins: [],
};
