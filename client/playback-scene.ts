import type {PublicSave,PresentationFrame} from '../shared/types.js';
export function revealedScene(before:PublicSave,after:PublicSave,frame:PresentationFrame,last:boolean){
 if(last&&after.mode==='explore'&&frame.mode!=='combat'&&frame.sceneId===after.scene.id)return after.scene;
 return frame.sceneId===before.scene.id?before.scene:after.scene;
}
