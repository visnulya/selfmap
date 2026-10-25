import { links } from '../data/links.js';

// The service URL can be enabled in data/links.js without changing the scene.
export default function ServiceButton({className='',...props}) {
  const classes=`service-button ${className}`;
  if (links.service.url) return <a {...props} className={classes} href={links.service.url} aria-label={links.service.label} />;
  return <button {...props} className={classes} type="button" aria-label="Подробнее о сервисе" aria-disabled="true" />;
}
