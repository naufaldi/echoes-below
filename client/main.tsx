import React,{lazy,Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './style.css';
// The local asset audit is a developer page; keep it out of the game's startup bundle.
const AssetReview=lazy(()=>import('./AssetReview'));
createRoot(document.getElementById('root')!).render(location.hostname==='127.0.0.1'&&location.search==='?asset-review'?<Suspense fallback={null}><AssetReview/></Suspense>:<App/>);
