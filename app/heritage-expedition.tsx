'use client';

import {useEffect,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {setNormalAudioSpeed,speakKorean,stopKoreanSpeech} from './korean-speech';
import {HERITAGE_CLUES,HERITAGE_TREASURES,HeritageTreasure,shuffled} from './heritage-data';
import HomeIconButton from './home-icon-button';
import SoundIconButton from './sound-icon-button';
import {playCelebrationSound,playDingDongDaeng} from './correct-sound';
import './heritage-expedition.css';

type Activity='menu'|'hidden'|'memory-select'|'memory';
type Props={home:()=>void;soundOn:boolean;toggleSound:()=>void};

const playDingDong=playDingDongDaeng;
function newHiddenPlacements(previous:Record<string,number>={}){const used:Array<{x:number;y:number;size:number}>=[];return Object.fromEntries(HERITAGE_TREASURES.map(treasure=>{const candidates=shuffled(treasure.positions.map((point,index)=>({point,index})));const choice=candidates.find(({point,index})=>index!==previous[treasure.id]&&used.every(other=>Math.hypot(point.x-other.x,point.y-other.y)>(treasure.size+other.size)/2+3))||candidates.find(({index})=>index!==previous[treasure.id])||candidates[0];used.push({...choice.point,size:treasure.size});return[treasure.id,choice.index]}))}

function HeritageTop({home,soundOn,toggleSound}:{home:()=>void;soundOn:boolean;toggleSound:()=>void}){
  return <header className="heritage-top"><HomeIconButton onClick={home}/><h1>문화재 탐험대</h1><SoundIconButton soundOn={soundOn} onClick={toggleSound}/></header>;
}

function ExpeditionMenu({open,completed,soundOn}:{open:(value:Activity)=>void;completed:Set<string>;soundOn:boolean}){
  const cards=[
    {id:'hidden' as Activity,title:'숨은 문화재 찾기',copy:'풍경 속 문화재를 자세히 찾아요.',image:'/heritage-items/sungnyemun.png',color:'red'},
    {id:'memory-select' as Activity,title:'문화재 메모리게임',copy:'같은 문화재 그림 두 장을 찾아요.',image:'/heritage-items/dabotap.png',color:'blue'},
  ];
  return <section className="expedition-menu"><div className="expedition-intro"><h2>우리나라 문화재를<br/>찾고 기억해 보아요!</h2></div><div className="expedition-cards">{cards.map((card,index)=><button key={card.id} className={`expedition-card ${card.color}`} onClick={()=>{if(card.id==='hidden')speakKorean(card.title,soundOn);else stopKoreanSpeech();open(card.id)}}><span className="step">{index+1}</span><img src={card.image} alt=""/><strong>{card.title}</strong><small>{card.copy}</small>{completed.has(card.id==='memory-select'?'memory':card.id)&&<b>완료 ✓</b>}</button>)}</div>{completed.size===2&&<div className="expedition-all-done">문화재를 자세히 찾고 모습도 기억했어요!</div>}</section>;
}

function HiddenHeritage({soundOn,onBack,onComplete,onNext}:{soundOn:boolean;onBack:()=>void;onComplete:()=>void;onNext:()=>void}){
  const [found,setFound]=useState<string[]>([]);
  const [message,setMessage]=useState('풍경 속에 숨어 있는 문화재를 찾아보세요!');
  const [focus,setFocus]=useState<string|null>(null);
  const [placements,setPlacements]=useState<Record<string,number>>(()=>newHiddenPlacements());
  const recordedVoice=useRef<HTMLAudioElement|null>(null);
  const complete=found.length===HERITAGE_TREASURES.length;
  useEffect(()=>{if(complete)onComplete()},[complete,onComplete]);
  useEffect(()=>()=>{recordedVoice.current?.pause()},[]);
  useEffect(()=>{if(!soundOn){recordedVoice.current?.pause();recordedVoice.current=null}},[soundOn]);
  const stopRecordedVoice=()=>{recordedVoice.current?.pause();recordedVoice.current=null};
  const find=(treasure:HeritageTreasure)=>{const isNew=!found.includes(treasure.id);if(isNew){setFound(value=>[...value,treasure.id]);playDingDongDaeng(soundOn)}setFocus(treasure.id);setMessage(`${treasure.name}: ${treasure.desc}`);stopKoreanSpeech();stopRecordedVoice();if(soundOn){const audio=setNormalAudioSpeed(new Audio(`/audio/heritage/${treasure.id}.wav`));recordedVoice.current=audio;void audio.play().catch(()=>speakKorean(`${treasure.name}. ${treasure.desc}`,true))}};
  const miss=()=>{stopRecordedVoice();const clue=HERITAGE_CLUES[Math.floor(Math.random()*HERITAGE_CLUES.length)];setFocus(null);setMessage(clue);speakKorean(clue,soundOn)};
  const reset=()=>{stopRecordedVoice();stopKoreanSpeech();setFound([]);setFocus(null);setPlacements(current=>newHiddenPlacements(current));setMessage('문화재의 위치가 자연스러운 장소 안에서 바뀌었어요!')};
  return <section className="expedition-activity hidden-activity"><div className="expedition-heading"><Button variant="outline" onClick={onBack}>← 이전</Button><div><h2>숨은 문화재 찾기</h2><p>문화재가 놓인 자연스러운 장소를 자세히 살펴봐요.</p></div><strong>{found.length} / {HERITAGE_TREASURES.length} 발견</strong></div><div className="hidden-scene" onClick={miss}><img className="hidden-background" src="/heritage-hidden-silla-joseon.png" alt="조선과 신라 시대의 야외 마을, 궁궐, 연못과 고분군 풍경"/>{HERITAGE_TREASURES.map(treasure=>{const point=treasure.positions[placements[treasure.id]??0];const isFound=found.includes(treasure.id);return <button key={treasure.id} className={`hidden-target hidden-${treasure.id} ${isFound?'found':''} ${focus===treasure.id?'focused':''}`} style={{left:`${point.x}%`,top:`${point.y}%`,width:`${treasure.size}%`}} onClick={event=>{event.stopPropagation();find(treasure)}} aria-label={`${treasure.name} 찾기`}><img src={treasure.image} alt=""/>{isFound&&<span>✓</span>}</button>})}{complete&&<div className="heritage-finish" onClick={event=>event.stopPropagation()}><h2>숨은 문화재를 모두 찾았어요!</h2><div><Button onClick={reset}>위치를 바꾸어 다시 찾기</Button><Button onClick={onNext}>다음 활동으로</Button><Button variant="outline" onClick={onBack}>활동 선택</Button></div></div>}</div><div className="heritage-feedback" aria-live="polite">{message}</div><div className="heritage-strip">{HERITAGE_TREASURES.map(treasure=><article key={treasure.id} className={`${found.includes(treasure.id)?'found ':''}strip-${treasure.id}`}><img src={treasure.image} alt={treasure.name}/><b>{treasure.name}</b>{found.includes(treasure.id)&&<span>✓</span>}</article>)}</div></section>;
}

type MemoryCard={key:string;treasure:HeritageTreasure|null;bonus?:boolean};
function makeDeck(count:number){const cards:MemoryCard[]=shuffled(HERITAGE_TREASURES).slice(0,count).flatMap(treasure=>[{key:`${treasure.id}-a`,treasure},{key:`${treasure.id}-b`,treasure}]);const mixed=shuffled(cards);if(count===12)mixed.splice(12,0,{key:'center-bonus',treasure:null,bonus:true});return mixed}
function makeDifferentDeck(count:number,current:MemoryCard[]){
  const currentOrder=current.map(card=>card.key).join('|');
  let next=makeDeck(count);
  if(next.map(card=>card.key).join('|')===currentOrder&&next.length>1) next=[...next.slice(1),next[0]];
  return next;
}
function MemoryGame({count,soundOn,onBack,onComplete,onNext}:{count:number;soundOn:boolean;onBack:()=>void;onComplete:()=>void;onNext:()=>void}){
  const [deck,setDeck]=useState<MemoryCard[]>(()=>makeDeck(count));
  const [open,setOpen]=useState<string[]>([]);
  const [matched,setMatched]=useState<string[]>([]);
  const [locked,setLocked]=useState(false);
  const [hinting,setHinting]=useState(false);
  const [message,setMessage]=useState('카드 두 장을 눌러 같은 문화재를 찾아보세요!');
  const celebrated=useRef(false);
  const complete=matched.length===count;
  useEffect(()=>{stopKoreanSpeech();return stopKoreanSpeech},[]);
  useEffect(()=>{if(!complete||celebrated.current)return;celebrated.current=true;playCelebrationSound(soundOn);onComplete()},[complete,onComplete,soundOn]);
  const choose=(card:MemoryCard)=>{if(!card.treasure||locked||hinting||open.includes(card.key)||matched.includes(card.treasure.id))return;const next=[...open,card.key];setOpen(next);if(next.length<2)return;setLocked(true);const first=deck.find(value=>value.key===next[0])!;if(first.treasure?.id===card.treasure.id){window.setTimeout(()=>{const isFinalPair=matched.length+1===count;setMatched(value=>[...value,card.treasure!.id]);if(!isFinalPair)playDingDong(soundOn);setOpen([]);setLocked(false);setMessage(isFinalPair?'문화재 짝을 모두 찾았어요!':`같은 문화재를 찾았어요! ${card.treasure!.name}`)},450)}else{setMessage('두 모습을 천천히 비교해 보세요.');window.setTimeout(()=>{setOpen([]);setLocked(false)},1500)}};
  const hint=()=>{if(locked||hinting)return;setHinting(true);setLocked(true);setMessage('모든 문화재의 자리를 2초 동안 살펴봐요.');window.setTimeout(()=>{setHinting(false);setLocked(false)},2000)};
  const restart=()=>{celebrated.current=false;setDeck(current=>makeDifferentDeck(count,current));setOpen([]);setMatched([]);setLocked(false);setHinting(false);setMessage('카드의 자리가 새롭게 섞였어요!')};
  const levelText=count===6?'쉬움 · 6종 12장':count===8?'도전 · 8종 16장':'한 단계 더 · 12종 25장';
  return <section className="expedition-activity memory-activity"><div className="expedition-heading"><Button variant="outline" onClick={onBack}>← 이전</Button><div><h2>문화재 메모리게임</h2><p>{levelText}</p></div><strong>{matched.length} / {count} 짝</strong></div><div className={`memory-grid cards-${deck.length}`}>{deck.map(card=>{const visible=!!card.bonus||hinting||open.includes(card.key)||!!card.treasure&&matched.includes(card.treasure.id);const isMatched=!!card.bonus||!!card.treasure&&matched.includes(card.treasure.id);return <button key={card.key} className={`memory-card ${card.treasure?`memory-${card.treasure.id}`:'memory-bonus'} ${visible?'open':''} ${isMatched?'matched':''}`} disabled={!!card.bonus||(locked&&!open.includes(card.key))} onClick={()=>choose(card)} aria-label={card.bonus?'가운데 행운 카드':visible?card.treasure!.name:'뒤집힌 문화재 카드'}><span className="memory-inner"><span className="memory-back"><i/><b>문화재</b></span><span className="memory-front">{card.bonus?<><span className="memory-bonus-mark">★</span><b>행운 카드</b></>:<img src={card.treasure!.image} alt={visible?card.treasure!.name:''}/>}</span></span></button>})}</div><div className="memory-actions"><Button onClick={hint} disabled={locked}>힌트 보기</Button><Button variant="outline" onClick={restart}>다시 하기</Button></div><div className="heritage-feedback" aria-live="polite">{message}</div>{complete&&<div className="memory-complete-backdrop"><div className="activity-complete" role="dialog" aria-modal="true" aria-labelledby="memory-complete-title"><div className="memory-celebration" aria-hidden="true"><span>★</span><span>✿</span><span>★</span><span>✿</span><span>★</span></div><strong className="memory-complete-badge">참 잘했어요!</strong><h2 id="memory-complete-title">문화재의 모습을 기억해<br/>짝을 모두 찾았어요!</h2><Button autoFocus onClick={onNext}>{count===8?'25장 다음 도전 →':'활동 선택으로'}</Button></div></div>}</section>;
}

function MemorySelect({onBack,start}:{onBack:()=>void;start:(count:number)=>void}){
  return <section className="expedition-activity"><div className="expedition-heading"><Button variant="outline" onClick={onBack}>← 이전</Button><div><h2>문화재 메모리게임</h2><p>카드 수를 골라요.</p></div></div><div className="memory-levels"><button onClick={()=>start(6)}><img src="/heritage-items/cheomseongdae.png" alt=""/><strong>쉬움</strong><b>6종 · 12장</b><small>3행 × 4열</small></button><button onClick={()=>start(8)}><img src="/heritage-items/seokgatap.png" alt=""/><strong>도전</strong><b>8종 · 16장</b><small>4행 × 4열</small></button><button onClick={()=>start(12)}><img src="/heritage-items/silla-crown.png" alt=""/><strong>한 단계 더</strong><b>12종 · 25장</b><small>5행 × 5열 · 가운데 행운 카드</small></button></div></section>;
}

export default function HeritageExpedition({home,soundOn,toggleSound}:Props){
  const [activity,setActivity]=useState<Activity>('menu');
  const [memoryCount,setMemoryCount]=useState(6);
  const [completed,setCompleted]=useState<Set<string>>(()=>new Set());
  const complete=(id:string)=>setCompleted(value=>{if(value.has(id))return value;const next=new Set(value);next.add(id);return next});
  const back=()=>{stopKoreanSpeech();setActivity('menu')};
  return <main className="activity heritage-expedition"><HeritageTop home={home} soundOn={soundOn} toggleSound={toggleSound}/>{activity==='menu'&&<ExpeditionMenu open={setActivity} completed={completed} soundOn={soundOn}/>} {activity==='hidden'&&<HiddenHeritage soundOn={soundOn} onBack={back} onComplete={()=>complete('hidden')} onNext={()=>setActivity('memory-select')}/>} {activity==='memory-select'&&<MemorySelect onBack={back} start={count=>{setMemoryCount(count);setActivity('memory')}}/>} {activity==='memory'&&<MemoryGame key={memoryCount} count={memoryCount} soundOn={soundOn} onBack={()=>setActivity('memory-select')} onComplete={()=>complete('memory')} onNext={()=>{if(memoryCount===8)setMemoryCount(12);else back()}}/>}</main>;
}
