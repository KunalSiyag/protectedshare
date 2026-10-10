import type { Config } from "tailwindcss";

/** Channel-var color so opacity modifiers (`bg-ink/5`) keep working. */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: token("bg"),
        surface: {
          DEFAULT: token("surface"),
          2: token("surface-2"),
        },
        line: {
          DEFAULT: token("line"),
          strong: token("line-strong"),
        },
        ink: {
          DEFAULT: token("ink"),
          2: token("ink-2"),
          3: token("ink-3"),
        },
        "on-ink": token("on-ink"),
        seal: {
          DEFAULT: token("seal"),
          soft: "rgb(var(--seal) / var(--soft-a))",
        },
        ok: {
          DEFAULT: token("ok"),
          soft: "rgb(var(--ok) / var(--soft-a))",
        },
        warn: {
          DEFAULT: token("warn"),
          soft: "rgb(var(--warn) / var(--soft-a))",
        },
        danger: {
          DEFAULT: token("danger"),
          soft: "rgb(var(--danger) / var(--danger-soft-a))",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        meta: ["12px", { lineHeight: "16px" }],
        small: ["13px", { lineHeight: "18px" }],
        ui: ["15px", { lineHeight: "22px" }],
        prose: ["16px", { lineHeight: "26px" }],
        lead: ["18px", { lineHeight: "28px", letterSpacing: "-0.005em" }],
        h3: ["22px", { lineHeight: "28px", letterSpacing: "-0.02em", fontWeight: "600" }],
        h2: ["28px", { lineHeight: "34px", letterSpacing: "-0.03em", fontWeight: "600" }],
        h1: ["40px", { lineHeight: "44px", letterSpacing: "-0.035em", fontWeight: "600" }],
        hero: ["clamp(2.5rem, 5.5vw, 4.25rem)", { lineHeight: "1.02", letterSpacing: "-0.035em", fontWeight: "600" }],
      },
      borderRadius: {
        control: "8px",
        field: "10px",
        panel: "14px",
      },
      boxShadow: {
        float: "var(--shadow-float)",
        header: "var(--shadow-header)",
      },
      maxWidth: {
        content: "1180px",
      },
      height: {
        header: "60px",
      },
      transitionTimingFunction: {
        seal: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
