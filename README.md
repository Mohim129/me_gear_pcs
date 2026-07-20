# ME Gear PCs

A modern Next.js 16 application for an online PC store with user authentication, product browsing, cart/checkout, wishlist, and admin customer management.

## Features

- Next.js 16 (Turbopack) frontend
- Better Auth integration for login, registration, password changes, and sessions
- MongoDB backend for products, users, orders, reviews, and wishlist
- React Query data fetching on client-side pages
- Tailwind CSS v4 styling
- Admin dashboard components for customer and order management
- Product and category seed script in `src/scripts/seed.ts`

## Getting Started

1. Create or copy the environment file:

```bash
cp .env.example .env
```

2. Add your MongoDB URI and auth settings in `.env`:

```dotenv
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
AUTH_DB_NAME=
MONGO_DB_URI=
NEXT_PUBLIC_BASE_URL=
NEXT_PUBLIC_IMAGE_UPLOAD_API=
GOOGLE_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GEMINI_API_KEY=
```

3. Install dependencies:

```bash
npm install
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm run dev` - start development server
- `npm run build` - build production app
- `npm run start` - start production server
- `npm run lint` - run ESLint
- `npm run seed` - seed the database with initial data

## Project Structure

- `src/app/` - Next.js app routes and pages
- `src/components/` - UI components and layout
- `src/lib/` - authentication, database, and utility helpers
- `src/scripts/` - seed script for database initialization
- `src/store/` - Zustand stores for cart and wishlist state

## Notes

- The app uses MongoDB ObjectId values for database documents.
- `Better Auth` is configured via environment variables and expects a running auth service.
- If `npm run build` fails due to Node heap issues, increase `NODE_OPTIONS=--max-old-space-size=4096` before building.

## License

This project is provided as-is for learning and development.
