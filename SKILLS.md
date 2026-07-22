# Reusable UI Patterns (MEG PCs)

## 1. Skeleton Loader
```tsx
export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-white shadow-sm p-4">
      <div className="h-48 bg-gray-200 rounded-xl mb-4" />
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
      <div className="h-8 bg-gray-200 rounded w-full" />
    </div>
  );
}
```

## 2. Empty State
```tsx
import { type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon className="w-16 h-16 text-gray-300 mb-4" />}
      <h3 className="text-lg font-semibold text-gray-600">{title}</h3>
      <p className="text-sm text-gray-400 mt-1">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

## 3. Toast Usage
```ts
import { toast } from 'sonner';

toast.success('Item added to cart');
toast.error('Failed to load products');
```

## 4. Protected Page Wrapper
```tsx
'use client';
import { useSession } from 'better-auth/react';
import { redirect } from 'next/navigation';

export default function ProtectedPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <ProductCardSkeleton />; // or a full page skeleton
  if (!session) {
    redirect('/login');
  }

  return <div>Protected content</div>;
}
```

## 5. Admin Route Check (middleware.ts)
```ts
import { NextResponse } from 'next/server';
import { getSession } from 'better-auth';

export async function middleware(request: Request) {
  const session = await getSession(request);
  const url = new URL(request.url);

  if (url.pathname.startsWith('/admin')) {
    if (!session || session.user.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

## 6. Pagination Component
```tsx
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-3 py-1 rounded-lg border disabled:opacity-50"
      >
        Previous
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 rounded-lg ${
            page === currentPage ? 'bg-copper text-white' : 'border'
          }`}
        >
          {page}
        </button>
      ))}
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-3 py-1 rounded-lg border disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
```

## 7. Image Component Usage (imgbb + Next/Image)
```tsx
import Image from 'next/image';

// In component:
<Image
  src="https://i.ibb.co.com/xyz/image.jpg"
  alt="Description"
  width={400}
  height={300}
  className="rounded-xl object-cover"
/>
// Or with fill:
<div className="relative w-full h-64">
  <Image src="..." alt="..." fill className="object-cover rounded-xl" />
</div>
```
