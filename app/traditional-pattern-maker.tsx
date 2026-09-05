'use client';

import {useMemo,useState} from 'react';
import {Button} from '@/components/ui/button';
import HomeIconButton from './home-icon-button';
import SoundIconButton from './sound-icon-button';
import {patternById,traditionalPatterns,type TraditionalPattern,type TraditionalPatternId} from './traditional-pattern-data';
import './traditional-pattern-maker.css';

type Props={home:()=>void;soundOn:boolean;toggleSound:()=>void};
type Confirm='clear'|'change'|null;
type RegionColors=Record<string,string>;

const WHITE='#fffef9';
const palette=[
  ['빨강','#e7473c'],['주황','#ed8b32'],['노랑','#f2bd37'],['연두','#91c957'],['초록','#318b61'],['민트','#74d2b6'],
  ['청록','#198f91'],['하늘','#67b9df'],['파랑','#2878b8'],['남색','#263f78'],['보라','#79538c'],['연보라','#aa86c5'],
  ['분홍','#e879a9'],['진분홍','#c74378'],['갈색','#8a5a36'],['회색','#8b929b'],['검정','#232a35'],['흰색',WHITE],
] as const;

const emptyColors=(pattern:TraditionalPattern):RegionColors=>Object.fromEntries(pattern.regions.map(region=>[region.id,WHITE]));

function PatternSvg({pattern,colors,interactive=false,onFill}:{pattern:TraditionalPattern;colors:RegionColors;interactive?:boolean;onFill?:(regionId:string)=>void}){
  return <svg className="tp-coloring-svg" viewBox="0 0 100 100" role={interactive?'img':undefined} aria-label={interactive?`${pattern.name} 색칠 그림`:undefined} aria-hidden={interactive?undefined:true}>
    {pattern.regions.map(region=><path key={region.id} data-region-id={region.id} d={region.path} fill={colors[region.id]??WHITE} stroke="#232a35" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" pointerEvents={interactive?'visibleFill':'none'} onPointerUp={event=>{if(!interactive||!onFill)return;event.preventDefault();event.stopPropagation();onFill(region.id)}}/>)}
  </svg>;
}

function PatternPicker({onChoose}:{onChoose:(id:TraditionalPatternId)=>void}){
  return <section className="tp-picker">
    <div className="tp-heading"><h2>마음에 드는 전통문양을 골라 아름다운 색으로 꾸며 보아요.</h2><p>문양 카드를 한 번 눌러 시작해요.</p></div>
    <div className="tp-pattern-grid">{traditionalPatterns.map(pattern=><button key={pattern.id} type="button" onPointerUp={()=>onChoose(pattern.id)}><img src={pattern.preview} alt={`${pattern.name} 선 그림`}/><strong>{pattern.name}</strong></button>)}</div>
  </section>;
}

export default function TraditionalPatternMaker({home,soundOn,toggleSound}:Props){
  const [selectedId,setSelectedId]=useState<TraditionalPatternId|null>(null);
  const pattern=selectedId?patternById[selectedId]:null;
  const [colors,setColors]=useState<RegionColors>({});
  const [history,setHistory]=useState<RegionColors[]>([]);
  const [selectedColor,setSelectedColor]=useState<string>(palette[0][1]);
  const [message,setMessage]=useState('마음에 드는 문양을 골라 보세요.');
  const [confirm,setConfirm]=useState<Confirm>(null);
  const [celebrate,setCelebrate]=useState(false);
  const hasColor=useMemo(()=>Object.values(colors).some(value=>value!==WHITE),[colors]);

  const choose=(id:TraditionalPatternId)=>{
    const next=patternById[id];
    setSelectedId(id);setColors(emptyColors(next));setHistory([]);setConfirm(null);
    setMessage(`${next.name}을 골랐어요. 색을 고르고 칠할 곳을 눌러 보세요.`);
  };
  const fill=(regionId:string)=>{
    if(!pattern||colors[regionId]===selectedColor)return;
    setHistory(previous=>[...previous,colors]);
    setColors(previous=>({...previous,[regionId]:selectedColor}));
    setMessage(`${palette.find(([,value])=>value===selectedColor)?.[0]??'고른 색'}으로 한 곳을 칠했어요.`);
  };
  const undo=()=>{
    const previous=history.at(-1);if(!previous)return;
    setColors(previous);setHistory(values=>values.slice(0,-1));setMessage('방금 칠한 곳을 되돌렸어요.');
  };
  const clear=()=>{
    if(!pattern)return;
    setColors(emptyColors(pattern));setHistory([]);setConfirm(null);setMessage('색칠한 내용을 모두 지웠어요.');
  };
  const returnToPicker=()=>{setSelectedId(null);setColors({});setHistory([]);setConfirm(null);setMessage('마음에 드는 문양을 골라 보세요.')};
  const askForPicker=()=>hasColor?setConfirm('change'):returnToPicker();
  const exportSvg=()=>{
    if(!pattern)return'';
    const paths=pattern.regions.map(region=>`<path d="${region.path}" fill="${colors[region.id]??WHITE}" stroke="#232a35" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round"/>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 100 100"><rect width="100" height="100" fill="#fff"/>${paths}</svg>`;
  };
  const save=async()=>{
    if(!pattern)return;
    try{
      const blob=new Blob([exportSvg()],{type:'image/svg+xml'});const source=URL.createObjectURL(blob);const image=new Image();
      await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error('image'));image.src=source});
      const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1200;const context=canvas.getContext('2d');if(!context)throw new Error('canvas');
      context.fillStyle='#fff';context.fillRect(0,0,1200,1200);context.drawImage(image,0,0,1200,1200);URL.revokeObjectURL(source);
      const png=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/png'));if(!png)throw new Error('png');
      const url=URL.createObjectURL(png);const link=document.createElement('a');link.href=url;link.download='우리나라_전통문양_색칠작품.png';link.hidden=true;document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1200);
      setCelebrate(true);setMessage('멋진 전통문양을 완성했어요!');window.setTimeout(()=>setCelebrate(false),1000);
    }catch{setMessage('저장하지 못했어요. 다시 눌러주세요.')}
  };

  return <main className="activity tp-app">
    <header className="topbar"><HomeIconButton onClick={home}/><div className="activity-title"><span>✿</span><h1>전통문양 색칠하기</h1><span>✿</span></div><SoundIconButton soundOn={soundOn} onClick={toggleSound} className="round-action sound-only"/></header>
    {!pattern?<PatternPicker onChoose={choose}/>:<section className="tp-coloring">
      <div className="tp-coloring-heading"><div><h2>{pattern.name}</h2><p aria-live="polite">{message}</p></div><Button variant="outline" onPointerUp={askForPicker}>다른 문양 고르기</Button></div>
      <div className="tp-coloring-layout"><section className="tp-canvas-card"><PatternSvg pattern={pattern} colors={colors} interactive onFill={fill}/></section><aside className="tp-palette"><h3>무슨 색으로 칠할까요?</h3><div>{palette.map(([name,value])=><button key={name} type="button" aria-label={`${name} 선택`} aria-pressed={selectedColor===value} className={selectedColor===value?'active':''} onPointerUp={()=>{setSelectedColor(value);setMessage(`${name}을 골랐어요. 칠할 곳을 눌러 보세요.`)}}><span style={{background:value}}>{selectedColor===value?'✓':''}</span><b>{name}</b></button>)}</div></aside></div>
      <div className="tp-actions"><Button variant="outline" onPointerUp={undo} disabled={!history.length}>되돌리기</Button><Button variant="outline" onPointerUp={()=>setConfirm('clear')} disabled={!hasColor}>모두 지우기</Button><Button variant="outline" onPointerUp={askForPicker}>다른 문양 고르기</Button><Button className="tp-save" onPointerUp={save}>내 문양 저장하기</Button></div>
    </section>}
    {confirm&&<dialog open className="tp-dialog"><div><h2>{confirm==='clear'?'색칠한 내용을 모두 지울까요?':'다른 문양을 고를까요?'}</h2><div className="tp-confirm"><Button variant="outline" onPointerUp={()=>setConfirm(null)}>계속 색칠하기</Button><Button onPointerUp={confirm==='clear'?clear:returnToPicker}>{confirm==='clear'?'모두 지우기':'다른 문양 고르기'}</Button></div></div></dialog>}
    {celebrate&&<div className="tp-complete" aria-live="polite"><div>★　✿　★</div><strong>멋진 전통문양을 완성했어요!</strong></div>}
  </main>;
}
