import React from 'react';

interface ReturnHomeButtonProps {
  onReturn: () => void;
  disabled?: boolean;
}

export const ReturnHomeButton: React.FC<ReturnHomeButtonProps> = ({ onReturn }) => {
  return (
    <button
      type="button"
      onClick={onReturn}
      aria-label="Volver a la pantalla principal"
      className="fixed top-3 left-3 sm:top-4 sm:left-4 z-50 inline-flex items-center gap-2 min-h-[42px] px-4 py-2 sm:px-5 sm:py-2.5 bg-black/85 hover:bg-neutral-900 active:scale-95 text-white border border-white/25 hover:border-white/50 rounded-full font-sans text-xs sm:text-sm font-bold tracking-wider uppercase backdrop-blur-md shadow-2xl transition-all cursor-pointer select-none"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
      >
        <path d="M19 12H5" />
        <path d="M12 19l-7-7 7-7" />
      </svg>
      <span>VOLVER AL INICIO</span>
    </button>
  );
};
