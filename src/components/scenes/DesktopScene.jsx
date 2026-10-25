import DesktopHero from './desktop/Hero.jsx';
import DesktopOrigins from './desktop/Origins.jsx';
import DesktopBoundaries from './desktop/Boundaries.jsx';
import DesktopArchetypes from './desktop/Archetypes.jsx';
import DesktopVessel from './desktop/Vessel.jsx';
import DesktopProjects from './desktop/Projects.jsx';
import DesktopFooter from './desktop/Footer.jsx';
import './desktop.css';

export default function DesktopScene() {
  return (
    <div className="figma-scene figma-scene--desktop" data-node-id="1428:86" data-layout="desktop">
      <DesktopHero />
      <DesktopOrigins />
      <DesktopBoundaries />
      <DesktopArchetypes />
      <DesktopVessel />
      <DesktopProjects />
      <DesktopFooter />
    </div>
  );
}
