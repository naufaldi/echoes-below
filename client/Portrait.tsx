import {useEffect,useSyncExternalStore,type ReactNode} from 'react';
import {readPortrait,requestPortrait,subscribePortraits,portraitVersion,type PortraitState} from './portrait-store';
import {portraitLook,portraitKey,type PortraitSubject,type PortraitExpression} from './portrait-look';
/** The portrait for a character's current look: a painted override when the manifest lists one, otherwise a snapshot of the in-game model. `ready` stays false until an image exists, so callers keep their own fallback until then. Needs <PortraitStudio/> inside the world Canvas. */
export function usePortrait(subject:PortraitSubject|null|undefined,expression:PortraitExpression='neutral'):PortraitState{
 useSyncExternalStore(subscribePortraits,portraitVersion);
 const key=subject?portraitKey(portraitLook(subject),expression)+'|'+subject.id:'';
 // eslint-disable-next-line react-hooks/exhaustive-deps
 useEffect(()=>{if(subject)requestPortrait(subject,expression);},[key]);
 return subject?readPortrait(subject,expression):{url:null,ready:false,source:null};
}
/** Fills its parent with the portrait, showing `fallback` (for example the class glyph) until the image is ready. */
export function PortraitImage({subject,expression,fallback}:{subject:PortraitSubject;expression?:PortraitExpression;fallback:ReactNode}){
 const {url,ready}=usePortrait(subject,expression);
 return ready&&url?<img src={url} alt="" draggable={false} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'inherit',display:'block'}}/>:<>{fallback}</>;
}
