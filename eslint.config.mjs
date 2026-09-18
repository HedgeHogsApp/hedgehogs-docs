import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import nextPlugin from "@next/eslint-plugin-next";
import reactHooksPlugin from "eslint-plugin-react-hooks";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // TypeScript support via FlatCompat
  ...compat.config({
    extends: ["plugin:@typescript-eslint/recommended"],
    parser: "@typescript-eslint/parser",
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  }),
  // React hooks — classic rules only (v7 recommended adds strict Compiler rules)
  {
    plugins: {
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  // Next.js plugin (native flat config)
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@next/next/no-html-link-for-pages": "warn",
    },
  },
  // Override strict TS rules for React frontend patterns
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-this-alias": "warn",
      "@typescript-eslint/no-require-imports": "warn",
    },
  },
  // ─── Design system enforcement ───────────────────────────────────
  // Bans arbitrary Tailwind values (`bg-[#abc]`, `text-[14px]`, etc.).
  // Tokens live in `docs/design-system/tokens.md` and `tailwind.config.ts`.
  // New patterns get an ADR. See docs/design-system/decisions/.
  //
  // Currently `warn` (not `error`) because the existing codebase has
  // many call-sites that need migrating. Bump to `error` after the
  // first wave of components has been ported (Phase 2 / 3).
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector:
            "Literal[value=/(?:^|\\s)(?:bg|text|border|fill|stroke|w|h|min-w|min-h|max-w|max-h|p|pl|pr|pt|pb|px|py|m|ml|mr|mt|mb|mx|my|gap|space-x|space-y|top|left|right|bottom|inset|rounded|leading|tracking|opacity|z|order|grid-cols|grid-rows|col-span|row-span|translate-x|translate-y|scale|rotate|skew|origin|font|shadow|blur|backdrop-blur|aspect|duration|delay|ease)-\\[/]",
          message:
            "Arbitrary Tailwind value forbidden — use a token from docs/design-system/tokens.md instead.",
        },
        {
          selector:
            "TemplateElement[value.raw=/(?:^|\\s)(?:bg|text|border|fill|stroke|w|h|min-w|min-h|max-w|max-h|p|pl|pr|pt|pb|px|py|m|ml|mr|mt|mb|mx|my|gap|space-x|space-y|top|left|right|bottom|inset|rounded|leading|tracking|opacity|z|order|grid-cols|grid-rows|col-span|row-span|translate-x|translate-y|scale|rotate|skew|origin|font|shadow|blur|backdrop-blur|aspect|duration|delay|ease)-\\[/]",
          message:
            "Arbitrary Tailwind value forbidden — use a token from docs/design-system/tokens.md instead.",
        },
      ],
    },
  },
  {
    // Documentation, ESLint config itself, and Tailwind config can
    // mention arbitrary-value patterns for explanatory purposes.
    files: [
      "tailwind.config.ts",
      "eslint.config.mjs",
      "docs/**/*",
      "scripts/**/*",
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  // Ignore patterns
  {
    ignores: [
      "node_modules/",
      ".next/",
      "out/",
      "public/",
      "coverage/",
      "e2e/",
      "playwright-report/",
      "playwright/",
      "test-results/",
    ],
  },
];

export default eslintConfig;
