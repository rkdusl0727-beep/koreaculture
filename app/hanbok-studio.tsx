'use client';

import {useEffect,useState} from 'react';
import {Button} from '@/components/ui/button';
import {speakKorean,stopKoreanSpeech} from './korean-speech';
import HomeIconButton from './home-icon-button';
import SoundIconButton from './sound-icon-button';
import {playDingDongDaeng} from './correct-sound';
import './hanbok-studio.css';

type Props={home:()=>void;soundOn:boolean;toggleSound:()=>void};
type Mode='home'|'learn'|'quiz';
type Name='저고리'|'치마'|'바지'|'두루마기'|'버선'|'꽃신'|'노리개'|'고름'|'깃'|'동정'|'소매'|'배자';
type Focus='goreum'|'git'|'dongjeong'|'somae';
type Item={name:Name;description:string;image:string;focus?:Focus};

const root='/hanbok-studio/garments/';
const items:Item[]=[
  {name:'저고리',description:'몸의 위쪽에 입는 한복이에요.',image:root+'jeogori-1.png'},
  {name:'치마',description:'허리 아래에 둘러 입는 한복이에요.',image:root+'chima-1.png'},
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
const consonantEndingNames=new Set<Name>(['꽃신','버선','고름','깃','동정']);
const endings=(name:Name)=>consonantEndingNames.has(name)?'이에요':'예요';
function shuffle<T>(values:T[]){const result=[...values];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]]}return result}

function Header({title,back,home,soundOn,toggleSound}:{title:string;back:()=>void;home:()=>void;soundOn:boolean;toggleSound:()=>void}){return <header className="hb-header"><HomeIconButton onClick={home}/><Button variant="outline" onClick={back}>← 이전</Button><h1>{title}</h1><SoundIconButton soundOn={soundOn} onClick={toggleSound}/></header>}
// oxlint-disable-next-line next/no-img-element -- local transparent PNGs must preserve their exact garment canvas.
function ItemArt({item,small=false}:{item:Item;small?:boolean}){return <div className={`hb-item-art ${small?'small':''} ${item.focus?'is-part':''}`} data-item={item.name}><img src={item.image} alt={`${item.name} 그림`}/>{item.focus&&<span className={`hb-part-outline focus-${item.focus}`} aria-hidden="true"/>}</div>}
function Celebrate(){return <div className="hb-celebrate" aria-hidden="true">{Array.from({length:18},(_,index)=><i key={index} style={{'--i':index} as React.CSSProperties}>{index%2?'✿':'★'}</i>)}</div>}

function Learn({soundOn}:{soundOn:boolean}){
  const [selected,setSelected]=useState<number|null>(null);
  const speak=(item:Item)=>{stopKoreanSpeech();speakKorean(`${item.name}. ${item.description}`,soundOn,.86)};
  if(selected===null)return <section className="hb-learn-list"><div className="hb-fixed-guide"><h2>알고 싶은 한복 그림을 눌러 보세요.</h2><p>한 번에 한 가지씩 자세히 살펴봐요.</p></div><div className="hb-learning-grid">{items.map((item,index)=><button key={item.name} onClick={()=>setSelected(index)}><ItemArt item={item} small/><b>{item.name}</b></button>)}</div></section>;
  const item=items[selected];
  return <section className="hb-learn-detail"><div className="hb-fixed-guide"><h2>한복 이름 알아보기</h2><p>그림 전체와 강조된 부분을 천천히 살펴봐요.</p></div><ItemArt item={item}/><div className="hb-learn-copy"><h2>{item.name}</h2><p>{item.description}</p><Button onClick={()=>speak(item)}>🔊 명칭과 설명 듣기</Button></div><nav><Button variant="outline" onClick={()=>setSelected(value=>value===0?items.length-1:(value??1)-1)}>← 이전</Button><Button variant="outline" onClick={()=>setSelected(null)}>목록으로</Button><Button onClick={()=>setSelected(value=>value===items.length-1?0:(value??-1)+1)}>다음 →</Button></nav></section>;
}

function Quiz({soundOn,onHome}:{soundOn:boolean;onHome:()=>void}){
  const makeChoices=(answer:Name)=>shuffle([answer,...shuffle(items.map(value=>value.name).filter(value=>value!==answer)).slice(0,2)]);
  const [order,setOrder]=useState<Name[]>(()=>shuffle(items.map(item=>item.name)));const [index,setIndex]=useState(0);const [correct,setCorrect]=useState<Name|null>(null);const [score,setScore]=useState(0);const [message,setMessage]=useState('그림을 보고 알맞은 한복 이름을 눌러보세요.');const [finished,setFinished]=useState(false);const name=order[index];const item=byName[name];const [choices,setChoices]=useState<Name[]>(()=>makeChoices(order[0]));
  const answer=(choice:Name)=>{if(correct)return;if(choice!==name){setMessage('그림을 다시 살펴볼까요?');stopKoreanSpeech();speakKorean('그림을 다시 살펴볼까요?',soundOn,.86);return}setCorrect(choice);setScore(value=>value+1);const text=`맞았어요! ${name}${endings(name)}.`;setMessage(text);playDingDongDaeng(soundOn);window.setTimeout(()=>speakKorean(text,soundOn,.86),350)};
  const next=()=>{if(index===order.length-1){setFinished(true);stopKoreanSpeech();speakKorean('한복 이름을 많이 알게 되었어요!',soundOn,.86);return}const nextIndex=index+1;setIndex(nextIndex);setChoices(makeChoices(order[nextIndex]));setCorrect(null);setMessage('그림을 보고 알맞은 한복 이름을 눌러보세요.')};
  const restart=()=>{const nextOrder=shuffle(items.map(value=>value.name));setOrder(nextOrder);setChoices(makeChoices(nextOrder[0]));setIndex(0);setCorrect(null);setScore(0);setMessage('그림을 보고 알맞은 한복 이름을 눌러보세요.');setFinished(false)};
  if(finished)return <section className="hb-quiz-finish"><Celebrate/><h2>한복 이름을 많이 알게 되었어요!</h2><strong>맞힌 문제 {score} / {items.length}</strong><div><Button onClick={restart}>다시 하기</Button><Button variant="outline" onClick={onHome}>한복 첫 화면</Button></div></section>;
  return <section className="hb-quiz"><div className="hb-fixed-guide"><h2>그림을 보고 알맞은 한복 이름을 눌러보세요.</h2><strong>{index+1} / {items.length}</strong></div><ItemArt item={item}/><div className="hb-quiz-choices">{choices.map(choice=><button key={choice} className={correct===choice?'correct':''} onClick={()=>answer(choice)} disabled={Boolean(correct)}>{choice}</button>)}</div><p aria-live="polite">{message}</p>{correct&&<><Celebrate/><Button className="hb-next" onClick={next}>다음 문제 →</Button></>}</section>;
}

export default function HanbokStudio({home,soundOn,toggleSound}:Props){const [mode,setMode]=useState<Mode>('home');useEffect(()=>()=>stopKoreanSpeech(),[]);const toHome=()=>{stopKoreanSpeech();setMode('home')};const title=mode==='learn'?'한복 이름 알아보기':mode==='quiz'?'한복 이름 퀴즈':'아름다운 우리 한복';return <main className="activity hb-app"><Header title={title} back={toHome} home={home} soundOn={soundOn} toggleSound={toggleSound}/>{mode==='home'&&<section className="hb-home"><div><span>한 번에 하나씩 자세히 살펴봐요</span><h2>아름다운 우리 한복</h2><p>한복의 이름과 생김새를 재미있게 배워요!</p></div><nav><button onClick={()=>setMode('learn')}><ItemArt item={byName.저고리}/><b>한복 이름 알아보기</b><small>12가지 한복 그림과 이름을 살펴봐요</small></button><button onClick={()=>setMode('quiz')}><ItemArt item={byName.노리개}/><b>한복 이름 퀴즈</b><small>그림을 보고 알맞은 이름을 골라요</small></button></nav></section>}{mode==='learn'&&<Learn soundOn={soundOn}/>} {mode==='quiz'&&<Quiz soundOn={soundOn} onHome={toHome}/>}</main>}
