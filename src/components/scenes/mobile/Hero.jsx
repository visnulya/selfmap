import FigmaText from '../../FigmaText.jsx';
const img11 = import.meta.env.BASE_URL + "assets/2026-10-25/mobile-11.png";
const imgVector47 = import.meta.env.BASE_URL + "assets/2026-10-25/mobile-vector47.svg";
const imgVector46 = import.meta.env.BASE_URL + "assets/2026-10-25/mobile-vector46.svg";

// Figma layers retain their original global paint order across sections.
export default function MobileHero() {
  return (
    <section className="scene-section" data-section="hero" aria-label="Первый экран">
      <div className="mobile-style-007 figma-layer" style={{ '--paint-order': 3 }} data-node-id="1328:41" />
      <FigmaText nodeId="1317:119" className="mobile-style-008 figma-layer" style={{ '--paint-order': 4 }} role="heading" aria-level={1} data-node-id="1317:119" />
      <FigmaText nodeId="1331:172" className="mobile-style-061 figma-layer" style={{ '--paint-order': 14 }} role="heading" aria-level={2} data-node-id="1331:172" />
      <FigmaText nodeId="1424:30" className="mobile-style-062 figma-layer" style={{ '--paint-order': 15 }} data-node-id="1424:30" />
      <div className="mobile-style-177 figma-layer" style={{ '--paint-order': 35 }} data-node-id="1442:283">
        <div className="mobile-style-178">
          <img alt="" className="mobile-style-179" src={imgVector47} />
        </div>
      </div>
      <div className="mobile-style-180 figma-layer" style={{ '--paint-order': 36 }} data-node-id="1442:284">
        <div className="mobile-style-181">
          <img alt="" className="mobile-style-182" src={imgVector46} />
        </div>
      </div>
      <FigmaText nodeId="1541:30" className="mobile-style-183 figma-layer" style={{ '--paint-order': 37 }} data-node-id="1541:30" />
      <div className="mobile-style-184 figma-layer" style={{ '--paint-order': 38 }} data-node-id="1541:31" />
      <div className="mobile-style-185 figma-layer" style={{ '--paint-order': 39 }} data-node-id="1567:30" data-name="мужик без фона 1 1" data-intro-hermes="true">
        <img alt="" className="mobile-style-186" src={img11} />
      </div>
    </section>
  );
}
