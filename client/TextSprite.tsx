import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {CanvasTexture,SRGBColorSpace,type Sprite,type SpriteMaterial} from 'three';

/** Scene-space text drawn to a canvas texture. Stays in the WebGL scene, so it creates no DOM per frame. */
export default function TextSprite({text,color,position,height=.42,rise=0,life=0,reduced=false,italic=false}:{text:string;color:string;position:[number,number,number];height?:number;rise?:number;life?:number;reduced?:boolean;italic?:boolean}){
 const texture=useMemo(()=>{
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d')!,font=`${italic?'italic ':''}700 96px "Cormorant Garamond", Georgia, serif`;
  ctx.font=font;const width=Math.ceil(ctx.measureText(text).width)+48;canvas.width=width;canvas.height=128;
  ctx.font=font;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=12;ctx.strokeStyle='rgba(5,10,9,.85)';ctx.strokeText(text,width/2,66);ctx.fillStyle=color;ctx.fillText(text,width/2,66);
  const t=new CanvasTexture(canvas);t.colorSpace=SRGBColorSpace;return t;
 },[text,color,italic]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 const sprite=useRef<Sprite>(null),material=useRef<SpriteMaterial>(null),age=useRef(0);
 useFrame((_,delta)=>{
  if(!life||!sprite.current||!material.current)return;age.current+=delta;const t=Math.min(1,age.current/life);
  if(!reduced)sprite.current.position.y=position[1]+rise*t;
  material.current.opacity=t<.7?1:Math.max(0,1-(t-.7)/.3);
 });
 const aspect=texture.image.width/texture.image.height;
 return <sprite ref={sprite} position={position} scale={[height*aspect,height,1]} renderOrder={20}><spriteMaterial ref={material} map={texture} transparent depthTest={false} depthWrite={false} toneMapped={false}/></sprite>;
}
