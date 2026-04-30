import js from "@eslint/js";
import tseslint from "typescript-eslint";
import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      "semi": ["error", "always"],
      "quotes": ["error", "double"],
      "no-unused-vars": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "no-undef": "off",
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "dist/**"],
  }
);
