export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={`grid h-7 w-7 shrink-0 place-items-center rounded-[9px] bg-gradient-to-b from-violet-500 to-violet-700 text-white shadow-sm ${
        className ?? ""
      }`}
    >
      <svg viewBox="0 0 180 180" className="h-[15px] w-[15px]" fill="currentColor" aria-hidden="true">
        <path d="M101.141 53H136.632C151.023 53 162.689 64.6662 162.689 79.0573V112.904H148.112V79.0573C148.112 78.7105 148.098 78.3662 148.072 78.0251L112.581 112.898C112.701 112.902 112.821 112.904 112.941 112.904H148.112V126.672H112.941C98.5504 126.672 86.5638 114.891 86.5638 100.5V66.7434H101.141V100.5C101.141 101.15 101.191 101.792 101.289 102.422L137.56 66.7816C137.255 66.7563 136.945 66.7434 136.632 66.7434H101.141V53Z" />
        <path d="M65.2926 124.136L14 66.7372H34.6355L64.7495 100.436V66.7372H80.1365V118.47C80.1365 126.278 70.4953 129.958 65.2926 124.136Z" />
      </svg>
    </span>
  )
}

export function BrandLogo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <BrandMark />
      <span className="text-[16px] font-semibold tracking-[-0.01em]">
        turbo<span className="text-violet-600 dark:text-violet-400">chat</span>
      </span>
    </span>
  )
}
