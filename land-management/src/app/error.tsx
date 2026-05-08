"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-theme text-theme p-8">
      <div className="max-w-lg text-center">
        <h1 className="text-3xl font-black mb-4">Something went wrong</h1>
        <p className="mb-6 text-theme-muted">{error.message}</p>
        <button
          onClick={reset}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-black transition-all"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
