<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project‑Wide Rules (MEG PCs Store)

## Brand
- **Name:** MEG PCs
- **Logo Font:** Use a bold, tech‑oriented display font (e.g., 'Russo One', 'Audiowide', or 'Orbitron' from Google Fonts). The logo text is "MEG PCS" or "MEG PCs" – always uppercase, with a distinct style (gradient, glowing effect, or sharp letters).

## Tech Stack
- **Framework:** Next.js 14 (App Router), TypeScript
- **Styling:** Tailwind CSS, no CSS modules
- **State & Data:** TanStack Query (server state), Zustand (client‑state cart)
- **Auth:** Better Auth (MongoDB adapter) – roles: "user", "admin"
- **Database:** MongoDB with Mongoose ODM
- **AI:** Google Gemini API (via `@google/generative-ai`)
- **Toasts:** Sonner (`toast.success()`, `toast.error()`)
- **Charts:** Recharts (admin dashboard)
- **Icons:** lucide‑react (preferred)
- **Image Hosting:** All product and user‑uploaded images are stored on **imgbb.com**. Use Next.js `<Image>` component for rendering, with appropriate `src`, `width`, `height`, and `alt`. Use the imgbb direct URLs.

## Design Tokens
- **Primary Colors:** Slate‑Gray `#2C3E50`, Rust‑Copper `#D35400`, Warm‑Cream `#FDFBF7`
- **Neutrals:** White cards, dark text (`#1a1a1a`)
- **Fonts:** Headings – Montserrat, Body – Inter, Logo – 'Russo One' (or similar)
- **Border Radius:** All cards/containers use `rounded-2xl`
- **Card Shadows:** `shadow-sm hover:shadow-md transition-shadow`
- **Buttons:** Rounded, hover states, copper for primary actions, slate for secondary

## Core Rules (DO / DON’T)
- ✅ DO fetch all data from the database via API routes. Never use hardcoded/dummy data.
- ✅ DO handle three states for every data‑driven component: **Loading (skeleton)**, **Empty (friendly message)**, **Error (toast + retry)**
- ✅ DO show a Sonner toast for all user actions (signup, login, cart add/remove, checkout, review submit, etc.)
- ✅ DO use TanStack Query for all GET requests, with meaningful query keys.
- ✅ DO keep cart state in Zustand (persisted to localStorage).
- ✅ DO protect admin routes (`/admin/*`) with middleware checking `role === "admin"`.
- ✅ DO use TypeScript interfaces for all props, API responses, and models.
- ✅ DO use Next.js `<Image>` for all images, specifying width/height or `fill` with container.
- ❌ DON’T use `any` type.
- ❌ DON’T use lorem ipsum or placeholder images (except the hero images provided below; for other sections you may use placeholder image services only temporarily, but replace with real ones later).
- ❌ DON’T create additional color classes outside the defined tokens.
- ❌ DON’T use page‑specific CSS files; rely on Tailwind utilities.

## Provided Assets
- Hero images (for now):
  - `https://i.ibb.co.com/5gL7TzWJ/meg-PCs-hero1.jpg`
  - `https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png`
- If other images are needed, the agent should indicate what kind of image (e.g., "motherboard product shot") and the user will supply an imgbb URL.

## File Structure
- `app/` – pages (App Router)
- `app/api/` – API routes
- `components/` – shared UI components
- `lib/` – auth config, db connection, utils
- `models/` – Mongoose models
- `store/` – Zustand stores
- `types/` – TypeScript interfaces

## API Convention
- Return JSON, use proper HTTP status codes.
- Use `NextResponse` for API routes.
- Validate inputs and return descriptive error messages.