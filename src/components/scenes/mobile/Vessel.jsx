import ServiceButton from '../../ServiceButton.jsx';
import FigmaText from '../../FigmaText.jsx';
import VesselConnection from '../../VesselConnection.jsx';
import CrackLayer from '../../CrackLayer.jsx';
const imgGroup651 = import.meta.env.BASE_URL + "assets/2026-10-25/mobile-group651.png";
const imgVector57 = import.meta.env.BASE_URL + "assets/2026-10-25/mobile-vector57.svg";
const imgArrow13 = import.meta.env.BASE_URL + "assets/2026-10-25/mobile-arrow13.svg";

// Figma layers retain their original global paint order across sections.
export default function MobileVessel() {
  return (
    <section className="scene-section" data-section="vessel" aria-label="Человек как сосуд">
      <div className="mobile-style-002 figma-layer" style={{ '--paint-order': 1 }} data-node-id="1567:208" data-name="Group 65 1">
        <img alt="" className="mobile-style-003" src={imgGroup651} data-crack-original />
        <CrackLayer mobile />
      </div>
      <div className="mobile-style-004 figma-layer" style={{ '--paint-order': 2 }} data-node-id="1428:85">
        <div className="mobile-style-005">
          <img alt="" className="mobile-style-006" src={imgVector57} />
        </div>
      </div>
      <VesselConnection />
      <FigmaText nodeId="1332:197" className="mobile-style-064 figma-layer" style={{ '--paint-order': 17 }} data-node-id="1332:197" />
      <FigmaText nodeId="1332:198" className="mobile-style-065 figma-layer" style={{ '--paint-order': 18 }} data-node-id="1332:198" />
      <FigmaText nodeId="1332:199" className="mobile-style-066 figma-layer" style={{ '--paint-order': 19 }} data-node-id="1332:199" />
      <FigmaText nodeId="1332:200" className="mobile-style-067 figma-layer" style={{ '--paint-order': 20 }} data-node-id="1332:200" />
      <ServiceButton className="mobile-style-068 figma-layer" style={{ '--paint-order': 21 }} data-node-id="1332:201" />
      <FigmaText nodeId="1333:202" className="mobile-style-069 figma-layer" style={{ '--paint-order': 22 }} aria-hidden="true" data-node-id="1333:202" />
      <div className="mobile-style-070 figma-layer" style={{ '--paint-order': 23 }} aria-hidden="true" data-service-arrow data-node-id="1335:203">
        <div className="mobile-style-071">
          <div className="mobile-style-072">
            <div className="mobile-style-073">
              <img alt="" className="mobile-style-074" src={imgArrow13} />
            </div>
          </div>
        </div>
      </div>
      <FigmaText nodeId="1335:204" className="mobile-style-176 figma-layer" style={{ '--paint-order': 34 }} role="heading" aria-level={2} data-node-id="1335:204" />
    </section>
  );
}
