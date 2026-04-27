import sharedConfig from "../packages/ui/tailwind.config.js";

/** @type {import('tailwindcss').Config} */
export default {
  ...sharedConfig,
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "../packages/ui/src/**/*.{js,jsx,ts,tsx}",
  ],
};
