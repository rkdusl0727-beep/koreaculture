'use client';

import {useEffect,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {speakKorean,stopKoreanSpeech} from './korean-speech';
import {HERITAGE_CLUES,HERITAGE_TREASURES,HeritageTreasure,shuffled} from './heritage-data';
import './heritage-expedition.css';

type Activity='menu'|'hidden'|'memory-select'|'memory'|'words';
type Props={home:()=>void;soundOn:boolean;toggleSound:()=>void};

function HeritageTop({home,soundOn,toggleSound}:{home:()=>void;soundOn:boolean;toggleSound:()=>void}){
  return <header className="heritage-top"><Button variant="outline" onClick={home}>처음으로</Button><h1>문화재 탐험대</h1><Button variant="outline" onClick={toggleSound}>{soundOn?'소리 켬':'소리 끔'}</Button></header>;
}

function ActivityStatus({completed}:{completed:Set<string>}){
  const activities=[['hidden','찾기'],['memory','기억'],['words','이름']];
  return <div className="heritage-progress" aria-label="활동 완료표시">{activities.map(([id,label])=><span key={id} className={completed.has(id)?'done':''}>{completed.has(id)?'✓ ':''}{label}</span>)}</div>;
}

function ExpeditionMenu({open,completed}:{open:(value:Activity)=>void;completed:Set<string>}){
  const cards=[
    {id:'hidden' as Activity,title:'꼭꼭 숨은 문화재',copy:'풍경 속 문화재를 자세히 찾아요.',image:'/heritage-items/sungnyemun.png',color:'red'},
    {id:'memory-select' as Activity,title:'문화재 기억 짝꿍',copy:'같은 문화재 그림 두 장을 찾아요.',image:'/heritage-items/dabotap.png',color:'blue'},
    {id:'words' as Activity,title:'문화재 이름 맞히기',copy:'그림과 알맞은 이름을 연결해요.',image:'/heritage-items/silla-crown.png',color:'green'},
  ];
  return <section className="expedition-menu"><div className="expedition-intro"><p>찾고 · 기억하고 · 이름도 맞혀요</p><h2>문화재를 찾고, 기억하고,<br/>이름도 맞혀 보아요!</h2><ActivityStatus completed={completed}/></div><div className="expedition-cards">{cards.map((card,index)=><button key={card.id} className={`expedition-card ${card.color}`} onClick={()=>open(card.id)}><span className="step">{index+1}</span><img src={card.image} alt=""/><strong>{card.title}</strong><small>{card.copy}</small>{completed.has(card.id==='memory-select'?'memory':card.id)&&<b>완료 ✓</b>}</button>)}</div>{completed.size===3&&<div className="expedition-all-done">문화재의 모습과 이름을 자세히 알게 되었어요!</div>}</section>;
}

function HiddenHeritage({soundOn,onBack,onComplete,onNext}:{soundOn:boolean;onBack:()=>void;onComplete:()=>void;onNext:()=>void}){
  const [found,setFound]=useState<string[]>([]);
  const [message,setMessage]=useState('풍경 속에 숨어 있는 문화재를 찾아보세요!');
  const [focus,setFocus]=useState<string|null>(null);
  const [round,setRound]=useState(0);
  const complete=found.length===HERITAGE_TREASURES.length;
  useEffect(()=>{if(complete)onComplete()},[complete,onComplete]);
  const find=(treasure:HeritageTreasure)=>{if(!found.includes(treasure.id))setFound(value=>[...value,treasure.id]);setFocus(treasure.id);setMessage(`${treasure.name}: ${treasure.desc}`);speakKorean(`${treasure.name}. ${treasure.desc}`,soundOn)};
  const miss=()=>{const clue=HERITAGE_CLUES[Math.floor(Math.random()*HERITAGE_CLUES.length)];setFocus(null);setMessage(clue);speakKorean(clue,soundOn)};
  const reset=()=>{setFound([]);setFocus(null);setRound(value=>value+1);setMessage('문화재의 위치가 자연스러운 장소 안에서 바뀌었어요!')};
  return <section className="expedition-activity hidden-activity"><div className="expedition-heading"><Button variant="outline" onClick={onBack}>← 이전</Button><div><h2>꼭꼭 숨은 문화재</h2><p>문화재가 놓인 자연스러운 장소를 자세히 살펴봐요.</p></div><strong>{found.length} / {HERITAGE_TREASURES.length} 발견</strong></div><div className="hidden-scene" onClick={miss}><img className="hidden-background" src="/heritage-hidden-silla-joseon.png" alt="조선과 신라 시대의 야외 마을, 궁궐, 연못과 고분군 풍경"/>{HERITAGE_TREASURES.map((treasure,index)=>{const point=treasure.positions[(round+index)%treasure.positions.length];const isFound=found.includes(treasure.id);return <button key={treasure.id} className={`hidden-target ${isFound?'found':''} ${focus===treasure.id?'focused':''}`} style={{left:`${point.x}%`,top:`${point.y}%`,width:`${treasure.size}%`}} onClick={event=>{event.stopPropagation();find(treasure)}} aria-label={`${treasure.name} 찾기`}><img src={treasure.image} alt=""/>{isFound&&<span>✓</span>}</button>})}{complete&&<div className="heritage-finish" onClick={event=>event.stopPropagation()}><h2>숨은 문화재를 모두 찾았어요!</h2><div><Button onClick={reset}>위치를 바꾸어 다시 찾기</Button><Button onClick={onNext}>다음 활동으로</Button><Button variant="outline" onClick={onBack}>처음으로</Button></div></div>}</div><div className="heritage-feedback" aria-live="polite">{message}</div><div className="heritage-strip">{HERITAGE_TREASURES.map(treasure=><article key={treasure.id} className={found.includes(treasure.id)?'found':''}><img src={treasure.image} alt={treasure.name}/><b>{treasure.name}</b>{found.includes(treasure.id)&&<span>✓</span>}</article>)}</div></section>;
}

type MemoryCard={key:string;treasure:HeritageTreasure};
function makeDeck(count:number){return shuffled(shuffled(HERITAGE_TREASURES).slice(0,count).flatMap(treasure=>[{key:`${treasure.id}-a`,treasure},{key:`${treasure.id}-b`,treasure}]))}
function MemoryGame({count,soundOn,onBack,onComplete,onNext}:{count:number;soundOn:boolean;onBack:()=>void;onComplete:()=>void;onNext:()=>void}){
  const [deck,setDeck]=useState<MemoryCard[]>(()=>makeDeck(count));
  const [open,setOpen]=useState<string[]>([]);
  const [matched,setMatched]=useState<string[]>([]);
  const [locked,setLocked]=useState(false);
  const [hinting,setHinting]=useState(false);
  const [message,setMessage]=useState('카드 두 장을 눌러 같은 문화재를 찾아보세요!');
  const complete=matched.length===count;
  useEffect(()=>{if(complete)onComplete()},[complete,onComplete]);
  const choose=(card:MemoryCard)=>{if(locked||hinting||open.includes(card.key)||matched.includes(card.treasure.id))return;const next=[...open,card.key];setOpen(next);if(next.length<2)return;setLocked(true);const first=deck.find(value=>value.key===next[0])!;if(first.treasure.id===card.treasure.id){window.setTimeout(()=>{setMatched(value=>[...value,card.treasure.id]);setOpen([]);setLocked(false);setMessage(`같은 문화재를 찾았어요! ${card.treasure.name}! ${card.treasure.desc}`);speakKorean(`같은 문화재를 찾았어요! ${card.treasure.name}! ${card.treasure.desc}`,soundOn)},450)}else{setMessage('두 모습을 천천히 비교해 보세요.');window.setTimeout(()=>{setOpen([]);setLocked(false)},1500)}};
  const hint=()=>{if(locked||hinting)return;setHinting(true);setLocked(true);setMessage('모든 문화재의 자리를 2초 동안 살펴봐요.');window.setTimeout(()=>{setHinting(false);setLocked(false)},2000)};
  const restart=()=>{setDeck(makeDeck(count));setOpen([]);setMatched([]);setLocked(false);setHinting(false);setMessage('카드의 자리가 새롭게 섞였어요!')};
  return <section className="expedition-activity memory-activity"><div className="expedition-heading"><Button variant="outline" onClick={onBack}>← 이전</Button><div><h2>문화재 기억 짝꿍</h2><p>{count===4?'쉬움 · 4종 8장':'도전 · 6종 12장'}</p></div><strong>{matched.length} / {count} 짝</strong></div><div className={`memory-grid cards-${count*2}`}>{deck.map(card=>{const visible=hinting||open.includes(card.key)||matched.includes(card.treasure.id);return <button key={card.key} className={`memory-card ${visible?'open':''} ${matched.includes(card.treasure.id)?'matched':''}`} disabled={locked&&!open.includes(card.key)} onClick={()=>choose(card)} aria-label={visible?card.treasure.name:'뒤집힌 문화재 카드'}><span className="memory-inner"><span className="memory-back"><i/><b>문화재</b></span><span className="memory-front"><img src={card.treasure.image} alt={visible?card.treasure.name:''}/></span></span></button>})}</div><div className="memory-actions"><Button onClick={hint} disabled={locked}>힌트 보기</Button><Button variant="outline" onClick={restart}>다시 하기</Button></div><div className="heritage-feedback" aria-live="polite">{message}</div>{complete&&<div className="activity-complete"><h2>문화재의 모습을 기억해 짝을 모두 찾았어요!</h2><Button onClick={onNext}>다음 활동으로</Button></div>}</section>;
}

function MemorySelect({onBack,start}:{onBack:()=>void;start:(count:number)=>void}){
  return <section className="expedition-activity"><div className="expedition-heading"><Button variant="outline" onClick={onBack}>← 이전</Button><div><h2>문화재 기억 짝꿍</h2><p>카드 수를 골라요.</p></div></div><div className="memory-levels"><button onClick={()=>start(4)}><img src="/heritage-items/cheomseongdae.png" alt=""/><strong>쉬움</strong><b>4종 · 8장</b><small>2행 × 4열</small></button><button onClick={()=>start(6)}><img src="/heritage-items/seokgatap.png" alt=""/><strong>도전</strong><b>6종 · 12장</b><small>3행 × 4열</small></button></div></section>;
}

function WordMatch({soundOn,onBack,onComplete}:{soundOn:boolean;onBack:()=>void;onComplete:()=>void}){
  const [questions,setQuestions]=useState(()=>shuffled(HERITAGE_TREASURES));
  const [index,setIndex]=useState(0);
  const [choices,setChoices]=useState<HeritageTreasure[]>([]);
  const [selected,setSelected]=useState<string|null>(null);
  const [dragging,setDragging]=useState<string|null>(null);
  const [dragPoint,setDragPoint]=useState<{x:number;y:number}|null>(null);
  const [answered,setAnswered]=useState(false);
  const [revealed,setRevealed]=useState(false);
  const [message,setMessage]=useState('그림을 보고 알맞은 이름을 골라요.');
  const [pen,setPen]=useState<string|null>(null);
  const [lineWidth,setLineWidth]=useState(6);
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const dropRef=useRef<HTMLButtonElement>(null);
  const drawing=useRef(false);
  const previousPoint=useRef<{x:number;y:number}|null>(null);
  const current=questions[index];
  const finished=index>=questions.length;
  const clearCanvas=()=>{const canvas=canvasRef.current;canvas?.getContext('2d')?.clearRect(0,0,canvas.width,canvas.height)};
  useEffect(()=>{if(!current)return;setChoices(shuffled([current,...shuffled(HERITAGE_TREASURES.filter(value=>value.id!==current.id)).slice(0,2)]));setSelected(null);setDragging(null);setAnswered(false);setRevealed(false);setMessage('그림을 보고 알맞은 이름을 골라요.');clearCanvas()},[current]);
  useEffect(()=>{const resize=()=>{const canvas=canvasRef.current;if(!canvas)return;const rect=canvas.getBoundingClientRect();canvas.width=Math.max(1,Math.round(rect.width*window.devicePixelRatio));canvas.height=Math.max(1,Math.round(rect.height*window.devicePixelRatio))};resize();window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize)},[index]);
  useEffect(()=>{if(finished)onComplete()},[finished,onComplete]);
  const answer=(id:string)=>{const picked=HERITAGE_TREASURES.find(value=>value.id===id)!;speakKorean(picked.name,soundOn);if(id===current.id){setAnswered(true);setRevealed(true);setSelected(null);setMessage(`${current.name}: ${current.desc}`);speakKorean(`${current.name}. ${current.desc}`,soundOn)}else{setSelected(null);setMessage(current.desc);speakKorean(current.desc,soundOn)}};
  const drop=()=>{if(selected)answer(selected)};
  const startDrag=(id:string,event:React.PointerEvent)=>{setSelected(id);setDragging(id);setDragPoint({x:event.clientX,y:event.clientY-58});event.currentTarget.setPointerCapture(event.pointerId);event.preventDefault();speakKorean(HERITAGE_TREASURES.find(value=>value.id===id)!.name,soundOn)};
  const moveDrag=(event:React.PointerEvent)=>{if(dragging)setDragPoint({x:event.clientX,y:event.clientY-58})};
  const endDrag=(event:React.PointerEvent)=>{if(!dragging)return;const rect=dropRef.current?.getBoundingClientRect();if(rect&&event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom)answer(dragging);setDragging(null);setDragPoint(null)};
  const canvasPoint=(event:React.PointerEvent<HTMLCanvasElement>)=>{const rect=event.currentTarget.getBoundingClientRect();return{x:(event.clientX-rect.left)*event.currentTarget.width/rect.width,y:(event.clientY-rect.top)*event.currentTarget.height/rect.height}};
  const drawStart=(event:React.PointerEvent<HTMLCanvasElement>)=>{if(!pen)return;drawing.current=true;previousPoint.current=canvasPoint(event);event.currentTarget.setPointerCapture(event.pointerId);event.preventDefault()};
  const drawMove=(event:React.PointerEvent<HTMLCanvasElement>)=>{if(!drawing.current||!pen||!previousPoint.current)return;const canvas=event.currentTarget;const context=canvas.getContext('2d');if(!context)return;const point=canvasPoint(event);context.globalCompositeOperation=pen==='eraser'?'destination-out':'source-over';context.strokeStyle=pen==='eraser'?'rgba(0,0,0,1)':pen;context.lineWidth=lineWidth*window.devicePixelRatio;context.lineCap='round';context.lineJoin='round';context.beginPath();context.moveTo(previousPoint.current.x,previousPoint.current.y);context.lineTo(point.x,point.y);context.stroke();previousPoint.current=point;event.preventDefault()};
  const drawEnd=()=>{drawing.current=false;previousPoint.current=null};
  const next=()=>{clearCanvas();if(index===questions.length-1)setIndex(questions.length);else setIndex(value=>value+1)};
  const restart=()=>{setQuestions(shuffled(HERITAGE_TREASURES));setIndex(0);clearCanvas()};
  if(finished)return <section className="expedition-activity word-finish"><h2>문화재의 그림과 이름을 바르게 연결했어요!</h2><p>문화재의 모습과 이름을 자세히 알게 되었어요!</p><div><Button onClick={restart}>다시 하기</Button><Button variant="outline" onClick={onBack}>활동 선택</Button></div></section>;
  return <section className="expedition-activity word-activity" onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}><div className="expedition-heading"><Button variant="outline" onClick={onBack}>← 이전</Button><div><h2>문화재 이름 맞히기</h2><p>{index+1} / {questions.length} · 그림과 이름을 연결해요.</p></div><strong>전자칠판 모드</strong></div><div className="word-layout"><div className="word-picture"><img src={current.image} alt={`${current.name} 문화재 그림`}/><canvas ref={canvasRef} className={pen?'pen-active':''} onPointerDown={drawStart} onPointerMove={drawMove} onPointerUp={drawEnd} onPointerCancel={drawEnd}/></div><button ref={dropRef} className={`name-drop ${answered?'correct':''}`} onClick={drop}>{revealed||answered?current.name:selected?'여기에 붙이기':'이름표를 붙여요'}</button><div className="word-cards">{choices.map(choice=><button key={choice.id} className={selected===choice.id?'selected':''} onPointerDown={event=>startDrag(choice.id,event)} onClick={()=>{setSelected(choice.id);speakKorean(choice.name,soundOn)}} disabled={answered}>{choice.name}</button>)}</div>{dragging&&dragPoint&&<div className="word-drag-ghost" style={{left:dragPoint.x,top:dragPoint.y}}>{HERITAGE_TREASURES.find(value=>value.id===dragging)?.name}</div>}</div><div className="board-tools"><Button onClick={()=>setMessage(current.desc)}>단서 보기</Button><Button onClick={()=>speakKorean(current.name,soundOn)}>이름 듣기</Button><Button onClick={()=>setRevealed(true)}>정답 보기</Button><Button onClick={next}>다음 문제</Button><span className="tool-divider"/><button className={pen==='#e9473f'?'active':''} onClick={()=>setPen('#e9473f')} aria-label="빨강 펜" style={{background:'#e9473f'}}/><button className={pen==='#2878b8'?'active':''} onClick={()=>setPen('#2878b8')} aria-label="파랑 펜" style={{background:'#2878b8'}}/><button className={pen==='#2f8f62'?'active':''} onClick={()=>setPen('#2f8f62')} aria-label="초록 펜" style={{background:'#2f8f62'}}/><button className={pen==='#232a35'?'active':''} onClick={()=>setPen('#232a35')} aria-label="검정 펜" style={{background:'#232a35'}}/><label>굵기 <select value={lineWidth} onChange={event=>setLineWidth(Number(event.target.value))}><option value="4">얇게</option><option value="8">보통</option><option value="14">굵게</option></select></label><Button variant="outline" onClick={()=>setPen('eraser')}>지우개</Button><Button variant="outline" onClick={clearCanvas}>전체 지우기</Button></div><div className="heritage-feedback" aria-live="polite">{message}</div>{answered&&<div className="answer-panel"><img src={current.image} alt=""/><div><b>{current.name}</b><p>{current.desc}</p></div><Button onClick={next}>다음 문화재 →</Button></div>}</section>;
}

export default function HeritageExpedition({home,soundOn,toggleSound}:Props){
  const [activity,setActivity]=useState<Activity>('menu');
  const [memoryCount,setMemoryCount]=useState(4);
  const [completed,setCompleted]=useState<Set<string>>(()=>new Set());
  const complete=(id:string)=>setCompleted(value=>{if(value.has(id))return value;const next=new Set(value);next.add(id);return next});
  const back=()=>{stopKoreanSpeech();setActivity('menu')};
  return <main className="activity heritage-expedition"><HeritageTop home={home} soundOn={soundOn} toggleSound={toggleSound}/>{activity==='menu'&&<ExpeditionMenu open={setActivity} completed={completed}/>} {activity==='hidden'&&<HiddenHeritage soundOn={soundOn} onBack={back} onComplete={()=>complete('hidden')} onNext={()=>setActivity('memory-select')}/>} {activity==='memory-select'&&<MemorySelect onBack={back} start={count=>{setMemoryCount(count);setActivity('memory')}}/>} {activity==='memory'&&<MemoryGame count={memoryCount} soundOn={soundOn} onBack={()=>setActivity('memory-select')} onComplete={()=>complete('memory')} onNext={()=>setActivity('words')}/>} {activity==='words'&&<WordMatch soundOn={soundOn} onBack={back} onComplete={()=>complete('words')}/>}</main>;
}
