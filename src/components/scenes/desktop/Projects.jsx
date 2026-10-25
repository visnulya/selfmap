import FigmaText from '../../FigmaText.jsx';
import ProjectLinks from '../../ProjectLinks.jsx';


// Figma layers retain their original global paint order across sections.
export default function DesktopProjects() {
  return (
    <section className="scene-section" data-section="projects" aria-label="Наши проекты">
      <ProjectLinks nodeId="1527:40" className="desktop-style-031 figma-layer" style={{ '--paint-order': 16 }} data-node-id="1527:40" />
      <FigmaText nodeId="1527:41" className="desktop-style-037 figma-layer" style={{ '--paint-order': 18 }} role="heading" aria-level={2} data-node-id="1527:41" />
    </section>
  );
}
