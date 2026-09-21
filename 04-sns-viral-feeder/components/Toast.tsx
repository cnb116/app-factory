"use client";

interface ToastProps {
  message: string | null;
}

export default function Toast({ message }: ToastProps) {
  if (!message) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[70] flex justify-center px-4">
      <div className="rounded-full bg-black px-5 py-3 text-sm font-bold text-yellow-400 shadow-2xl">
        {message}
      </div>
    </div>
  );
}
