// #97 The Tab trap's arithmetic, kept free of the DOM so it can be tested.
/**
 * Where Tab goes inside a dialog with `count` tabbable controls. `at` is the focused control's index; an element outside the list
 * (a heading focused on open, the dialog itself) sits half a step after the controls before it, so `-0.5` is "before the first".
 * Returns the control to focus, `-1` for the dialog itself (nothing tabbable), or `null` when the browser's own step stays inside.
 */
export function tabStop(count:number,at:number,back:boolean):number|null{
 if(count<=0)return -1;
 if(back)return at<=0?count-1:null;
 return at>=count-1?0:null;
}
/** A focused element's place among the tabbable controls: its index, or the half step after those that come before it. */
export const tabPosition=(index:number,before:number)=>index>=0?index:before-.5;
