import join from '../data/vessel-join.json';

// Restore only the missing terminal segment measured from the reference PNG.
// The original background SVG, vessel image, and their geometry stay intact.
export default function VesselConnection() {
  return (
    <svg className="mobile-vessel-connection" data-correction="vessel-connection" aria-hidden="true"
      width={join.width} height={join.height} viewBox={`${join.x} ${join.y} ${join.width} ${join.height}`}
      style={{left:join.x,top:join.y}}>
      <path d={join.path} fill="none" stroke="#101010" strokeWidth={join.strokeWidth} />
    </svg>
  );
}
