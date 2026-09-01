import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
                mono: ["var(--font-fira-code)", "monospace"],
            },
            colors: {
                ctp: {
                    base: "#1e1e2e",
                    mantle: "#181825",
                    crust: "#11111b",
                    text: "#cdd6f4",
                    subtext1: "#bac2de",
                    subtext0: "#a6adc8",
                    overlay1: "#7f849c",
                    overlay0: "#6c7086",
                    surface2: "#585b70",
                    surface1: "#45475a",
                    surface0: "#313244",
                    green: "#a6e3a1",
                    mauve: "#cba6f7",
                    red: "#f38ba8",
                },
            },
        },
    },
    plugins: [],
};

export default config;
