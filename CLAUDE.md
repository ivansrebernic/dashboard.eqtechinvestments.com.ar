# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15.3.4 application bootstrapped with create-next-app, using the App Router architecture. The project is configured with TypeScript, Tailwind CSS v4, and ESLint for development tooling.

## Development Commands

- `npm run dev` - Start development server with Turbopack (opens at http://localhost:3000)
- `npm run build` - Build production application
- `npm start` - Start production server
- `npm run lint` - Run ESLint checks

## Architecture

### Tech Stack
- **Framework**: Next.js 15.3.4 with App Router
- **Language**: TypeScript with strict mode enabled
- **Styling**: Tailwind CSS v4 with PostCSS
- **UI Components**: shadcn/ui with "new-york" style and neutral base color
- **Icons**: Lucide React
- **Backend/Auth**: Supabase with authentication and SSR support
- **Fonts**: Geist Sans and Geist Mono (from Google Fonts)
- **Runtime**: React 19

### Project Structure
- `src/app/` - App Router pages and layouts
  - `layout.tsx` - Root layout with font configuration and metadata
  - `page.tsx` - Homepage component
  - `globals.css` - Global styles, Tailwind imports, and shadcn/ui CSS variables
- `src/lib/` - Utility functions
  - `utils.ts` - shadcn/ui utility function (cn) for merging classes
- `src/components/` - React components (shadcn/ui components will be installed here)
  - `ui/` - shadcn/ui components directory
- `public/` - Static assets (Next.js logo, Vercel logo, icons)
- Configuration files at root level

### Key Configuration
- **TypeScript**: Strict mode with path aliases (`@/*` maps to `./src/*`)
- **Next.js**: Clean default configuration with Turbopack for development
- **ESLint**: Using Next.js core-web-vitals and TypeScript presets
- **Tailwind**: PostCSS plugin configuration for v4

### shadcn/ui Configuration
- **Style**: "new-york" variant
- **Base Color**: Neutral
- **Icons**: Lucide React
- **Components Path**: `@/components/ui`
- **Utils Path**: `@/lib/utils`
- **CSS Variables**: Enabled for theming

### Supabase Configuration
- **Client**: @supabase/supabase-js for database and auth operations
- **SSR**: @supabase/ssr for server-side rendering support with Next.js App Router
- **Environment Variables**: Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Development Notes
- Uses Geist font family with CSS variables for consistent typography
- Configured for both light and dark mode styling with OKLCH color space
- All components use TypeScript with proper type definitions
- ESLint configured for Next.js best practices and TypeScript support
- Use `npx shadcn@latest add [component-name]` to install UI components
- The `cn()` utility function combines clsx and tailwind-merge for conditional classes
- Supabase client should be configured for both client and server-side usage with App Router