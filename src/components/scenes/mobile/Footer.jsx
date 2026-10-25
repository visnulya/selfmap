import FigmaText from '../../FigmaText.jsx';
import PreparedLink from '../../PreparedLink.jsx';


// Figma layers retain their original global paint order across sections.
export default function MobileFooter() {
  return (
    <section className="scene-section" data-section="footer" aria-label="Подвал">
      <div className="mobile-style-063 figma-layer" style={{ '--paint-order': 16 }} data-node-id="1332:196" />
      <FigmaText as={PreparedLink} linkKey="privacy" nodeId="1340:509" className="mobile-style-172 figma-layer" style={{ '--paint-order': 30 }} data-node-id="1340:509" />
      <FigmaText nodeId="1340:510" className="mobile-style-173 figma-layer" style={{ '--paint-order': 31 }} data-node-id="1340:510" />
    </section>
  );
}
