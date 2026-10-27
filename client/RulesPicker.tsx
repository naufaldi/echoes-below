import {useId} from 'react';
import type {PublicSave} from '../shared/types';
type Rules=PublicSave['rulesVersion'];
const OPTIONS:[Rules,string,string][]=[['echo-v1','Echo Rules','The full campaign with quick checks.'],['curated-srd-5.2.1-v1','Curated tactics','Preview: grid movement and spell slots.']];
export default function RulesPicker({value,onChange}:{value:Rules;onChange:(r:Rules)=>void}){const name=useId();return <fieldset className="choice-cards rules-picker"><legend>Adventure rules</legend>{OPTIONS.map(([v,title,line])=><label key={v}><input type="radio" name={name} value={v} checked={value===v} onChange={()=>onChange(v)}/><span><strong>{title}</strong><small>{line}</small></span></label>)}<p className="rules-disclosure">Curated tactics adds companion control; full class progression is still in development. <a href="/SRD-NOTICE.txt" target="_blank" rel="noreferrer">Rules attribution</a></p></fieldset>}
