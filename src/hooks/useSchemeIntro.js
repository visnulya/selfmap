import {useCallback,useLayoutEffect,useRef,useState} from 'react';

// One independent scroll-triggered timeline, kept above the responsive scenes.
export function useSchemeIntro(sceneRef,composition){
  const [state,setState]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches?'complete':'idle');
  const complete=useRef(state==='complete');
  const requested=useRef(false);
  const fallback=useRef(null);
  const finish=useCallback(()=>{
    if(complete.current)return;
    complete.current=true;window.clearTimeout(fallback.current);setState('complete');
  },[]);

  useLayoutEffect(()=>{
    if(complete.current)return;
    // An active reveal is never restarted when switching desktop/mobile.
    if(requested.current){finish();return;}
    const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
    const onPreference=()=>{if(preference.matches)finish();};
    preference.addEventListener('change',onPreference);
    const ring=sceneRef.current.querySelector('[data-scheme-circle="ring"]');
    if(preference.matches||!ring||!('IntersectionObserver' in window)){
      finish();return()=>preference.removeEventListener('change',onPreference);
    }
    let cancelled=false,visible=false,frame;
    const start=()=>{
      // Even a very tall first viewport must not start this stage prematurely.
      if(cancelled||complete.current||requested.current||!visible||window.scrollY<=0)return;
      requested.current=true;observer.disconnect();
      const images=[...sceneRef.current.querySelectorAll('[data-scheme-circle] img, [data-scheme-line] img, [data-scheme-decor] img')];
      Promise.allSettled([document.fonts.ready,...images.map(image=>image.decode())]).then(()=>{
        if(cancelled||complete.current)return;
        frame=requestAnimationFrame(()=>{
          if(cancelled||complete.current)return;
          setState('running');fallback.current=window.setTimeout(finish,2600);
        });
      });
    };
    const observer=new IntersectionObserver(entries=>{
      const entry=entries.find(entry=>entry.target===ring);
      if(entry){visible=entry.isIntersecting&&entry.intersectionRatio>=.2;start();}
    },{threshold:[0,.2],rootMargin:'0px 0px -6% 0px'});
    observer.observe(ring);
    window.addEventListener('scroll',start,{passive:true});
    return()=>{
      cancelled=true;observer.disconnect();cancelAnimationFrame(frame);window.clearTimeout(fallback.current);
      window.removeEventListener('scroll',start);preference.removeEventListener('change',onPreference);
    };
  },[composition,finish,sceneRef]);

  const onAnimationEnd=useCallback(event=>{
    if(event.animationName==='scheme-label-reveal'&&event.target.closest('[data-scheme-label]')?.dataset.schemeLabel==='philosophy')finish();
  },[finish]);
  return{state,onAnimationEnd};
}
