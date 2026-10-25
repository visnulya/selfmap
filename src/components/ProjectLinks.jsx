import textLayout from '../data/text-layout.json';
import PreparedLink from './PreparedLink.jsx';

const linkKeys = ['dzen', 'youtube', 'instagram', 'telegram', 'website'];

export default function ProjectLinks({ nodeId, ...props }) {
  const layout = textLayout[nodeId];
  return (
    <div {...props}>
      <svg width={layout.width} height={layout.height} className="figma-text">
        {layout.lines.map((line, index) => (
          <PreparedLink key={linkKeys[index]} linkKey={linkKeys[index]}>
            <text fill="currentColor" fontSize={layout.fontSize} x={line.x} y={line.y} xmlSpace="preserve">{line.text}</text>
          </PreparedLink>
        ))}
      </svg>
    </div>
  );
}
