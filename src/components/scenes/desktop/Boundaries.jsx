import FigmaText from '../../FigmaText.jsx';
const img1 = import.meta.env.BASE_URL + "assets/2026-10-25/desktop-1.png";
const imgVector77 = import.meta.env.BASE_URL + "assets/2026-10-25/desktop-vector77.svg";
const imgVector80 = import.meta.env.BASE_URL + "assets/2026-10-25/desktop-vector80.svg";
const imgVector81 = import.meta.env.BASE_URL + "assets/2026-10-25/desktop-vector81.svg";
const imgVector82 = import.meta.env.BASE_URL + "assets/2026-10-25/desktop-vector82.svg";
const imgVector91 = import.meta.env.BASE_URL + "assets/2026-10-25/desktop-vector91.svg";
const imgVector92 = import.meta.env.BASE_URL + "assets/2026-10-25/desktop-vector92.svg";
const imgVector93 = import.meta.env.BASE_URL + "assets/2026-10-25/desktop-vector93.svg";
const imgVector94 = import.meta.env.BASE_URL + "assets/2026-10-25/desktop-vector94.svg";
const imgVector95 = import.meta.env.BASE_URL + "assets/2026-10-25/desktop-vector95.svg";

// Figma layers retain their original global paint order across sections.
export default function DesktopBoundaries() {
  return (
    <section className="scene-section" data-section="boundaries" aria-label="Личные границы">
      <div className="desktop-style-013 figma-layer" style={{ '--paint-order': 5 }} data-node-id="1428:104" />
      <FigmaText nodeId="1428:167" className="desktop-style-026 figma-layer" style={{ '--paint-order': 13 }} data-node-id="1428:167" />
      <FigmaText nodeId="1428:168" className="desktop-style-027 figma-layer" style={{ '--paint-order': 14 }} role="heading" aria-level={2} data-node-id="1428:168" />
      <div className="desktop-style-134 figma-layer" style={{ '--paint-order': 48 }} data-layer-group="true" data-node-id="1537:124">
        <div className="desktop-style-135" data-node-id="1537:125">
          <div className="desktop-style-136" data-node-id="1537:126">
            <div className="desktop-style-137">
              <div className="desktop-style-138" />
            </div>
          </div>
          <FigmaText nodeId="1537:127" className="desktop-style-139" data-node-id="1537:127" />
        </div>
        <div className="desktop-style-140" data-node-id="1537:128">
          <img alt="" className="desktop-style-141" src={imgVector81} />
        </div>
        <div className="desktop-style-142" data-node-id="1537:129">
          <div className="desktop-style-143">
            <div className="desktop-style-144">
              <img alt="" className="desktop-style-145" src={imgVector82} />
            </div>
          </div>
        </div>
      </div>
      <div className="desktop-style-170 figma-layer" style={{ '--paint-order': 51 }} data-layer-group="true" data-node-id="1538:143">
        <div className="desktop-style-171" data-node-id="1538:144">
          <div className="desktop-style-172" data-node-id="1538:145">
            <div className="desktop-style-173">
              <div className="desktop-style-174" />
            </div>
          </div>
          <FigmaText nodeId="1538:146" className="desktop-style-175" data-node-id="1538:146" />
        </div>
        <div className="desktop-style-176" data-node-id="1538:147">
          <img alt="" className="desktop-style-177" src={imgVector77} />
        </div>
        <div className="desktop-style-178" data-node-id="1538:148">
          <div className="desktop-style-179">
            <div className="desktop-style-180">
              <img alt="" className="desktop-style-181" src={imgVector80} />
            </div>
          </div>
        </div>
      </div>
      <div className="desktop-style-209 figma-layer" style={{ '--paint-order': 55 }} data-node-id="1537:123" data-name="личные границы нг 1">
        <img alt="" className="desktop-style-210" src={img1} />
      </div>
      <div className="desktop-style-211 figma-layer" style={{ '--paint-order': 56 }} data-layer-group="true" data-node-id="1538:131">
        <div className="desktop-style-212" data-node-id="1538:132">
          <div className="desktop-style-213" data-node-id="1538:133" />
          <FigmaText nodeId="1538:134" className="desktop-style-214" data-node-id="1538:134" />
        </div>
        <div className="desktop-style-215" data-node-id="1538:135">
          <div className="desktop-style-216">
            <div className="desktop-style-217">
              <img alt="" className="desktop-style-218" src={imgVector91} />
            </div>
          </div>
        </div>
        <div className="desktop-style-219" data-node-id="1538:136">
          <img alt="" className="desktop-style-220" src={imgVector92} />
        </div>
      </div>
      <div className="desktop-style-221 figma-layer" style={{ '--paint-order': 57 }} data-layer-group="true" data-node-id="1538:149">
        <div className="desktop-style-222" data-node-id="1538:150">
          <div className="desktop-style-223" data-node-id="1538:151" />
          <FigmaText nodeId="1538:152" className="desktop-style-224" data-node-id="1538:152" />
        </div>
        <div className="desktop-style-225" data-node-id="1538:153">
          <div className="desktop-style-226">
            <div className="desktop-style-227">
              <img alt="" className="desktop-style-228" src={imgVector93} />
            </div>
          </div>
        </div>
        <div className="desktop-style-229" data-node-id="1538:154">
          <img alt="" className="desktop-style-230" src={imgVector94} />
        </div>
      </div>
      <div className="desktop-style-231 figma-layer" style={{ '--paint-order': 58 }} data-node-id="1539:159">
        <div className="desktop-style-232">
          <img alt="" className="desktop-style-233" src={imgVector95} />
        </div>
      </div>
    </section>
  );
}
