import {useId} from 'react';
import geometry from '../data/crack-animation.json';

export default function CrackLayer({mobile=false}) {
 const id=useId().replaceAll(':','');
 const sweep=`${id}-sweep`;
 return <svg className="crack-animation-layer" data-crack-layer={mobile?'mobile':'desktop'} aria-hidden="true"
   viewBox={mobile?'0 0 462 819':'0 0 405.172 235.945'} preserveAspectRatio="none">
  <defs>
   <mask id={sweep} maskUnits="userSpaceOnUse" x="-20" y="-20" width="510" height="870">
    <path className="crack-reveal-sweep" d={mobile?geometry.mobileSweep:geometry.desktopSweep} pathLength="1" fill="none" stroke="white" strokeWidth={mobile?24:20} strokeLinecap="round" strokeLinejoin="round" />
   </mask>
   {!mobile&&<linearGradient id={`${id}-grey`} x1="239.704" y1="93.8021" x2="214.203" y2="164.802" gradientUnits="userSpaceOnUse">
    <stop stopColor="#2A2A2A"/><stop offset="1" stopColor="#C5C5C5"/>
   </linearGradient>}
  </defs>
  {mobile?<>
   {/* Only source crack pixels were replaced from the supplied clean SVG.
       Preparing this at native resolution prevents scaled mask edge seams. */}
   <image href={`${import.meta.env.BASE_URL}assets/crack-animation/mobile-vessel-clean-matched.png`} width="462" height="819"/>
   <image href={`${import.meta.env.BASE_URL}assets/2026-10-25/mobile-group651.png`} width="462" height="819" mask={`url(#${sweep})`}/>
  </>:<path d={geometry.desktopPath} fill={`url(#${id}-grey)`} mask={`url(#${sweep})`}/>}
 </svg>;
}
