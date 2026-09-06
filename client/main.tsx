import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import AssetReview from './AssetReview';
import './style.css';
createRoot(document.getElementById('root')!).render(location.hostname==='127.0.0.1'&&location.search==='?asset-review'?<AssetReview/>:<App/>);
