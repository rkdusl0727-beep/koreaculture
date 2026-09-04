'use client';

import {useEffect,useMemo,useState} from 'react';
import {Button} from '@/components/ui/button';
import {speakKorean,stopKoreanSpeech} from './korean-speech';
import HomeIconButton from './home-icon-button';
import SoundIconButton from './sound-icon-button';
import {playDingDongDaeng} from './correct-sound';
import './hanbok-studio.css';

type Props={home:()=>void;soundOn:boolean;toggleSound:()=>void};
type Mode='home'|'coordinator'|'learn'|'quiz';
type Name='저고리'|'치마'|'바지'|'두루마기'|'버선'|'꽃신'|'노리개'|'고름'|'깃'|'동정'|'소매'|'배자';
type Focus='goreum'|'git'|'dongjeong'|'somae';
type Item={name:Name;description:string;image:string;focus?:Focus};
type Gender='girl'|'boy';
type Slot='jeogori'|'bottom'|'baeja'|'durumagi'|'norigae';
type Piece={id:string;name:string;slot:Slot;gender:Gender;image:string;preview?:string};
type Outfit=Partial<Record<Slot,Piece>>;

const root='/hanbok-studio/garments/';
const coordRoot='/hanbok-studio/coordinator/';
const items:Item[]=[
 {name:'저고리',description:'몸의 위쪽에 입는 한복이에요.',image:root+'jeogori-1.png'},
 {name:'치마',description:'허리 아래에 둘러 입는 한복이에요.',image:root+'chima-complete-white.png'},
 {name:'바지',description:'두 다리를 넣어 입는 한복이에요.',image:root+'baji-1.png'},
 {name:'두루마기',description:'한복 위에 덧입는 긴 옷이에요.',image:root+'durumagi-new-1.png'},
 {name:'버선',description:'한복을 입을 때 발에 신어요.',image:root+'beoseon-1-aligned.png'},
 {name:'꽃신',description:'예쁜 꽃무늬가 있는 전통 신발이에요.',image:root+'flower-shoes-1-aligned.png'},
 {name:'노리개',description:'한복에 달아 꾸미는 장식이에요.',image:root+'norigae-2.png'},
 {name:'고름',description:'저고리 앞에서 묶는 끈이에요.',image:root+'jeogori-1.png',focus:'goreum'},
 {name:'깃',description:'저고리의 목둘레를 감싸는 부분이에요.',image:root+'jeogori-1.png',focus:'git'},
 {name:'동정',description:'깃 위에 덧댄 흰색 부분이에요.',image:root+'jeogori-1.png',focus:'dongjeong'},
 {name:'소매',description:'팔을 넣는 부분이에요.',image:root+'jeogori-1.png',focus:'somae'},
 {name:'배자',description:'저고리 위에 덧입는 소매 없는 옷이에요.',image:root+'baeja-1.png'},
];
const byName=Object.fromEntries(items.map(item=>[item.name,item])) as Record<Name,Item>;
const labels:Record<Gender,Record<Slot,string>>={girl:{jeogori:'저고리',bottom:'치마',baeja:'배자',durumagi:'두루마기',norigae:'노리개'},boy:{jeogori:'저고리',bottom:'바지',baeja:'배자',durumagi:'두루마기',norigae:'노리개'}};
const wardrobe:Piece[]=[
 ...(['girl','boy'] as Gender[]).flatMap(g=>[
  {id:`${g}-jeogori-1`,name:'저고리 1',slot:'jeogori' as const,gender:g,image:coordRoot+`${g}-jeogori-1.png`},
  {id:`${g}-jeogori-2`,name:'저고리 2',slot:'jeogori' as const,gender:g,image:coordRoot+`${g}-jeogori-2.png`},
  {id:`${g}-bottom-1`,name:`${g==='girl'?'치마':'바지'} 1`,slot:'bottom' as const,gender:g,image:coordRoot+`${g}-${g==='girl'?'chima':'baji'}-1.png`},
  {id:`${g}-bottom-2`,name:`${g==='girl'?'치마':'바지'} 2`,slot:'bottom' as const,gender:g,image:coordRoot+`${g}-${g==='girl'?'chima':'baji'}-2.png`},
  {id:`${g}-baeja-1`,name:'배자 1',slot:'baeja' as const,gender:g,image:coordRoot+`${g}-baeja-1.png`},
  {id:`${g}-baeja-2`,name:'배자 2',slot:'baeja' as const,gender:g,image:coordRoot+`${g}-baeja-2.png`},
  {id:`${g}-durumagi-1`,name:'두루마기 1',slot:'durumagi' as const,gender:g,image:coordRoot+`${g}-durumagi-1.png`},
  {id:`${g}-durumagi-2`,name:'두루마기 2',slot:'durumagi' as const,gender:g,image:coordRoot+`${g}-durumagi-2.png`},
 ]),
 {id:'girl-norigae-1',name:'노리개 1',slot:'norigae',gender:'girl',image:coordRoot+'girl-norigae-1.png',preview:root+'norigae-1.png'},
 {id:'girl-norigae-2',name:'노리개 2',slot:'norigae',gender:'girl',image:coordRoot+'girl-norigae-2.png',preview:root+'norigae-2.png'},
];
function shuffle<T>(a:T[]){const r=[...a];for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]]}return r}
function Header({title,back,home,soundOn,toggleSound}:{title:string;back:()=>void;home:()=>void;soundOn:boolean;toggleSound:()=>void}){return <header className="hb-header"><HomeIconButton onClick={home}/><Button variant="outline" onClick={back}>← 이전</Button><h1>{title}</h1><SoundIconButton soundOn={soundOn} onClick={toggleSound}/></header>}
function FocusOverlay({focus}:{focus:Focus}){const paths:Record<Focus,string[]>={goreum:['M102 92C116 84 129 91 135 99C144 91 158 91 169 97L168 116C151 123 140 121 126 113L116 211H83L91 112C80 106 86 94 102 92Z'],git:['M70 55L123 103L157 69L189 99L138 146L72 83Z'],dongjeong:['M75 49L126 94L159 62L190 91L137 136L70 76Z'],somae:['M21 93L79 63L103 91L76 185L33 169Z','M170 90L194 63L250 94L238 170L196 185Z']};return <svg className={`hb-focus-svg focus-${focus}`} viewBox="0 0 271 257" aria-hidden="true">{paths[focus].map((d,i)=><path key={i} d={d}/>)}</svg>}
// oxlint-disable-next-line next/no-img-element
function ItemArt({item,small=false}:{item:Item;small?:boolean}){return <div className={`hb-item-art ${small?'small':''}`} data-item={item.name}><img src={item.image} alt={`${item.name} 그림`}/>{item.focus&&<FocusOverlay focus={item.focus}/>}</div>}
function Celebrate(){return <div className="hb-celebrate" aria-hidden="true">{Array.from({length:18},(_,i)=><i key={i} style={{'--i':i} as React.CSSProperties}>{i%2?'✿':'★'}</i>)}</div>}

function Coordinator({soundOn,onHome}:{soundOn:boolean;onHome:()=>void}){
 const [gender,setGender]=useState<Gender>('girl');const [slot,setSlot]=useState<Slot>('jeogori');const [outfit,setOutfit]=useState<Outfit>({});const [message,setMessage]=useState('옷을 눌러 멋진 한복을 코디해 보세요.');
 const allowed:Slot[]=gender==='girl'?['jeogori','bottom','baeja','durumagi','norigae']:['jeogori','bottom','baeja','durumagi'];
 const choices=wardrobe.filter(p=>p.gender===gender&&p.slot===slot);
 const changeGender=(g:Gender)=>{setGender(g);setSlot('jeogori');setOutfit({});setMessage(`${g==='girl'?'여자':'남자'} 한복을 골라 보세요.`)};
 const wear=(p:Piece)=>{setOutfit(v=>({...v,[p.slot]:p}));setMessage(`${p.name}을 골랐어요.`)};
 const removeOne=()=>{const target=(['norigae','durumagi','baeja','jeogori','bottom'] as Slot[]).find(key=>outfit[key]);if(!target){setMessage('벗을 옷이 없어요.');return}setOutfit(v=>{const next={...v};delete next[target];return next});setMessage(`${labels[gender][target]}을 벗었어요.`)};
 const saveImage=async()=>{const c=document.createElement('canvas');c.width=800;c.height=1000;const x=c.getContext('2d');if(!x)return;x.fillStyle='#fffaf0';x.fillRect(0,0,800,1000);const sources=[coordRoot+`mannequin-${gender}.png`,outfit.bottom?.image,outfit.jeogori?.image,outfit.baeja?.image,outfit.durumagi?.image,outfit.norigae?.image].filter(Boolean) as string[];for(const src of sources){const image=await new Promise<HTMLImageElement>((resolve,reject)=>{const node=new Image();node.onload=()=>resolve(node);node.onerror=reject;node.src=src});x.drawImage(image,0,0,800,1000)}const a=document.createElement('a');a.download='나의-한복.png';a.href=c.toDataURL('image/png');a.click();setMessage('한복 이미지를 저장했어요.')};
 const order:Slot[]=['bottom','jeogori','baeja','durumagi','norigae'];
 return <section className="hb-coordinator"><div className="hb-fixed-guide"><h2>옷을 눌러 멋진 한복을 코디해 보세요.</h2><p aria-live="polite">{message}</p></div><div className="hb-coord-layout"><div className="hb-mannequin-panel"><div className="hb-gender-switch"><button className={gender==='girl'?'active':''} onClick={()=>changeGender('girl')}>여자 한복</button><button className={gender==='boy'?'active':''} onClick={()=>changeGender('boy')}>남자 한복</button></div><div className={`hb-mannequin ${outfit.durumagi?'has-coat':''}`} aria-label={`${gender==='girl'?'여자':'남자'} 한복 마네킹`}>
  {/* oxlint-disable-next-line next/no-img-element */}<img className="coord-layer coord-layer-mannequin" src={`${coordRoot}mannequin-${gender}.png`} alt=""/>{order.map(key=>outfit[key]&&/* oxlint-disable-next-line next/no-img-element */<img key={key} className={`coord-layer coord-layer-${key}`} src={outfit[key]?.image} alt={outfit[key]?.name}/>)}</div></div>
 <div className="hb-wardrobe"><div className="hb-slot-tabs">{allowed.map(key=><button key={key} className={slot===key?'active':''} onClick={()=>setSlot(key)}>{labels[gender][key]}</button>)}</div><div className="hb-coord-cards">{choices.map(p=><button key={p.id} className={outfit[p.slot]?.id===p.id?'selected':''} onClick={()=>wear(p)}>{/* oxlint-disable-next-line next/no-img-element */}<img src={p.preview??p.image} alt=""/><b>{p.name}</b>{outfit[p.slot]?.id===p.id&&<span aria-label="선택됨">✓</span>}</button>)}</div><div className="hb-coord-actions"><Button variant="outline" onClick={removeOne}>하나씩 벗기</Button><Button variant="outline" onClick={()=>{setOutfit({});setMessage('마네킹의 옷을 모두 벗겼어요.')}}>모두 벗기</Button><Button onClick={()=>{setMessage('나만의 한복 코디가 완성되었어요!');playDingDongDaeng(soundOn)}}>완성하기</Button><Button onClick={saveImage}>이미지 저장</Button><Button variant="outline" onClick={onHome}>한복 첫 화면</Button></div></div></div></section>;
}

function Learn({soundOn}:{soundOn:boolean}){const [selected,setSelected]=useState<number|null>(null);const speak=(item:Item)=>{stopKoreanSpeech();speakKorean(`${item.name}. ${item.description}`,soundOn,.86)};if(selected===null)return <section className="hb-learn-list"><div className="hb-fixed-guide"><h2>알고 싶은 한복 그림을 눌러 보세요.</h2><p>한 번에 한 가지씩 자세히 살펴봐요.</p></div><div className="hb-learning-grid">{items.map((item,i)=><button key={item.name} onClick={()=>setSelected(i)}><ItemArt item={item} small/><b>{item.name}</b></button>)}</div></section>;const item=items[selected];return <section className="hb-learn-detail"><div className="hb-fixed-guide"><h2>한복 이름 알아보기</h2><p>그림 전체와 강조된 부분을 천천히 살펴봐요.</p></div><ItemArt item={item}/><div className="hb-learn-copy"><h2>{item.name}</h2><p>{item.description}</p><Button onClick={()=>speak(item)}>🔊 명칭과 설명 듣기</Button></div><nav><Button variant="outline" onClick={()=>setSelected(v=>v===0?items.length-1:(v??1)-1)}>← 이전</Button><Button variant="outline" onClick={()=>setSelected(null)}>목록으로</Button><Button onClick={()=>setSelected(v=>v===items.length-1?0:(v??-1)+1)}>다음 →</Button></nav></section>}
function Quiz({soundOn,onHome}:{soundOn:boolean;onHome:()=>void}){const makeChoices=(answer:Name)=>shuffle([answer,...shuffle(items.map(v=>v.name).filter(v=>v!==answer)).slice(0,2)]);const [order,setOrder]=useState<Name[]>(()=>shuffle(items.map(i=>i.name)));const [index,setIndex]=useState(0);const [correct,setCorrect]=useState<Name|null>(null);const [score,setScore]=useState(0);const [message,setMessage]=useState('그림을 보고 알맞은 한복 이름을 눌러보세요.');const [finished,setFinished]=useState(false);const name=order[index];const item=byName[name];const [choices,setChoices]=useState<Name[]>(()=>makeChoices(order[0]));const answer=(choice:Name)=>{if(correct)return;if(choice!==name){setMessage('그림을 다시 살펴볼까요?');stopKoreanSpeech();speakKorean('그림을 다시 살펴볼까요?',soundOn,.86);return}setCorrect(choice);setScore(v=>v+1);const text=`맞았어요! ${name}${new Set<Name>(['꽃신','버선','고름','깃','동정']).has(name)?'이에요':'예요'}.`;setMessage(text);playDingDongDaeng(soundOn);window.setTimeout(()=>speakKorean(text,soundOn,.86),350)};const next=()=>{if(index===order.length-1){setFinished(true);stopKoreanSpeech();speakKorean('한복 이름을 많이 알게 되었어요!',soundOn,.86);return}const n=index+1;setIndex(n);setChoices(makeChoices(order[n]));setCorrect(null);setMessage('그림을 보고 알맞은 한복 이름을 눌러보세요.')};const restart=()=>{const nextOrder=shuffle(items.map(v=>v.name));setOrder(nextOrder);setChoices(makeChoices(nextOrder[0]));setIndex(0);setCorrect(null);setScore(0);setMessage('그림을 보고 알맞은 한복 이름을 눌러보세요.');setFinished(false)};if(finished)return <section className="hb-quiz-finish"><Celebrate/><h2>한복 이름을 많이 알게 되었어요!</h2><strong>맞힌 문제 {score} / {items.length}</strong><div><Button onClick={restart}>다시 하기</Button><Button variant="outline" onClick={onHome}>한복 첫 화면</Button></div></section>;return <section className="hb-quiz"><div className="hb-fixed-guide"><h2>그림을 보고 알맞은 한복 이름을 눌러보세요.</h2><strong>{index+1} / {items.length}</strong></div><ItemArt item={item}/><div className="hb-quiz-choices">{choices.map(c=><button key={c} className={correct===c?'correct':''} onClick={()=>answer(c)} disabled={Boolean(correct)}>{c}</button>)}</div><p aria-live="polite">{message}</p>{correct&&<><Celebrate/><Button className="hb-next" onClick={next}>다음 문제 →</Button></>}</section>}

export default function HanbokStudio({home,soundOn,toggleSound}:Props){const [mode,setMode]=useState<Mode>('home');useEffect(()=>()=>stopKoreanSpeech(),[]);const toHome=()=>{stopKoreanSpeech();setMode('home')};const title=useMemo(()=>mode==='coordinator'?'한복 코디네이터':mode==='learn'?'한복 이름 알아보기':mode==='quiz'?'한복 이름 퀴즈':'아름다운 우리 한복',[mode]);return <main className="activity hb-app"><Header title={title} back={toHome} home={home} soundOn={soundOn} toggleSound={toggleSound}/>{mode==='home'&&<section className="hb-home"><div><span>한복을 코디하고 이름도 배워요</span><h2>아름다운 우리 한복</h2><p>하고 싶은 활동을 하나 골라 보세요!</p></div><nav><button onClick={()=>setMode('coordinator')}>{/* oxlint-disable-next-line next/no-img-element */}<img className="hb-home-mannequin" src={coordRoot+'mannequin-girl.png'} alt="한복 코디네이터 마네킹"/><b>한복 코디네이터</b><small>옷을 골라 나만의 한복을 꾸며요</small></button><button onClick={()=>setMode('learn')}><ItemArt item={byName.저고리}/><b>한복 이름 알아보기</b><small>12가지 한복 그림과 이름을 살펴봐요</small></button><button onClick={()=>setMode('quiz')}><ItemArt item={byName.노리개}/><b>한복 이름 퀴즈</b><small>그림을 보고 알맞은 이름을 골라요</small></button></nav></section>}{mode==='coordinator'&&<Coordinator soundOn={soundOn} onHome={toHome}/>} {mode==='learn'&&<Learn soundOn={soundOn}/>} {mode==='quiz'&&<Quiz soundOn={soundOn} onHome={toHome}/>}</main>}
