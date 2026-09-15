"use client";

interface PremiumCapsuleProps {
  description: string;
  price: string;
  subtext?: string;
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  loadingText?: string;
}

export default function PremiumCapsule({
  description,
  price,
  subtext,
  onClick,
  disabled,
  isLoading,
  loadingText,
}: PremiumCapsuleProps) {
  const content = (
    <>
      <span className="flex items-center gap-2 text-lg text-amber-700 sm:text-xl">
        <span aria-hidden>🔒</span>
        <span>{isLoading && loadingText ? loadingText : `${description} — ${price}`}</span>
      </span>
      {subtext && !isLoading && (
        <span className="text-sm text-amber-600/80">{subtext}</span>
      )}
    </>
  );

  const baseClassName =
    "flex w-full flex-col items-center justify-center gap-0.5 rounded-full border border-amber-400 bg-transparent px-5 py-3 text-center transition";

  if (!onClick) {
    return <div className={baseClassName}>{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseClassName} hover:border-amber-500 active:scale-95 disabled:opacity-50`}
    >
      {content}
    </button>
  );
}
