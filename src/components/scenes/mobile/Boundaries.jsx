import FigmaText from '../../FigmaText.jsx';
const img1 = import.meta.env.BASE_URL + "assets/2026-10-25/mobile-1.png";

// Figma layers retain their original global paint order across sections.
export default function MobileBoundaries() {
  return (
    <section className="scene-section" data-section="boundaries" aria-label="Личные границы">
      <FigmaText nodeId="1337:224" className="mobile-style-075 figma-layer" style={{ '--paint-order': 24 }} data-node-id="1337:224" />
      <FigmaText nodeId="1426:36" className="mobile-style-174 figma-layer" style={{ '--paint-order': 32 }} role="heading" aria-level={2} data-node-id="1426:36" />
      <div className="mobile-style-187 figma-layer" style={{ '--paint-order': 40 }} data-node-id="1567:32">
        <div className="mobile-style-188">
          <div className="mobile-style-189" data-name="личные границы нг 1">
            <img alt="" className="mobile-style-190" src={img1} />
          </div>
        </div>
      </div>
      <div className="mobile-style-194 figma-layer" style={{ '--paint-order': 42 }} data-node-id="1570:643" />
    </section>
  );
}
