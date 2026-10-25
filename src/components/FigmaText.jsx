import textLayout from '../data/text-layout.json';

// Live, selectable text. Explicit baselines preserve Figma's line wrapping and
// rounded line spacing on every browser, independently of HTML font hinting.
export default function FigmaText({ nodeId, as: Element = 'div', ...props }) {
  const layout = textLayout[nodeId];
  return (
    <Element {...props}>
      <span className="sr-only">{layout.text}</span>
      <svg width={layout.width} height={layout.height} className="figma-text" aria-hidden="true">
        <text fill="currentColor" fontSize={layout.fontSize} xmlSpace="preserve">
          {layout.lines.map((line, index) => <tspan key={index} x={line.x} y={line.y}>{line.text}</tspan>)}
        </text>
      </svg>
    </Element>
  );
}
