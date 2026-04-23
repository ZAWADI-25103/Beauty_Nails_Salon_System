# Beauty Nails - Required Dependencies

Add these dependencies to your `package.json`:

## Installation Commands

```bash
# Install TanStack Query (React Query)
npm install @tanstack/react-query @tanstack/react-query-devtools

# Install Axios
npm install axios

# These should already be installed, but verify:
npm install react-router-dom
npm install sonner
```

## Dependencies to Add

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.17.19",
    "axios": "^1.6.5",
    "react-router-dom": "^6.21.1",
    "sonner": "2.0.3"
  },
  "devDependencies": {
    "@tanstack/react-query-devtools": "^5.17.19"
  }
}
```

## Verify Installation

After installing, verify everything is working:

```bash
# Check if packages are installed
npm list @tanstack/react-query
npm list axios

# Start development server
npm run dev
```

## Environment Setup

Create a `.env` file in the root:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

For production:

```env
NEXT_PUBLIC_API_URL=https://api.beautynails.cd/api
```

## Full package.json Example

```json
{
  "name": "beauty-nails-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.1",
    "@tanstack/react-query": "^5.17.19",
    "axios": "^1.6.5",
    "sonner": "2.0.3",
    "lucide-react": "latest",
    "date-fns": "latest",
    "recharts": "latest"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@tanstack/react-query-devtools": "^5.17.19",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "postcss": "^8.4.32",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
```

## TypeScript Configuration

Make sure your `tsconfig.json` includes path aliases:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## Vite Configuration

Ensure your `vite.config.ts` has path resolution:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

---

## Ready to Use!

After installing dependencies and setting up environment variables, your frontend is ready to connect to the Next.js API backend! 🚀
