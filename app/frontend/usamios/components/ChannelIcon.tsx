/** Icon of a contact channel. Line icons follow the text colour (one CSS class each: the CSP forbids inline styles); Énois uses its own favicon. */
export function ChannelIcon({ icon }: { icon?: string }) {
  if (!icon) return null
  if (icon === "enois") return <img className="ch-icon ch-icon--img" src="/brand/channels/enois.ico" alt="" width="18" height="18" />
  return <span className={`ch-icon ch-icon--${icon}`} aria-hidden="true" />
}
