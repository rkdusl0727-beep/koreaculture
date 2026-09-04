'use client';

import {useEffect,useMemo,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {playFootPronunciation,speakKorean,stopKoreanSpeech} from './korean-speech';
import HomeIconButton from './home-icon-button';
import SoundIconButton from './sound-icon-button';
import {playDingDongDaeng} from './correct-sound';
import {getHanbokFit} from './hanbok-fit';
import './hanbok-studio.css';

type Props={home:()=>void;soundOn:boolean;toggleSound:()=>void};
type Mode='start'|'design'|'quiz';
type CharacterKind=0|1;
type PartName='저고리'|'치마'|'바지'|'두루마기'|'버선'|'꽃신'|'노리개';
type Category=PartName|'장신구';
type Slot='socks'|'bottom'|'top'|'coat'|'shoes'|'ornament'|'hair';
type Garment={id:string;name:string;slot:Slot;img:string;label:string};
type Outfit=Partial<Record<Slot,Garment>>;

const root='/hanbok-studio/garments/';
const make=(name:PartName,count:number,slot:Slot,file:string,available=count):Garment[]=>Array.from({length:count},(_,i)=>({id:`${file}-${i+1}`,name,slot,img:`${root}${file}-${i%available+1}.png`,label:`${name} ${i+1}`}));
const girlJeogori=make('저고리',6,'top','jeogori');
const boyJeogori:Array<Garment>=make('저고리',6,'top','jeogori').map((item,i)=>i===0?{...item,id:'jeogori-boy-v1',img:root+'jeogori-boy-v1.png',label:'남자 저고리 1'}:{...item,label:`남자 저고리 ${i+1}`});
const chima=make('치마',6,'bottom','chima',5);
const baji=make('바지',5,'bottom','baji');
const coats=make('두루마기',3,'coat','durumagi-new');
const socks=make('버선',2,'socks','beoseon').map((item,i)=>({...item,img:`${root}beoseon-${i+1}-aligned.png`}));
const shoes=make('꽃신',2,'shoes','flower-shoes').map((item,i)=>({...item,img:`${root}flower-shoes-${i+1}-aligned.png`}));
const norigae=Array.from({length:4},(_,i):Garment=>({id:`norigae-${i+1}`,name:'노리개',slot:'ornament',img:`${root}norigae-${i+1}.png`,label:`노리개 ${i+1}`}));
const hair:Garment[]=[{id:'hairband-1',name:'머리띠',slot:'hair',img:root+'hairband-1.png',label:'꽃 머리띠 1'},{id:'hairband-2',name:'머리띠',slot:'hair',img:root+'hairband-2.png',label:'꽃 머리띠 2'},{id:'hairpin-1',name:'머리핀',slot:'hair',img:root+'hairpin-1.png',label:'꽃 머리핀 1'},{id:'hairpin-2',name:'머리핀',slot:'hair',img:root+'hairpin-2.png',label:'꽃 머리핀 2'}];
const questions:Array<{name:PartName;img:string}>=[{name:'저고리',img:root+'jeogori-1.png'},{name:'치마',img:root+'chima-2.png'},{name:'바지',img:root+'baji-1.png'},{name:'두루마기',img:root+'durumagi-new-1.png'},{name:'버선',img:root+'beoseon-1-aligned.png'},{name:'꽃신',img:root+'flower-shoes-1-aligned.png'},{name:'노리개',img:root+'norigae-2.png'}];
const names=questions.map(item=>item.name);

function Header({title,back,home,soundOn,toggleSound}:{title:string;back:()=>void;home:()=>void;soundOn:boolean;toggleSound:()=>void}){return <header className="hb-header"><HomeIconButton onClick={home}/><Button variant="outline" onClick={back}>← 이전</Button><h1>{title}</h1><SoundIconButton soundOn={soundOn} onClick={toggleSound}/></header>}

function Layer({kind,garment,selected}:{kind:CharacterKind;garment:Garment;selected:boolean}){const fit=getHanbokFit(kind,garment.id,garment.slot);const style={'--fit-left':`${fit.left}%`,'--fit-top':`${fit.top}%`,'--fit-width':`${fit.width}%`,'--fit-height':`${fit.height}%`,'--fit-rotation':`${fit.rotation}deg`,zIndex:fit.zIndex} as React.CSSProperties;return <div className={`hb-layer slot-${garment.slot} garment-${garment.id} ${selected?'selected':''}`} style={style}><img src={garment.img} alt="" draggable={false}/></div>}

function Character({kind,outfit,selected}:{kind:CharacterKind;outfit:Outfit;selected:Slot|null}){const base=`/hanbok-studio/base/child-${kind===0?'a':'b'}.png`;const dressed=Boolean(outfit.top||outfit.coat);return <div className={`hb-character hb-child-${kind} ${dressed?'is-dressed':''} ${outfit.coat?'has-coat':''} ${outfit.socks||outfit.shoes?'has-footwear':''}`} data-character={kind}>
  {dressed
    ?<><img className="hb-base-piece hb-base-back" src={base} alt={`${kind===0?'여자':'남자'} 어린이`}/><img className="hb-base-piece hb-base-legs" src={base} alt=""/></>
    :<img className="hb-base-piece hb-base-whole" src={base} alt={`${kind===0?'여자':'남자'} 어린이 처음 모습`}/>}
  {(['socks','bottom','top','coat','shoes'] as Slot[]).map(slot=>outfit[slot]&&<Layer key={slot} kind={kind} garment={outfit[slot]!} selected={selected===slot}/>)}
  {dressed&&<><img className="hb-base-piece hb-face" src={base} alt=""/><img className="hb-base-piece hb-hand hb-hand-left" src={base} alt=""/><img className="hb-base-piece hb-hand hb-hand-right" src={base} alt=""/></>}
  {(['ornament','hair'] as Slot[]).map(slot=>outfit[slot]&&<Layer key={slot} kind={kind} garment={outfit[slot]!} selected={selected===slot}/>)}
  </div>}

function Design({soundOn}:{soundOn:boolean}){
  const [kind,setKind]=useState<CharacterKind>(0);const [category,setCategory]=useState<Category>('저고리');const [outfits,setOutfits]=useState<Record<CharacterKind,Outfit>>({0:{},1:{}});const [selected,setSelected]=useState<Slot|null>(null);const [message,setMessage]=useState('옷을 눌러 나만의 한복을 디자인해 보세요.');const outfit=outfits[kind];
  const bottom=kind===0?'치마':'바지';const categories:Category[]=['저고리',bottom,'두루마기','버선','꽃신','장신구'];
  useEffect(()=>{if(kind===0&&category==='바지')setCategory('치마');if(kind===1&&category==='치마')setCategory('바지')},[kind,category]);
  const items=category==='저고리'?(kind===0?girlJeogori:boyJeogori):category==='치마'?chima:category==='바지'?baji:category==='두루마기'?coats:category==='버선'?socks:category==='꽃신'?shoes:[...hair,...norigae];
  const wear=(item:Garment)=>{const next={...outfit,[item.slot]:item};if(item.slot==='shoes'&&!next.socks)next.socks=socks[0];setOutfits(value=>({...value,[kind]:next}));setSelected(item.slot);const text=item.slot==='shoes'&&!outfit.socks?'버선을 먼저 신고 꽃신을 신었어요.':`${item.label}을 선택했어요.`;setMessage(text);if(item.slot==='socks'||item.slot==='shoes')playFootPronunciation(soundOn);else{stopKoreanSpeech();speakKorean(text,soundOn,.86)}};
  const remove=()=>{const slots:Slot[]=category==='장신구'?['hair','ornament']:category==='저고리'?['top']:category==='치마'||category==='바지'?['bottom']:category==='두루마기'?['coat']:category==='버선'?['socks']:['shoes'];setOutfits(value=>{const next={...value[kind]};slots.forEach(slot=>delete next[slot]);return{...value,[kind]:next}});setSelected(null);setMessage(`${category} 선택을 지웠어요.`)};
  const reset=()=>{setOutfits(value=>({...value,[kind]:{}}));setSelected(null);setMessage('처음 모습으로 돌아왔어요.')};
  const complete=()=>{if(!outfit.top||!outfit.bottom){setMessage(`${kind===0?'저고리와 치마':'저고리와 바지'}를 먼저 골라 주세요.`);return}setMessage('나만의 한복 디자인을 완성했어요!');playDingDongDaeng(soundOn);window.setTimeout(()=>speakKorean('나만의 한복 디자인을 완성했어요!',soundOn,.86),350)};
  return <section className="hb-design"><aside className="hb-closet"><h2>한복 옷장</h2><div className="hb-kind-switch"><button className={kind===0?'active':''} onClick={()=>{setKind(0);setSelected(null)}}>여자 한복</button><button className={kind===1?'active':''} onClick={()=>{setKind(1);setSelected(null)}}>남자 한복</button></div><div className="hb-tabs">{categories.map(name=><button key={name} className={category===name?'active':''} onClick={()=>setCategory(name)}>{name}</button>)}</div><div className="hb-garments">{items.map(item=>{const picked=outfit[item.slot]?.id===item.id;return <button key={item.id} className={picked?'selected':''} onClick={()=>wear(item)} aria-pressed={picked}><img src={item.img} alt=""/><b>{item.label}</b>{picked&&<span className="hb-card-check">✓</span>}</button>})}</div><Button variant="outline" className="hb-remove-kind" onClick={remove}>{category} 벗기</Button></aside><section className="hb-stage-panel"><p className="hb-message" aria-live="polite">{message}</p><div className="hb-drop-stage"><Character kind={kind} outfit={outfit} selected={selected}/></div><div className="hb-stage-actions"><Button variant="outline" onClick={reset}>처음 모습</Button><Button className="hb-finish" onClick={complete}>완성하기</Button></div></section></section>
}

function Confetti(){return <div className="hb-stars" aria-hidden="true">{Array.from({length:18},(_,i)=><i key={i} style={{'--i':i} as React.CSSProperties}>{i%2?'✿':'★'}</i>)}</div>}
function NameQuiz({soundOn,home}:{soundOn:boolean;home:()=>void}){
  const [index,setIndex]=useState(0);const [right,setRight]=useState<PartName|null>(null);const [message,setMessage]=useState('그림을 보고 알맞은 한복 이름을 눌러보세요.');const [done,setDone]=useState(false);const question=questions[index];
  const choices=useMemo(()=>[question.name,...names.filter(name=>name!==question.name).sort(()=>Math.random()-.5).slice(0,2)].sort(()=>Math.random()-.5),[question]);
  const answer=(name:PartName)=>{if(right)return;if(name!==question.name){setMessage('그림을 다시 살펴볼까요?');stopKoreanSpeech();speakKorean('그림을 다시 살펴볼까요?',soundOn,.86);return}setRight(name);setMessage(`맞았어요! ${name}${name==='꽃신'||name==='버선'?'이에요':'예요'}.`);playDingDongDaeng(soundOn);window.setTimeout(()=>speakKorean(`맞았어요! ${name}${name==='꽃신'||name==='버선'?'이에요':'예요'}.`,soundOn,.86),350)};
  const next=()=>{if(index===questions.length-1){setDone(true);setMessage('한복 이름을 모두 찾았어요!');playDingDongDaeng(soundOn);window.setTimeout(()=>speakKorean('한복 이름을 모두 찾았어요!',soundOn,.86),350);return}setIndex(value=>value+1);setRight(null);setMessage('그림을 보고 알맞은 한복 이름을 눌러보세요.')};
  const restart=()=>{setIndex(0);setRight(null);setDone(false);setMessage('그림을 보고 알맞은 한복 이름을 눌러보세요.')};
  if(done)return <section className="hb-quiz-complete"><Confetti/><h2>한복 이름을 모두 찾았어요!</h2><p>일곱 가지 한복 이름을 모두 맞혔어요.</p><div><Button onClick={restart}>다시 하기</Button><HomeIconButton onClick={home}/></div></section>;
  return <section className="hb-object-quiz"><div className="hb-quiz-guide"><h2>그림을 보고 알맞은 한복 이름을 눌러보세요.</h2><span>{index+1} / {questions.length}</span></div><div className="hb-object-picture"><img src={question.img} alt="이름을 맞힐 한복 물건"/></div><div className="hb-word-cards">{choices.map(name=><button key={name} className={right===name?'correct':''} onClick={()=>answer(name)} disabled={Boolean(right)}>{name}</button>)}</div><p aria-live="polite">{message}</p>{right&&<><Confetti/><Button className="hb-next-question" onClick={next}>다음 문제 →</Button></>}</section>
}

export default function HanbokStudio({home,soundOn,toggleSound}:Props){const [mode,setMode]=useState<Mode>('start');useEffect(()=>()=>stopKoreanSpeech(),[]);const back=()=>{stopKoreanSpeech();setMode('start')};const title=mode==='design'?'한복 디자인하기':mode==='quiz'?'한복 이름 맞추기':'아름다운 우리 한복';return <main className="activity hb-app"><Header title={title} back={back} home={home} soundOn={soundOn} toggleSound={toggleSound}/>{mode==='start'&&<section className="hb-home"><div><span>우리 옷을 쉽고 재미있게 만나요</span><h2>아름다운 우리 한복</h2><p>한복을 직접 꾸미고, 옷의 이름도 맞혀 보아요!</p></div><nav><button onClick={()=>setMode('design')}><img src={root+'jeogori-1.png'} alt=""/><b>한복 디자인하기</b><small>옷과 장신구를 종류별로 골라 조합해요</small></button><button onClick={()=>setMode('quiz')}><img src={root+'norigae-2.png'} alt=""/><b>한복 이름 맞추기</b><small>한복 물건 그림을 보고 이름을 맞혀요</small></button></nav></section>}{mode==='design'&&<Design soundOn={soundOn}/>} {mode==='quiz'&&<NameQuiz soundOn={soundOn} home={home}/>}</main>}
