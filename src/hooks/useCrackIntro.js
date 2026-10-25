import {useLayoutEffect,useRef,useState} from 'react';

export function useCrackIntro(viewportRef,desktop){
 const [state,setState]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches?'complete':'idle');
 const started=useRef(false);
 const composition=useRef(desktop);
 useLayoutEffect(()=>{
  if(state==='complete')return;
  const root=viewportRef.current;
  const changedComposition=composition.current!==desktop;
  composition.current=desktop;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let observer,timer,cancelled=false;
  const finish=()=>{started.current=true;setState('complete');};
  const onReduced=()=>{if(reduced.matches)finish();};
  const onEnd=event=>{if(event.animationName==='crack-development')finish();};
  reduced.addEventListener('change',onReduced);
  root.addEventListener('animationend',onEnd);
  if(reduced.matches||(changedComposition&&started.current))finish();
  else if(state==='running')timer=setTimeout(()=>{
   const paused=root.getAnimations({subtree:true}).some(animation=>animation.animationName==='crack-development'&&animation.playState==='paused');
   if(!paused)finish();
  },2100);
  else if(started.current)finish();
  else{
   const target=root.querySelector(desktop?'[data-node-id="1428:259"]':'[data-node-id="1567:208"]');
   observer=new IntersectionObserver(entries=>{
    if(started.current||!entries.some(entry=>entry.isIntersecting))return;
    started.current=true;observer.disconnect();
    // Decode every external SVG image before removing the raster fallback.
    const paths=desktop?[]:[`${import.meta.env.BASE_URL}assets/crack-animation/mobile-vessel-clean-matched.png`,`${import.meta.env.BASE_URL}assets/2026-10-25/mobile-group651.png`];
    Promise.all(paths.map(src=>{const image=new Image();image.src=src;return image.decode();})).then(()=>{
     if(!cancelled)setState('running');
    }).catch(()=>{if(!cancelled)finish();});
   // The lower drawing starts after about 45% of the vessel is visible,
   // so the user can actually see the crack's starting point.
   },{threshold:.45,rootMargin:'0px 0px -6% 0px'});
   if(target)observer.observe(target);
  }
  return()=>{cancelled=true;observer?.disconnect();clearTimeout(timer);reduced.removeEventListener('change',onReduced);root.removeEventListener('animationend',onEnd);};
 },[state,desktop,viewportRef]);
 return state;
}
