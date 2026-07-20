import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-rust-copper/10 text-rust-copper mb-6">
        <span className="text-3xl font-black">404</span>
      </div>
      <h1 className="text-4xl font-bold text-slate-900 dark:text-zinc-100 mb-3">Page Not Found</h1>
      <p className="max-w-xl text-sm text-slate-500 dark:text-zinc-400 mb-8">
        The page you are looking for does not exist or has been moved. Please check the URL or return to the homepage.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-full bg-rust-copper px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rust-copper/20 hover:bg-rust-copper/90 transition-colors"
      >
        Go to Homepage
      </Link>
    </div>
  );
}
