import FigmaText from '../../FigmaText.jsx';
const img222211C30Bf2E84B224F238E936C366D00C96C11 = import.meta.env.BASE_URL + "assets/2026-10-25/desktop-222211-c30-bf2-e84-b224-f238-e936-c366-d00-c96-c11.png";
const imgVector83 = import.meta.env.BASE_URL + "assets/2026-10-25/desktop-vector83.svg";
const imgVector84 = import.meta.env.BASE_URL + "assets/2026-10-25/desktop-vector84.svg";

// Figma layers retain their original global paint order across sections.
export default function DesktopArchetypes() {
  return (
    <section className="scene-section" data-section="archetypes" aria-label="Женские образы">
      <FigmaText nodeId="1428:256" className="desktop-style-028 figma-layer" style={{ '--paint-order': 15 }} data-node-id="1428:256" />
      <FigmaText nodeId="1428:257" className="desktop-style-036 figma-layer" style={{ '--paint-order': 17 }} role="heading" aria-level={2} data-node-id="1428:257" />
      <div className="desktop-style-146 figma-layer" style={{ '--paint-order': 49 }} data-layer-group="true" data-node-id="1547:33">
        <div className="desktop-style-147" data-node-id="1547:34">
          <div className="desktop-style-148" data-node-id="1547:35">
            <div className="desktop-style-149">
              <div className="desktop-style-150" />
            </div>
          </div>
          <FigmaText nodeId="1547:36" className="desktop-style-151" data-node-id="1547:36" />
        </div>
        <div className="desktop-style-152" data-node-id="1547:37">
          <img alt="" className="desktop-style-153" src={imgVector83} />
        </div>
        <div className="desktop-style-154" data-node-id="1547:38">
          <div className="desktop-style-155">
            <div className="desktop-style-156">
              <img alt="" className="desktop-style-157" src={imgVector84} />
            </div>
          </div>
        </div>
      </div>
      <div className="desktop-style-234 figma-layer" style={{ '--paint-order': 59 }} data-node-id="1545:32" data-name="222211c30bf2e8-4b22-4f23-8e93-6c366d00c96c 1 1">
        <div className="desktop-style-235">
          <img alt="" className="desktop-style-236" src={img222211C30Bf2E84B224F238E936C366D00C96C11} />
        </div>
      </div>
    </section>
  );
}
