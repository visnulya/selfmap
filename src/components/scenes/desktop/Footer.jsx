import FigmaText from '../../FigmaText.jsx';
import PreparedLink from '../../PreparedLink.jsx';


// Figma layers retain their original global paint order across sections.
export default function DesktopFooter() {
  return (
    <section className="scene-section" data-section="footer" aria-label="Подвал">
      <div className="desktop-style-059 figma-layer" style={{ '--paint-order': 30 }} data-node-id="1428:275" />
      <FigmaText nodeId="1548:128" className="desktop-style-249 figma-layer" style={{ '--paint-order': 64 }} data-node-id="1548:128" />
      <FigmaText as={PreparedLink} linkKey="privacy" nodeId="1548:129" className="desktop-style-250 figma-layer" style={{ '--paint-order': 65 }} data-node-id="1548:129" />
    </section>
  );
}
