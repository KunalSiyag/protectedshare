import nextPlugin from "@next/eslint-plugin-next";
import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    plugins: {
      "@next/next": nextPlugin
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules
    }
  }
];

