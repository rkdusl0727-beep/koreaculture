'use client';

import {useEffect,useMemo,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import HomeIconButton from './home-icon-button';
import SoundIconButton from './sound-icon-button';
import {speakKorean,stopKoreanSpeech} from './korean-speech';
import {patternById,traditionalPatterns,type TraditionalPattern,type TraditionalPatternId} from './traditional-pattern-data';
import './traditional-pattern-maker.css';

type Props={home:()=>void;soundOn:boolean;toggleSound:()=>void};
type Confirm='clear'|'change'|null;
type FillAction={x:number;y:number;color:string};

const palette=[
  ['빨강','#e7473c'],['주황','#ed8b32'],['노랑','#f2bd37'],['연두','#91c957'],['초록','#318b61'],['민트','#74d2b6'],
  ['청록','#198f91'],['하늘','#67b9df'],['파랑','#2878b8'],['남색','#263f78'],['보라','#79538c'],['연보라','#aa86c5'],
  ['분홍','#e879a9'],['진분홍','#c74378'],['갈색','#8a5a36'],['회색','#8b929b'],['검정','#232a35'],['흰색','#fffef9'],
] as const;

const rgb=(color:string)=>[Number.parseInt(color.slice(1,3),16),Number.parseInt(color.slice(3,5),16),Number.parseInt(color.slice(5,7),16)] as const;

function floodFill(context:CanvasRenderingContext2D,startX:number,startY:number,color:string){
  const {width,height}=context.canvas;
  const image=context.getImageData(0,0,width,height);
  const data=image.data;
  const start=(startY*width+startX)*4;
  const target=[data[start],data[start+1],data[start+2]] as const;
  const fill=rgb(color);
  const targetMax=Math.max(target[0],target[1],target[2]);
  const targetMin=Math.min(target[0],target[1],target[2]);
  // 검은 외곽선은 막되, 이미 칠한 선명한 색 영역은 다시 칠할 수 있게 한다.
  if(targetMax<150||(targetMax-targetMin<35&&targetMax<220))return false;
  if(Math.max(Math.abs(target[0]-fill[0]),Math.abs(target[1]-fill[1]),Math.abs(target[2]-fill[2]))<8)return false;
  const total=width*height;
  const queue=new Int32Array(total);
  const visited=new Uint8Array(total);
  let head=0,tail=0,touchesEdge=false;
  const matches=(index:number)=>{const offset=index*4;return data[offset+3]>220&&Math.max(Math.abs(data[offset]-target[0]),Math.abs(data[offset+1]-target[1]),Math.abs(data[offset+2]-target[2]))<=28};
  const add=(index:number)=>{if(index<0||index>=total||visited[index]||!matches(index))return;visited[index]=1;queue[tail++]=index};
  add(startY*width+startX);
  while(head<tail){const index=queue[head++];const x=index%width,y=Math.floor(index/width);if(x===0||y===0||x===width-1||y===height-1)touchesEdge=true;if(x>0)add(index-1);if(x<width-1)add(index+1);if(y>0)add(index-width);if(y<height-1)add(index+width)}
  if(touchesEdge||tail<180)return false;
  for(let i=0;i<tail;i++){const offset=queue[i]*4;data[offset]=fill[0];data[offset+1]=fill[1];data[offset+2]=fill[2];data[offset+3]=255}
  context.putImageData(image,0,0);
  return true;
}

function PatternCanvas({pattern,actions,color,canvasRef,onFill,onInvalid}:{pattern:TraditionalPattern;actions:FillAction[];color:string;canvasRef:React.RefObject<HTMLCanvasElement|null>;onFill:(action:FillAction)=>void;onInvalid:()=>void}){
  const imageRef=useRef<HTMLImageElement|null>(null);
  const [ready,setReady]=useState(false);
  useEffect(()=>{let active=true;setReady(false);const image=new Image();image.onload=()=>{if(!active)return;imageRef.current=image;const canvas=canvasRef.current;if(canvas){canvas.width=image.naturalWidth;canvas.height=image.naturalHeight}setReady(true)};image.src=pattern.preview;return()=>{active=false}},[pattern.preview,canvasRef]);
  useEffect(()=>{if(!ready||!imageRef.current||!canvasRef.current)return;const canvas=canvasRef.current,context=canvas.getContext('2d',{willReadFrequently:true});if(!context)return;context.clearRect(0,0,canvas.width,canvas.height);context.drawImage(imageRef.current,0,0,canvas.width,canvas.height);actions.forEach(action=>floodFill(context,action.x,action.y,action.color))},[actions,ready,canvasRef]);
  const fillAt=(event:React.PointerEvent<HTMLCanvasElement>)=>{const canvas=canvasRef.current,context=canvas?.getContext('2d',{willReadFrequently:true});if(!canvas||!context||!ready)return;const rect=canvas.getBoundingClientRect();const x=Math.max(0,Math.min(canvas.width-1,Math.floor((event.clientX-rect.left)/rect.width*canvas.width)));const y=Math.max(0,Math.min(canvas.height-1,Math.floor((event.clientY-rect.top)/rect.height*canvas.height)));if(floodFill(context,x,y,color))onFill({x,y,color});else onInvalid()};
  return <canvas ref={canvasRef} className="tp-coloring-canvas" role="img" aria-label={`${pattern.name} 색칠 그림`} onPointerUp={fillAt}/>;
}

function PatternPicker({onChoose}:{onChoose:(id:TraditionalPatternId)=>void}){
  return <section className="tp-picker"><div className="tp-heading"><h2>마음에 드는 전통문양을 골라 아름다운 색으로 꾸며 보아요.</h2><p>문양 카드를 한 번 눌러 시작해요.</p></div><div className="tp-pattern-grid">{traditionalPatterns.map(pattern=><button key={pattern.id} type="button" onPointerUp={()=>onChoose(pattern.id)}><img src={pattern.preview} alt={`${pattern.name} 선 그림`}/><strong>{pattern.name}</strong></button>)}</div></section>;
}

export default function TraditionalPatternMaker({home,soundOn,toggleSound}:Props){
  const [selectedId,setSelectedId]=useState<TraditionalPatternId|null>(null);
  const pattern=selectedId?patternById[selectedId]:null;
  const [actions,setActions]=useState<FillAction[]>([]);
  const [selectedColor,setSelectedColor]=useState<string>(palette[0][1]);
  const [message,setMessage]=useState('마음에 드는 문양을 골라 보세요.');
  const [confirm,setConfirm]=useState<Confirm>(null);
  const [celebrate,setCelebrate]=useState(false);
  const artworkRef=useRef<HTMLCanvasElement>(null);
  const hasColor=useMemo(()=>actions.length>0,[actions]);
  const choose=(id:TraditionalPatternId)=>{const next=patternById[id];stopKoreanSpeech();speakKorean(`${next.name}. ${next.meaning}`,soundOn,.86);setSelectedId(id);setActions([]);setConfirm(null);setMessage(`${next.name}을 골랐어요. 색을 고르고 칠할 곳을 눌러 보세요.`)};
  const undo=()=>{if(!actions.length)return;setActions(values=>values.slice(0,-1));setMessage('방금 칠한 곳을 되돌렸어요.')};
  const clear=()=>{setActions([]);setConfirm(null);setMessage('색칠한 내용을 모두 지웠어요.')};
  const returnToPicker=()=>{stopKoreanSpeech();setSelectedId(null);setActions([]);setConfirm(null);setMessage('마음에 드는 문양을 골라 보세요.')};
  const askForPicker=()=>hasColor?setConfirm('change'):returnToPicker();
  const save=async()=>{const artwork=artworkRef.current;if(!artwork)return;try{const output=document.createElement('canvas');output.width=1200;output.height=1200;const context=output.getContext('2d');if(!context)throw new Error('canvas');context.fillStyle='#fff';context.fillRect(0,0,1200,1200);context.drawImage(artwork,0,0,1200,1200);const png=await new Promise<Blob|null>(resolve=>output.toBlob(resolve,'image/png'));if(!png)throw new Error('png');const url=URL.createObjectURL(png);const link=document.createElement('a');link.href=url;link.download='우리나라_전통문양_색칠작품.png';link.hidden=true;document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1200);setCelebrate(true);setMessage('멋진 전통문양을 완성했어요!');window.setTimeout(()=>setCelebrate(false),1000)}catch{setMessage('저장하지 못했어요. 다시 눌러주세요.')}};
  return <main className="activity tp-app"><header className="topbar"><HomeIconButton onClick={home}/><div className="activity-title"><span>✿</span><h1>전통문양 색칠하기</h1><span>✿</span></div><SoundIconButton soundOn={soundOn} onClick={toggleSound} className="round-action sound-only"/></header>{!pattern?<PatternPicker onChoose={choose}/>:<section className="tp-coloring"><div className="tp-coloring-heading"><div><h2>{pattern.name}</h2><p className="tp-meaning">🔊 {pattern.meaning}</p><p aria-live="polite">{message}</p></div><Button variant="outline" onPointerUp={askForPicker}>다른 문양 고르기</Button></div><div className="tp-coloring-layout"><section className="tp-canvas-card"><PatternCanvas pattern={pattern} actions={actions} color={selectedColor} canvasRef={artworkRef} onFill={action=>{setActions(values=>[...values,action]);setMessage(`${palette.find(([,value])=>value===selectedColor)?.[0]??'고른 색'}으로 한 곳을 칠했어요.`)}} onInvalid={()=>setMessage('검은 선 말고 문양 안쪽을 눌러 보세요.')}/></section><aside className="tp-palette"><h3>무슨 색으로 칠할까요?</h3><div>{palette.map(([name,value])=><button key={name} type="button" aria-label={`${name} 선택`} aria-pressed={selectedColor===value} className={selectedColor===value?'active':''} onPointerUp={()=>{setSelectedColor(value);setMessage(`${name}을 골랐어요. 칠할 곳을 눌러 보세요.`)}}><span style={{background:value}}>{selectedColor===value?'✓':''}</span><b>{name}</b></button>)}</div></aside></div><div className="tp-actions"><Button variant="outline" onPointerUp={undo} disabled={!actions.length}>되돌리기</Button><Button variant="outline" onPointerUp={()=>setConfirm('clear')} disabled={!hasColor}>모두 지우기</Button><Button variant="outline" onPointerUp={askForPicker}>다른 문양 고르기</Button><Button className="tp-save" onPointerUp={save}>내 문양 저장하기</Button></div></section>}{confirm&&<dialog open className="tp-dialog"><div><h2>{confirm==='clear'?'색칠한 내용을 모두 지울까요?':'다른 문양을 고를까요?'}</h2><div className="tp-confirm"><Button variant="outline" onPointerUp={()=>setConfirm(null)}>계속 색칠하기</Button><Button onPointerUp={confirm==='clear'?clear:returnToPicker}>{confirm==='clear'?'모두 지우기':'다른 문양 고르기'}</Button></div></div></dialog>}{celebrate&&<div className="tp-complete" aria-live="polite"><div>★　✿　★</div><strong>멋진 전통문양을 완성했어요!</strong></div>}</main>;
}
