'use client';

import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import HomeIconButton from './home-icon-button';
import SoundIconButton from './sound-icon-button';
import {speakKorean,stopKoreanSpeech} from './korean-speech';
import {patternById,traditionalPatterns,type TraditionalPattern,type TraditionalPatternId} from './traditional-pattern-data';
import './traditional-pattern-maker.css';

type Props={home:()=>void;soundOn:boolean;toggleSound:()=>void};
type Confirm='clear'|'change'|null;
type ColoringTool='crayon'|'watercolor'|'marker';
type DrawPoint={x:number;y:number;pressure:number};
type StrokeAction={points:DrawPoint[];color:string;tool:ColoringTool;size:number};

const palette=[
  ['빨강','#e7473c'],['주황','#ed8b32'],['노랑','#f2bd37'],['연두','#91c957'],['초록','#318b61'],['민트','#74d2b6'],
  ['청록','#198f91'],['하늘','#67b9df'],['파랑','#2878b8'],['남색','#263f78'],['보라','#79538c'],['연보라','#aa86c5'],
  ['분홍','#e879a9'],['진분홍','#c74378'],['갈색','#8a5a36'],['회색','#8b929b'],['검정','#232a35'],['흰색','#fffef9'],
] as const;

const coloringTools:readonly {id:ColoringTool;name:string;icon:string;description:string}[]=[
  {id:'crayon',name:'크레파스',icon:'🖍️',description:'종이결이 보이고, 힘에 따라 진하고 연한 획이 겹쳐져요.'},
  {id:'watercolor',name:'물감',icon:'🎨',description:'물이 번진 것처럼 맑은 농담과 진한 가장자리가 생겨요.'},
  {id:'marker',name:'싸인펜',icon:'🖊️',description:'선명한 잉크가 고르게 칠해지고 겹친 획은 조금 진해져요.'},
] as const;

const textureNoise=(x:number,y:number,seed:number)=>{
  let value=Math.imul(x+seed,374761393)^Math.imul(y+seed,668265263);
  value=Math.imul(value^(value>>>13),1274126177);
  return ((value^(value>>>16))>>>0)/4294967295;
};

function line(context:CanvasRenderingContext2D,points:DrawPoint[],color:string,width:number,alpha:number,offsetX=0,offsetY=0){
  if(!points.length)return;
  context.save();context.strokeStyle=color;context.fillStyle=color;context.globalAlpha=alpha;context.lineCap='round';context.lineJoin='round';context.lineWidth=width;
  if(points.length===1){context.beginPath();context.arc(points[0].x+offsetX,points[0].y+offsetY,width/2,0,Math.PI*2);context.fill()}
  else{context.beginPath();context.moveTo(points[0].x+offsetX,points[0].y+offsetY);for(let index=1;index<points.length;index++)context.lineTo(points[index].x+offsetX,points[index].y+offsetY);context.stroke()}
  context.restore();
}

function stampCrayon(context:CanvasRenderingContext2D,stroke:StrokeAction,width:number,seed:number){
  const stamps:DrawPoint[]=[];
  if(stroke.points.length===1)stamps.push(stroke.points[0]);
  for(let index=1;index<stroke.points.length;index++){
    const from=stroke.points[index-1],to=stroke.points[index];
    const distance=Math.hypot(to.x-from.x,to.y-from.y);
    const steps=Math.max(1,Math.ceil(distance/Math.max(3,width*.16)));
    for(let step=1;step<=steps;step++){
      const ratio=step/steps;
      stamps.push({x:from.x+(to.x-from.x)*ratio,y:from.y+(to.y-from.y)*ratio,pressure:from.pressure+(to.pressure-from.pressure)*ratio});
    }
  }
  context.save();context.fillStyle=stroke.color;
  stamps.forEach((point,index)=>{
    const radius=width*(.42+point.pressure*.09);
    context.globalAlpha=.2;
    context.beginPath();context.arc(point.x,point.y,radius,0,Math.PI*2);context.fill();
    for(let grain=0;grain<3;grain++){
      const angle=textureNoise(index,grain,seed+11)*Math.PI*2;
      const grainRadius=textureNoise(grain,index,seed+29)*radius*.88;
      context.globalAlpha=.025+textureNoise(index,grain,seed+91)*.035;
      context.beginPath();context.arc(point.x+Math.cos(angle)*grainRadius,point.y+Math.sin(angle)*grainRadius,width*(.11+textureNoise(grain,index,seed+53)*.07),0,Math.PI*2);context.fill();
    }
  });
  context.restore();
}

function drawStroke(context:CanvasRenderingContext2D,stroke:StrokeAction,seed:number){
  const pressure=stroke.points.reduce((sum,point)=>sum+point.pressure,0)/Math.max(1,stroke.points.length);
  const width=stroke.size*(.78+pressure*.3);
  if(stroke.tool==='marker'){
    line(context,stroke.points,stroke.color,width,.72);
    line(context,stroke.points,stroke.color,width*.72,.34);
    return;
  }
  if(stroke.tool==='watercolor'){
    context.save();context.filter=`blur(${Math.max(1,width*.045)}px)`;
    line(context,stroke.points,stroke.color,width*1.18,.1);
    line(context,stroke.points,stroke.color,width,.13);
    context.restore();
    line(context,stroke.points,stroke.color,width*.82,.13);
    line(context,stroke.points,stroke.color,width*.98,.08,Math.sin(seed)*1.5,Math.cos(seed)*1.5);
    return;
  }
  // 크레파스는 선 경로를 쓰지 않고 굵은 색 입자를 이어 붙여 면으로 칠한다.
  stampCrayon(context,stroke,width,seed);
}

function PatternCanvas({pattern,actions,color,tool,size,canvasRef,onStroke}:{pattern:TraditionalPattern;actions:StrokeAction[];color:string;tool:ColoringTool;size:number;canvasRef:React.RefObject<HTMLCanvasElement|null>;onStroke:(action:StrokeAction)=>void}){
  const [ready,setReady]=useState(false);
  const currentRef=useRef<StrokeAction|null>(null);
  const pointFrom=(event:React.PointerEvent<HTMLCanvasElement>)=>{const canvas=canvasRef.current;if(!canvas)return null;const rect=canvas.getBoundingClientRect();return{x:Math.max(0,Math.min(canvas.width,(event.clientX-rect.left)/rect.width*canvas.width)),y:Math.max(0,Math.min(canvas.height,(event.clientY-rect.top)/rect.height*canvas.height)),pressure:event.pressure>0?event.pressure:.5}};
  const render=useCallback(()=>{const canvas=canvasRef.current,context=canvas?.getContext('2d');if(!canvas||!context)return;context.clearRect(0,0,canvas.width,canvas.height);context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);actions.forEach((action,index)=>drawStroke(context,action,index+1))},[actions,canvasRef]);
  useEffect(()=>{let active=true;const image=new Image();image.onload=()=>{if(!active)return;const canvas=canvasRef.current;if(canvas){canvas.width=image.naturalWidth;canvas.height=image.naturalHeight}setReady(true)};image.src=pattern.preview;return()=>{active=false}},[pattern.preview,canvasRef]);
  useEffect(()=>{if(ready)render()},[ready,render]);
  const start=(event:React.PointerEvent<HTMLCanvasElement>)=>{if(!ready)return;const point=pointFrom(event);if(!point)return;event.currentTarget.setPointerCapture(event.pointerId);currentRef.current={points:[point],color,tool,size};const context=canvasRef.current?.getContext('2d');if(context)drawStroke(context,currentRef.current,actions.length+1)};
  const move=(event:React.PointerEvent<HTMLCanvasElement>)=>{const stroke=currentRef.current;if(!stroke)return;const point=pointFrom(event);if(!point)return;const previous=stroke.points.at(-1)!;if(Math.hypot(point.x-previous.x,point.y-previous.y)<2)return;stroke.points.push(point);render();const context=canvasRef.current?.getContext('2d');if(context)drawStroke(context,stroke,actions.length+1)};
  const finish=()=>{const stroke=currentRef.current;if(!stroke)return;currentRef.current=null;onStroke({...stroke,points:[...stroke.points]})};
  return <div className="tp-drawing-stage"><canvas ref={canvasRef} className="tp-coloring-canvas" aria-label={`${pattern.name} 직접 색칠 그림`} onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish}/><img className="tp-line-art" src={pattern.preview} alt="" draggable={false}/></div>;
}

function PatternPicker({onChoose}:{onChoose:(id:TraditionalPatternId)=>void}){
  return <section className="tp-picker"><div className="tp-heading"><h2>마음에 드는 전통문양을 골라 아름다운 색으로 꾸며 보아요.</h2><p>문양 카드를 한 번 눌러 시작해요.</p></div><div className="tp-pattern-grid">{traditionalPatterns.map(pattern=><button key={pattern.id} type="button" onPointerUp={()=>onChoose(pattern.id)}><img src={pattern.preview} alt={`${pattern.name} 선 그림`}/><strong>{pattern.name}</strong></button>)}</div></section>;
}

export default function TraditionalPatternMaker({home,soundOn,toggleSound}:Props){
  const [selectedId,setSelectedId]=useState<TraditionalPatternId|null>(null);
  const pattern=selectedId?patternById[selectedId]:null;
  const [actions,setActions]=useState<StrokeAction[]>([]);
  const [selectedColor,setSelectedColor]=useState<string>(palette[0][1]);
  const [selectedTool,setSelectedTool]=useState<ColoringTool>('crayon');
  const [brushSize,setBrushSize]=useState(34);
  const [message,setMessage]=useState('마음에 드는 문양을 골라 보세요.');
  const [confirm,setConfirm]=useState<Confirm>(null);
  const [celebrate,setCelebrate]=useState(false);
  const artworkRef=useRef<HTMLCanvasElement>(null);
  const hasColor=useMemo(()=>actions.length>0,[actions]);
  const choose=(id:TraditionalPatternId)=>{const next=patternById[id];stopKoreanSpeech();speakKorean(`${next.name}. ${next.meaning}`,soundOn,.86);setSelectedId(id);setActions([]);setConfirm(null);setMessage(`${next.name}을 골랐어요. 색을 고르고 전자펜이나 손가락으로 색칠해 보세요.`)};
  const undo=()=>{if(!actions.length)return;setActions(values=>values.slice(0,-1));setMessage('방금 그린 획을 되돌렸어요.')};
  const clear=()=>{setActions([]);setConfirm(null);setMessage('색칠한 내용을 모두 지웠어요.')};
  const returnToPicker=()=>{stopKoreanSpeech();setSelectedId(null);setActions([]);setConfirm(null);setMessage('마음에 드는 문양을 골라 보세요.')};
  const askForPicker=()=>hasColor?setConfirm('change'):returnToPicker();
  const save=async()=>{const artwork=artworkRef.current;if(!artwork||!pattern)return;try{const output=document.createElement('canvas');output.width=1200;output.height=1200;const context=output.getContext('2d');if(!context)throw new Error('canvas');context.fillStyle='#fff';context.fillRect(0,0,1200,1200);context.drawImage(artwork,0,0,1200,1200);const lineArt=new Image();lineArt.src=pattern.preview;await lineArt.decode();context.globalCompositeOperation='multiply';context.drawImage(lineArt,0,0,1200,1200);context.globalCompositeOperation='source-over';const png=await new Promise<Blob|null>(resolve=>output.toBlob(resolve,'image/png'));if(!png)throw new Error('png');const url=URL.createObjectURL(png);const link=document.createElement('a');link.href=url;link.download='우리나라_전통문양_색칠작품.png';link.hidden=true;document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1200);setCelebrate(true);setMessage('멋진 전통문양을 완성했어요!');window.setTimeout(()=>setCelebrate(false),1000)}catch{setMessage('저장하지 못했어요. 다시 눌러주세요.')}};
  const activeTool=coloringTools.find(item=>item.id===selectedTool)!;
  const toolPhrase=selectedTool==='crayon'?'크레파스로':selectedTool==='watercolor'?'물감으로':'싸인펜으로';
  return <main className="activity tp-app"><header className="topbar"><HomeIconButton onClick={home}/><div className="activity-title"><span>✿</span><h1>전통문양 색칠하기</h1><span>✿</span></div><SoundIconButton soundOn={soundOn} onClick={toggleSound} className="round-action sound-only"/></header>{!pattern?<PatternPicker onChoose={choose}/>:<section className="tp-coloring"><div className="tp-coloring-heading"><div><h2>{pattern.name}</h2><p className="tp-meaning">🔊 {pattern.meaning}</p><p aria-live="polite">{message}</p></div><Button variant="outline" onPointerUp={askForPicker}>다른 문양 고르기</Button></div><div className="tp-coloring-layout"><section className="tp-canvas-card"><PatternCanvas pattern={pattern} actions={actions} color={selectedColor} tool={selectedTool} size={brushSize} canvasRef={artworkRef} onStroke={action=>{setActions(values=>[...values,action]);setMessage(`${toolPhrase} 직접 색칠했어요.`)}}/></section><aside className="tp-palette"><section className="tp-tools" aria-label="색칠 도구 선택"><h3>무엇으로 칠할까요?</h3><div>{coloringTools.map(item=><button key={item.id} type="button" aria-label={`${item.name} 선택`} aria-pressed={selectedTool===item.id} className={selectedTool===item.id?'active':''} onPointerUp={()=>{setSelectedTool(item.id);setMessage(`${item.name}을 골랐어요. ${item.description}`)}}><span aria-hidden="true">{item.icon}</span><b>{item.name}</b></button>)}</div><p>{activeTool.description}</p><label className="tp-size"><span><b>굵기</b><output>{brushSize<28?'가늘게':brushSize<52?'보통':'굵게'}</output></span><input type="range" min="12" max="72" step="2" value={brushSize} aria-label="색칠 도구 굵기" onChange={event=>setBrushSize(Number(event.target.value))}/><small>가늘게</small><small>굵게</small></label></section><h3>무슨 색으로 칠할까요?</h3><div className="tp-color-grid">{palette.map(([name,value])=><button key={name} type="button" aria-label={`${name} 선택`} aria-pressed={selectedColor===value} className={selectedColor===value?'active':''} onPointerUp={()=>{setSelectedColor(value);setMessage(`${name}을 골랐어요. 전자펜이나 손가락으로 색칠해 보세요.`)}}><span style={{background:value}}>{selectedColor===value?'✓':''}</span><b>{name}</b></button>)}</div></aside></div><div className="tp-actions"><Button variant="outline" onPointerUp={undo} disabled={!actions.length}>되돌리기</Button><Button variant="outline" onPointerUp={()=>setConfirm('clear')} disabled={!hasColor}>모두 지우기</Button><Button variant="outline" onPointerUp={askForPicker}>다른 문양 고르기</Button><Button className="tp-save" onPointerUp={save}>내 문양 저장하기</Button></div></section>}{confirm&&<dialog open className="tp-dialog"><div><h2>{confirm==='clear'?'색칠한 내용을 모두 지울까요?':'다른 문양을 고를까요?'}</h2><div className="tp-confirm"><Button variant="outline" onPointerUp={()=>setConfirm(null)}>계속 색칠하기</Button><Button onPointerUp={confirm==='clear'?clear:returnToPicker}>{confirm==='clear'?'모두 지우기':'다른 문양 고르기'}</Button></div></div></dialog>}{celebrate&&<div className="tp-complete" aria-live="polite"><div>★　✿　★</div><strong>멋진 전통문양을 완성했어요!</strong></div>}</main>;
}
