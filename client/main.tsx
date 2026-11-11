import React,{lazy,Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import AppBoundary from './AppBoundary';
import './style.css';
// The local asset audit is a developer page; keep it out of the game's startup bundle.
const RogueCombatReview=lazy(()=>import('./RogueCombatReview'));
const AssetReview=lazy(()=>import('./AssetReview'));
const PortraitSheet=lazy(()=>import('./PortraitSheet'));
const local=location.hostname==='127.0.0.1';
createRoot(document.getElementById('root')!).render(import.meta.env.DEV&&local&&new URLSearchParams(location.search).get('combatReview')==='1'?<Suspense fallback={null}><RogueCombatReview/></Suspense>:local&&location.search==='?asset-review'?<Suspense fallback={null}><AssetReview/></Suspense>:local&&location.search.startsWith('?portraits')?<Suspense fallback={null}><PortraitSheet/></Suspense>:<AppBoundary><App/></AppBoundary>);
