// ShareButton — presentational button wrapping useShare. Renders "Share"
// normally and flashes "Copied!" (announced politely) after the clipboard
// fallback runs. Styled to match the aqua Save/Directions buttons.

import { useShare } from '../../hooks/useShare'

interface ShareButtonProps {
  title: string
  text?: string
  url: string
  className?: string
  label?: string
}

export default function ShareButton({
  title,
  text,
  url,
  className,
  label = 'Share',
}: ShareButtonProps) {
  const { share, justCopied } = useShare()

  // Size/padding is left to callers (via className) so the button can mirror
  // either the compact card row or the larger detail-page action row.
  const base =
    'inline-flex items-center justify-center gap-1 text-xs font-medium py-1.5 px-3 rounded-lg border border-aqua-300 text-aqua-700 hover:bg-aqua-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-aqua-500 transition-colors dark:border-slate-600 dark:text-aqua-300 dark:hover:bg-slate-700'

  return (
    <button
      type="button"
      onClick={() => {
        void share({ title, text, url })
      }}
      aria-label={label}
      className={className ? `${base} ${className}` : base}
    >
      <span aria-hidden="true">🔗</span>
      <span aria-live="polite">{justCopied ? 'Copied!' : label}</span>
    </button>
  )
}
