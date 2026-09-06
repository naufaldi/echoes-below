import {Component,Suspense,type ReactNode} from 'react';
import {useGLTF} from '@react-three/drei';
import {WorldLabel} from './WorldLabels';
type Props={url:string;name:string;id:string;position:[number,number,number];children:ReactNode};
class AssetBoundary extends Component<Props,{failed:boolean;attempt:number}>{
 state={failed:false,attempt:0};
 static getDerivedStateFromError(){return{failed:true};}
 retry=()=>{useGLTF.clear(this.props.url);this.setState(s=>({failed:false,attempt:s.attempt+1}));};
 render(){return this.state.failed?<WorldLabel error id={'asset-error:'+this.props.id} text={this.props.name+' unavailable'} detail="Select to retry model" priority={95} position={this.props.position} onSelect={this.retry}/>:<Suspense key={this.state.attempt} fallback={<WorldLabel id={'asset-loading:'+this.props.id} text={'Loading '+this.props.name} priority={30} position={this.props.position} onSelect={()=>{}}/>}>{this.props.children}</Suspense>;}
}
export default function IsolatedAsset(props:Props){return <AssetBoundary key={props.url} {...props}/>;}
