import { links } from '../data/links.js';

export default function PreparedLink({ linkKey, className = '', children, ...props }) {
  const link = links[linkKey];
  return (
    <a {...props} className={`prepared-link ${className}`} role="link" href={link.url || undefined}
      target={link.url && link.newTab ? '_blank' : undefined}
      rel={link.url && link.newTab ? 'noopener noreferrer' : undefined}
      aria-label={link.label} aria-disabled={!link.url || undefined} tabIndex={0}
      onClick={link.url ? undefined : event => event.preventDefault()}>
      {children}
    </a>
  );
}
