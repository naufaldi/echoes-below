import type {CuratedCharacter} from './curated-rules.js';
import type {Cell,TacticalGrid} from './tactical-grid.js';
export type CompanionDirective='balanced'|'focus'|'protect'|'conserve';
export interface TacticalState {
 effects?:{id:string;sourceId:string;targets:string[];kind:'bless';rounds:number}[];
 actors:Record<string,CuratedCharacter>;
 cells:Record<string,Cell>;
 grid:TacticalGrid;
 directives:Record<string,CompanionDirective>;
 focusTarget:string|null;
 takeover:string|null;
 started?:boolean;
}
