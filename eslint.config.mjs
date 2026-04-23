// eslint.config.js
export default [
  {
    // GLOBAL IGNORE: Must be in its own object with no other keys
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "**/dist/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/prisma/generated/**",
    ],
  },
  {
    // RULES: Downgrade or disable common false positives
    rules: {
      "no-unused-vars": "warn", // Change 'error' to 'warn'
      "no-unused-expressions": "warn",
      "no-console": "off", // Allow console.log during debug
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "off", // Common false positive with apostrophes
      "@next/next/no-img-element": "warn", // Next.js often errors on <img>
    },
  },
];
