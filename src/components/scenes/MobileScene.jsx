import MobileHero from './mobile/Hero.jsx';
import MobileOrigins from './mobile/Origins.jsx';
import MobileBoundaries from './mobile/Boundaries.jsx';
import MobileArchetypes from './mobile/Archetypes.jsx';
import MobileVessel from './mobile/Vessel.jsx';
import MobileFooter from './mobile/Footer.jsx';
import MobileMessages from '../MobileMessages.jsx';
import './mobile.css';

export default function MobileScene() {
  return (
    <div className="figma-scene figma-scene--mobile" data-node-id="1317:111" data-layout="mobile">
      <MobileHero />
      <MobileOrigins />
      <MobileBoundaries />
      <MobileArchetypes />
      <MobileVessel />
      <MobileFooter />
      <MobileMessages />
    </div>
  );
}
