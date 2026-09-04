'use client';

import {useEffect,useMemo,useReducer,useRef,useState,type CSSProperties} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {
  FINISHED,
  WAITING,
  initialPieces,
  makeForcedYutThrow,
  makeYutThrow,
  movablePieceIds,
  moveTarget,
  possibleRoutes,
  resolveMove,
  type Face,
  type Piece,
  type ResultName,
  type Route,
  type Team,
  type ThrowResult,
} from './yut-logic';
import {speakKorean,stopKoreanSpeech} from './korean-speech';
import HomeIconButton from './home-icon-button';
import SoundIconButton from './sound-icon-button';
import './yut-game.css';

type Mode='start'|'practice'|'names'|'rules'|'game';
type Phase='ready'|'rolling'|'awaitingMove'|'choosingPath'|'moving'|'resolving'|'extraThrow'|'turnEnd'|'gameOver';
const asset='/yut-assets/';
const resultNames:ResultName[]=['도','개','걸','윷','모','백도'];
const icon:Record<ResultName,string>={도:'do_icon.png',개:'gae_icon.png',걸:'geol_icon.png',윷:'yut_icon.png',모:'mo_icon.png',백도:'backdo_icon.png'};
const initialFaces:readonly Face[]=['round','flat','round','flat'];
const stickScatters=[
  [{x:27,y:33,r:-24},{x:44,y:67,r:12},{x:65,y:38,r:25},{x:76,y:69,r:-13}],
  [{x:23,y:64,r:20},{x:43,y:31,r:-15},{x:63,y:66,r:31},{x:79,y:39,r:-27}],
  [{x:28,y:29,r:-31},{x:38,y:70,r:16},{x:62,y:45,r:-6},{x:79,y:70,r:29}],
  [{x:22,y:42,r:9},{x:45,y:65,r:-29},{x:66,y:29,r:18},{x:79,y:59,r:-8}],
] as const;
const raw=[[1040,1040],[1040,868],[1040,696],[1040,524],[1040,352],[1040,180],[868,180],[696,180],[524,180],[352,180],[180,180],[180,352],[180,524],[180,696],[180,868],[180,1040],[352,1040],[524,1040],[696,1040],[868,1040],[352,352],[481,481],[739,481],[868,352],[610,610],[352,868],[481,739],[739,739],[868,868]];
const nodes=raw.map(([x,y],id)=>({id,x:x/1254*100,y:y/1254*100}));
const nodeMap=new Map(nodes.map(node=>[node.id,node]));

function audioContext(){
  if(typeof window==='undefined')return null;
  const AudioContextClass=window.AudioContext||(window as typeof window&{webkitAudioContext:typeof AudioContext}).webkitAudioContext;
  return new AudioContextClass();
}

function playThrowSound(enabled:boolean){
  if(!enabled)return;
  const ctx=audioContext();
  if(!ctx)return;
  const start=ctx.currentTime;
  [0,.055,.125,.205,.285].forEach((delay,index)=>{
    const at=start+delay;
    const duration=.075+index*.008;
    const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate);
    const data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,3.2);
    const noise=ctx.createBufferSource();
    const filter=ctx.createBiquadFilter();
    const gain=ctx.createGain();
    noise.buffer=buffer;
    filter.type='bandpass';
    filter.frequency.setValueAtTime(720+index*85,at);
    filter.Q.setValueAtTime(2.4,at);
    gain.gain.setValueAtTime(.0001,at);
    gain.gain.exponentialRampToValueAtTime(.32,at+.004);
    gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(at);
    noise.stop(at+duration);
  });
  window.setTimeout(()=>void ctx.close(),900);
}

function playArrivalSound(enabled:boolean){
  if(!enabled)return;
  const ctx=audioContext();
  if(!ctx)return;
  const start=ctx.currentTime;
  [523,659,784,1046].forEach((frequency,index)=>{
    const osc=ctx.createOscillator();
    const gain=ctx.createGain();
    const at=start+index*.12;
    osc.type='sine';
    osc.frequency.setValueAtTime(frequency,at);
    gain.gain.setValueAtTime(.0001,at);
    gain.gain.exponentialRampToValueAtTime(.17,at+.02);
    gain.gain.exponentialRampToValueAtTime(.0001,at+.22);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at+.24);
  });
  window.setTimeout(()=>void ctx.close(),1200);
}

const keyActivate=(activate:()=>void)=>(event:React.KeyboardEvent)=>{
  if(event.key==='Enter'||event.key===' '){event.preventDefault();activate()}
};
const pawnSrc=(team:Team,count:number)=>`${asset}${team}_${count>1?'mal_stack':'mal'}.png`;

function Pawn({team,count=1,selectable=false,hinting=false,moving=false,onActivate}:{team:Team;count?:number;selectable?:boolean;hinting?:boolean;moving?:boolean;onActivate?:()=>void}){
  return <button type="button" className={`png-pawn ${team} ${selectable?'selectable':''} ${hinting?'hinting':''} ${moving?'moving':''}`} onPointerUp={event=>{event.preventDefault();if(selectable)onActivate?.()}} onKeyDown={keyActivate(()=>selectable&&onActivate?.())} disabled={!selectable} aria-label={`${team==='red'?'빨강':'파랑'}팀 말 ${count}개`}><img src={pawnSrc(team,count)} alt=""/>{count>1&&<b>{count}</b>}</button>;
}

function ResultIcon({name}:{name:ResultName}){
  return <img className="result-png" src={`${asset}icons/${icon[name]}`} alt=""/>;
}

function YutSticks({faces,rolling,onThrow,disabled,label}:{faces:readonly Face[];rolling:boolean;onThrow:()=>void;disabled:boolean;label?:string}){
  const start=useRef<number|null>(null);
  const[scatter,setScatter]=useState(0);
  const throwNow=()=>{if(disabled)return;setScatter(value=>(value+1)%stickScatters.length);onThrow()};
  const layout=stickScatters[scatter];
  return <section className="png-throw-zone"><div className="throw-mat"><img className="mat-png" src={`${asset}yut_throw_mat.png`} alt="전통 윷 던지기 놀이판"/><div className={`png-sticks ${rolling?'rolling':''}`} onPointerDown={event=>{if(disabled)return;start.current=event.clientY;event.currentTarget.setPointerCapture(event.pointerId)}} onPointerUp={event=>{if(start.current!==null&&start.current-event.clientY>35)throwNow();start.current=null}}>{faces.map((face,index)=>{const spot=layout[index];const style={'--stick-x':`${spot.x}%`,'--stick-y':`${spot.y}%`,'--stick-r':`${spot.r}deg`,'--stick-delay':`${index*.05}s`} as CSSProperties;return <span key={index} style={style}><img src={`${asset}yut_${face}.png`} alt={face==='round'?'둥근 면':face==='backdo'?'백도 표시 면':'평평한 면'}/></span>})}</div></div><Button className="png-throw-button" onPointerUp={event=>{event.preventDefault();throwNow()}} onKeyDown={keyActivate(throwNow)} disabled={disabled}>{rolling?'윷이 날아가요':label||'윷 던지기'}</Button><small>버튼을 누르거나 윷가락을 위로 밀어요</small></section>;
}

type Target={display:number;actual:number;route:Route;label?:string};
function Board({pieces,selectable=[],targets=[],hintTargets=[],hinting=false,movingIds=[],onPiece,onTarget}:{pieces:Piece[];selectable?:string[];targets?:Target[];hintTargets?:Target[];hinting?:boolean;movingIds?:string[];onPiece:(id:string)=>void;onTarget:(target:Target)=>void}){
  const grouped=useMemo(()=>{
    const groups=new Map<string,Piece[]>();
    pieces.filter(piece=>piece.position>=0).forEach(piece=>{const key=`${piece.team}-${piece.position}`;groups.set(key,[...(groups.get(key)||[]),piece])});
    return[...groups.values()];
  },[pieces]);
  return <div className="traditional-board" aria-label="정사각형 29밭 전통 윷판"><img className="board-png" src={`${asset}traditional_yut_board.png`} alt="외곽 20밭과 X자 지름길이 있는 전통 윷판"/>{nodes.map(node=>{const option=targets.find(target=>target.display===node.id);const hints=hintTargets.filter(target=>target.display===node.id);return <button key={node.id} type="button" data-yut-target={node.id} className={`board-touch ${option?'target':''} ${option?.route==='outer'?'route-outer':''} ${option&&option.route!=='outer'?'route-shortcut':''} ${hints.length?'hint-destination':''} ${hints.some(target=>target.route!=='outer')?'shortcut-hint':''} ${node.id===0?'home':''}`} style={{left:`${node.x}%`,top:`${node.y}%`}} disabled={!option} onPointerUp={event=>{event.preventDefault();if(option)onTarget(option)}} onKeyDown={keyActivate(()=>option&&onTarget(option))} aria-label={option?.label||(node.id===0?'출발과 도착':`${node.id}번 밭`)}>{node.id===0&&<span>출발·도착</span>}{option?.label&&<b className="route-choice-label">{option.label}</b>}</button>})}{grouped.map(group=>{const piece=group[0];const node=nodeMap.get(piece.position)!;const active=group.find(item=>selectable.includes(item.id));const ids=group.map(item=>item.id);return <div key={`${piece.team}-${piece.position}`} className={`pawn-anchor ${piece.team}`} style={{left:`${node.x}%`,top:`${node.y}%`}}><Pawn team={piece.team} count={group.length} selectable={!!active} hinting={hinting&&!!active} moving={ids.some(id=>movingIds.includes(id))} onActivate={()=>active&&onPiece(active.id)}/></div>})}</div>;
}

function Rules({close,start}:{close?:()=>void;start?:()=>void}){
  const steps=[['do_icon.png','1. 각 팀이 말을 출발점에 놓아요.'],['do_icon.png','2. 윷을 던져요.'],['gae_icon.png','3. 나온 수만큼 가요.'],['yut_icon.png','4. 같은 팀 말을 만나면 함께 가요.'],['geol_icon.png','5. 다른 팀 말을 만나면 잡아요.'],['mo_icon.png','6. 윷과 모는 한 번 더 던져요.'],['backdo_icon.png','7. 백도는 한 칸 뒤로 가요.'],['do_icon.png','8. 말 두 개가 먼저 도착하면 이겨요.']];
  return <dialog open className="png-yut-modal"><div className="png-rules"><h2>쉬운 윷놀이 규칙</h2><div>{steps.map(([src,text])=><article key={text}><img src={`${asset}icons/${src}`} alt=""/><b>{text}</b></article>)}</div><p>같이 놀며 천천히 익혀요!</p>{start?<Button onPointerUp={start}>알았어요, 시작!</Button>:<Button onPointerUp={close}>규칙 닫기</Button>}</div></dialog>;
}

function TeamPanel({team,name,pieces,active}:{team:Team;name:string;pieces:Piece[];active:boolean}){
  const mine=pieces.filter(piece=>piece.team===team);
  return <article className={`png-team ${team} ${active?'active':''}`}><div><img src={pawnSrc(team,1)} alt=""/><h3>{name}</h3></div><p><span>출발 전 <b>{mine.filter(piece=>piece.position===WAITING).length}</b></span><span>윷판 위 <b>{mine.filter(piece=>piece.position>=0).length}</b></span><span>도착 <b>{mine.filter(piece=>piece.position===FINISHED).length}</b></span></p></article>;
}

function Practice({soundOn,onBack}:{soundOn:boolean;onBack:()=>void}){
  const[faces,setFaces]=useState<readonly Face[]>(initialFaces);
  const[rolling,setRolling]=useState(false);
  const[result,setResult]=useState<ThrowResult|null>(null);
  const[seen,setSeen]=useState<ResultName[]>([]);
  const[piece,setPiece]=useState<Piece>({id:'practice',team:'red',position:WAITING,route:'outer',history:[]});
  const[message,setMessage]=useState('도·개·걸·윷·모·백도를 만나 보세요!');
  const timer=useRef<number|null>(null);
  const locked=useRef(false);
  useEffect(()=>()=>{if(timer.current)window.clearTimeout(timer.current);stopKoreanSpeech()},[]);
  const throwYut=()=>{
    if(locked.current||rolling||result)return;
    locked.current=true;
    const roll=makeYutThrow();
    playThrowSound(soundOn);
    setRolling(true);
    setMessage('윷을 던지고 있어요!');
    timer.current=window.setTimeout(()=>{
      setFaces(roll.faces);
      setResult(roll);
      setSeen(value=>value.includes(roll.result)?value:[...value,roll.result]);
      setMessage(roll.sentence);
      setRolling(false);
      stopKoreanSpeech();
      speakKorean(roll.sentence,soundOn);
      if(roll.moveDirection==='backward'&&piece.position===WAITING)timer.current=window.setTimeout(()=>{locked.current=false;setResult(null);setMessage('윷판 위에 말이 없어서 다시 던져요.')},900);
    },650);
  };
  const move=()=>{
    if(!result||locked.current===false)return;
    const route=possibleRoutes(piece,result)[0];
    const solved=resolveMove([piece],'red','practice',result,route);
    const reached=solved.finalPieces[0].position===FINISHED;
    if(reached)playArrivalSound(soundOn);
    setPiece(reached?{...solved.finalPieces[0],position:WAITING}:solved.finalPieces[0]);
    locked.current=false;
    setResult(null);
    setMessage(reached?'도착했어요! 다시 출발해요.':seen.length===6?'윷놀이 준비 완료!':'다시 윷을 던져 보세요!');
  };
  return <section className="practice-screen"><div className="practice-top"><Button variant="outline" onPointerUp={onBack}>이전</Button><h2>윷놀이 연습</h2><div>{resultNames.map(name=><span className={seen.includes(name)?'seen':''} key={name}><ResultIcon name={name}/><b>{name}</b></span>)}</div></div><div className="practice-layout"><div className="practice-board"><Board pieces={piece.position>=0?[piece]:[]} selectable={result&&piece.position>=0?['practice']:[]} onPiece={move} onTarget={()=>{}}/>{piece.position===WAITING&&<div className="practice-wait"><Pawn team="red" selectable={!!result&&result.moveDirection==='forward'} onActivate={move}/><b>연습 말</b></div>}</div><aside><YutSticks faces={faces} rolling={rolling} onThrow={throwYut} disabled={rolling||!!result}/><div className="png-result"><strong>{result?.result||'준비'}</strong><p>{message}</p></div>{seen.length===6&&<div className="ready-badge">윷놀이 준비 완료!</div>}</aside></div></section>;
}

type MoveResolution=ReturnType<typeof resolveMove>;
type PendingMove={moveId:string;rollId:string;pieceId:string;route:Route;resolution:MoveResolution};
type GameState={
  names:Record<Team,string>;
  phase:Phase;
  pieces:Piece[];
  turn:Team;
  setupTeam:Team|null;
  currentRoll:ThrowResult|null;
  lastRoll:ThrowResult|null;
  selectedPieceId:string|null;
  routeOptions:Route[];
  pendingMove:PendingMove|null;
  message:string;
  bonus:boolean;
  winner:Team|null;
  hinting:boolean;
};
type Action=
  |{type:'SETUP_PIECE';pieceId:string}
  |{type:'ROLL_START';roll:ThrowResult}
  |{type:'ROLL_SETTLED';rollId:string}
  |{type:'SELECT_PIECE';pieceId:string}
  |{type:'CHOOSE_ROUTE';route:Route}
  |{type:'MOVE_COMMIT';moveId:string}
  |{type:'RESOLVE_MOVE';moveId:string}
  |{type:'NEXT_TURN'}
  |{type:'SHOW_HINT'}
  |{type:'CLEAR_HINT'}
  |{type:'RESET'};

let moveSequence=0;
const nextMoveId=()=>`move-${Date.now()}-${++moveSequence}`;
const otherTeam=(team:Team):Team=>team==='red'?'blue':'red';
const routeLabel=(route:Route)=>route==='outer'?'바깥길':route==='center_to_bl'?'왼쪽 길':route==='center_to_home'?'오른쪽 길':'지름길';

function startMove(state:GameState,pieceId:string,route:Route):GameState{
  if(!state.currentRoll)return state;
  const resolution=resolveMove(state.pieces,state.turn,pieceId,state.currentRoll,route);
  return{...state,phase:'moving',selectedPieceId:pieceId,routeOptions:[],pendingMove:{moveId:nextMoveId(),rollId:state.currentRoll.rollId,pieceId,route,resolution},hinting:false,message:`${state.currentRoll.result} 결과로 ${state.currentRoll.moveDirection==='backward'?'뒤로':'앞으로'} ${state.currentRoll.steps}칸 이동해요.`};
}

function initialGameState(names:Record<Team,string>):GameState{
  return{names,phase:'ready',pieces:initialPieces(),turn:'red',setupTeam:'red',currentRoll:null,lastRoll:null,selectedPieceId:null,routeOptions:[],pendingMove:null,message:`${names.red} 말을 눌러 출발점에 놓아요.`,bonus:false,winner:null,hinting:false};
}

function gameReducer(state:GameState,action:Action):GameState{
  switch(action.type){
    case 'SETUP_PIECE':{
      if(state.phase!=='ready'||!state.setupTeam)return state;
      const piece=state.pieces.find(item=>item.id===action.pieceId);
      if(!piece||piece.team!==state.setupTeam||piece.position!==WAITING)return state;
      const pieces=state.pieces.map(item=>item.id===action.pieceId?{...item,position:0,route:'outer' as Route,history:[0]}:item);
      const nextSetup=state.setupTeam==='red'?'blue':null;
      return{...state,pieces,turn:nextSetup||'red',setupTeam:nextSetup,message:nextSetup?`${state.names.blue} 말을 눌러 출발점에 놓아요.`:`${state.names.red} 차례예요. 윷을 던져요!`};
    }
    case 'ROLL_START':
      if(state.setupTeam||state.winner||(state.phase!=='ready'&&state.phase!=='extraThrow'))return state;
      return{...state,phase:'rolling',currentRoll:action.roll,selectedPieceId:null,routeOptions:[],pendingMove:null,bonus:false,hinting:false,message:'윷을 던지고 있어요!'};
    case 'ROLL_SETTLED':{
      if(state.phase!=='rolling'||state.currentRoll?.rollId!==action.rollId)return state;
      const movable=movablePieceIds(state.pieces,state.turn,state.currentRoll);
      if(!movable.length)return{...state,phase:'turnEnd',lastRoll:state.currentRoll,message:'움직일 수 있는 말이 없어요. 다음 팀 차례예요.'};
      return{...state,phase:'awaitingMove',lastRoll:state.currentRoll,message:`${state.currentRoll.sentence} 움직일 말을 한 번 눌러요.`};
    }
    case 'SELECT_PIECE':{
      if(state.phase!=='awaitingMove'||!state.currentRoll)return state;
      if(!movablePieceIds(state.pieces,state.turn,state.currentRoll).includes(action.pieceId))return state;
      const piece=state.pieces.find(item=>item.id===action.pieceId)!;
      const routes=possibleRoutes(piece,state.currentRoll);
      if(routes.length===1)return startMove(state,action.pieceId,routes[0]);
      return{...state,phase:'choosingPath',selectedPieceId:action.pieceId,routeOptions:routes,hinting:false,message:'두 길 중 원하는 길을 한 번 눌러요.'};
    }
    case 'CHOOSE_ROUTE':
      if(state.phase!=='choosingPath'||!state.selectedPieceId||!state.routeOptions.includes(action.route))return state;
      return startMove(state,state.selectedPieceId,action.route);
    case 'MOVE_COMMIT':
      if(state.phase!=='moving'||state.pendingMove?.moveId!==action.moveId)return state;
      return{...state,phase:'resolving',pieces:state.pendingMove.resolution.finalPieces,message:'이동 결과를 확인하고 있어요.'};
    case 'RESOLVE_MOVE':{
      if(state.phase!=='resolving'||state.pendingMove?.moveId!==action.moveId)return state;
      const solved=state.pendingMove.resolution;
      if(solved.won)return{...state,phase:'gameOver',currentRoll:null,pendingMove:null,winner:state.turn,message:'축하해요! 두 개의 말이 모두 도착했어요!'};
      if(solved.extraThrow)return{...state,phase:'extraThrow',currentRoll:null,pendingMove:null,selectedPieceId:null,bonus:true,message:solved.caughtIds.length?'상대 말을 잡았어요! 한 번 더 던져요.':'한 번 더! 다시 윷을 던져요.'};
      return{...state,phase:'turnEnd',currentRoll:null,pendingMove:null,selectedPieceId:null,message:'이동이 끝났어요. 다음 팀 차례예요.'};
    }
    case 'NEXT_TURN':{
      if(state.phase!=='turnEnd')return state;
      const turn=otherTeam(state.turn);
      return{...state,phase:'ready',turn,currentRoll:null,selectedPieceId:null,routeOptions:[],pendingMove:null,bonus:false,hinting:false,message:`${state.names[turn]} 차례예요. 윷을 던져요!`};
    }
    case 'SHOW_HINT':
      if(state.phase!=='awaitingMove'&&state.phase!=='choosingPath')return state;
      return{...state,hinting:true,message:state.phase==='choosingPath'?'색이 다른 두 길 중 하나를 눌러보세요!':'반짝이는 말을 눌러보세요!'};
    case 'CLEAR_HINT':
      return state.hinting?{...state,hinting:false}:state;
    case 'RESET':
      return initialGameState(state.names);
  }
}

function Game({soundOn,names,onBack,onHome}:{soundOn:boolean;names:Record<Team,string>;onBack:()=>void;onHome:()=>void}){
  const[state,dispatch]=useReducer(gameReducer,names,initialGameState);
  const stateRef=useRef(state);
  const spokenRoll=useRef<string|null>(null);
  const throwInputLock=useRef(false);
  const hintInputLock=useRef(false);
  const[showRules,setShowRules]=useState(false);
  const[confirm,setConfirm]=useState<'home'|'restart'|null>(null);
  useEffect(()=>{stateRef.current=state},[state]);
  useEffect(()=>()=>stopKoreanSpeech(),[]);
  useEffect(()=>{if(state.phase==='ready'||state.phase==='extraThrow')throwInputLock.current=false;if(!state.hinting)hintInputLock.current=false},[state.phase,state.hinting]);

  useEffect(()=>{
    if(state.phase!=='rolling'||!state.currentRoll)return;
    const rollId=state.currentRoll.rollId;
    const timer=window.setTimeout(()=>dispatch({type:'ROLL_SETTLED',rollId}),650);
    return()=>window.clearTimeout(timer);
  },[state.phase,state.currentRoll]);

  useEffect(()=>{
    if(!state.currentRoll||state.phase==='rolling'||spokenRoll.current===state.currentRoll.rollId)return;
    spokenRoll.current=state.currentRoll.rollId;
    stopKoreanSpeech();
    speakKorean(state.currentRoll.sentence,soundOn);
  },[state.phase,state.currentRoll,soundOn]);

  useEffect(()=>{
    if(state.phase!=='moving'||!state.pendingMove)return;
    const moveId=state.pendingMove.moveId;
    const timer=window.setTimeout(()=>dispatch({type:'MOVE_COMMIT',moveId}),520);
    return()=>window.clearTimeout(timer);
  },[state.phase,state.pendingMove]);

  useEffect(()=>{
    if(state.phase!=='resolving'||!state.pendingMove)return;
    const moveId=state.pendingMove.moveId;
    const arrived=state.pendingMove.resolution.movingIds.some(id=>state.pendingMove?.resolution.finalPieces.find(piece=>piece.id===id)?.position===FINISHED);
    if(arrived)playArrivalSound(soundOn);
    const timer=window.setTimeout(()=>dispatch({type:'RESOLVE_MOVE',moveId}),180);
    return()=>window.clearTimeout(timer);
  },[state.phase,state.pendingMove,soundOn]);

  useEffect(()=>{
    if(state.phase!=='turnEnd')return;
    const timer=window.setTimeout(()=>dispatch({type:'NEXT_TURN'}),900);
    return()=>window.clearTimeout(timer);
  },[state.phase]);

  useEffect(()=>{
    if(!state.hinting)return;
    const timer=window.setTimeout(()=>dispatch({type:'CLEAR_HINT'}),2000);
    return()=>window.clearTimeout(timer);
  },[state.hinting]);

  const selectable=useMemo(()=>{
    if(state.setupTeam&&state.phase==='ready')return state.pieces.filter(piece=>piece.team===state.setupTeam&&piece.position===WAITING).map(piece=>piece.id);
    if(state.phase==='awaitingMove'&&state.currentRoll)return movablePieceIds(state.pieces,state.turn,state.currentRoll);
    return[];
  },[state]);

  const routeTargets=useMemo<Target[]>(()=>{
    if(state.phase!=='choosingPath'||!state.selectedPieceId||!state.currentRoll)return[];
    const piece=state.pieces.find(item=>item.id===state.selectedPieceId);
    if(!piece)return[];
    return state.routeOptions.map(route=>{const actual=moveTarget(piece,state.currentRoll!,route);return{route,actual,display:actual===FINISHED||actual===WAITING?0:actual,label:routeLabel(route)}});
  },[state]);

  const hintTargets=useMemo<Target[]>(()=>{
    if(!state.hinting||!state.currentRoll)return[];
    if(state.phase==='choosingPath')return routeTargets;
    if(state.phase!=='awaitingMove')return[];
    return movablePieceIds(state.pieces,state.turn,state.currentRoll).flatMap(pieceId=>{
      const piece=state.pieces.find(item=>item.id===pieceId)!;
      return possibleRoutes(piece,state.currentRoll!).map(route=>{const actual=moveTarget(piece,state.currentRoll!,route);return{route,actual,display:actual===FINISHED||actual===WAITING?0:actual}});
    });
  },[state,routeTargets]);

  const throwYut=(forced?:ResultName)=>{
    const current=stateRef.current;
    if(throwInputLock.current||current.setupTeam||current.winner||(current.phase!=='ready'&&current.phase!=='extraThrow'))return;
    throwInputLock.current=true;
    const roll=forced?makeForcedYutThrow(forced):makeYutThrow();
    stopKoreanSpeech();
    dispatch({type:'ROLL_START',roll});
    playThrowSound(soundOn);
  };
  const choosePiece=(pieceId:string)=>dispatch(stateRef.current.setupTeam?{type:'SETUP_PIECE',pieceId}:{type:'SELECT_PIECE',pieceId});
  const showHint=()=>{
    const current=stateRef.current;
    if(hintInputLock.current||(current.phase!=='awaitingMove'&&current.phase!=='choosingPath'))return;
    hintInputLock.current=true;
    dispatch({type:'SHOW_HINT'});
    stopKoreanSpeech();
    speakKorean(current.phase==='choosingPath'?'색이 다른 두 길 중 하나를 눌러보세요!':'반짝이는 말을 눌러보세요!',soundOn);
  };
  const reset=()=>{stopKoreanSpeech();spokenRoll.current=null;throwInputLock.current=false;hintInputLock.current=false;dispatch({type:'RESET'});setConfirm(null)};
  const visibleFaces=state.phase==='rolling'?(state.lastRoll?.faces||initialFaces):(state.currentRoll?.faces||state.lastRoll?.faces||initialFaces);
  const canThrow=!state.setupTeam&&(state.phase==='ready'||state.phase==='extraThrow')&&!state.winner;
  const movingIds=state.pendingMove?.resolution.movingIds||[];
  const resultLabel=state.setupTeam?'말 놓기':state.phase==='rolling'?'던지는 중':state.currentRoll?.result||state.lastRoll?.result||'준비';
  const devMode=process.env.NODE_ENV!=='production';

  return <section className={`png-game phase-${state.phase}`}><div className="game-board-column"><div className="board-heading"><h2>전통 윷판</h2><span>출발·도착은 오른쪽 아래예요</span></div><Board pieces={state.pieces} selectable={selectable} targets={routeTargets} hintTargets={hintTargets} hinting={state.hinting} movingIds={movingIds} onPiece={choosePiece} onTarget={target=>dispatch({type:'CHOOSE_ROUTE',route:target.route})}/></div><aside className="game-side"><div className="side-actions"><Button variant="outline" onPointerUp={()=>setShowRules(true)}>규칙 다시 보기</Button><Button variant="outline" disabled={state.hinting||(state.phase!=='awaitingMove'&&state.phase!=='choosingPath')} onPointerUp={showHint}>힌트</Button><Button variant="outline" onPointerUp={()=>setConfirm('restart')}>처음부터</Button></div><div className="turn-box"><span>{state.setupTeam?'출발 준비':'현재 차례'}</span><strong className={state.turn}>{names[state.turn]}</strong><small>직전 결과: {state.lastRoll?.result||'없음'}</small>{state.bonus&&<b>한 번 더!</b>}</div><div className="team-row"><TeamPanel team="red" name={names.red} pieces={state.pieces} active={state.turn==='red'}/><TeamPanel team="blue" name={names.blue} pieces={state.pieces} active={state.turn==='blue'}/></div><YutSticks faces={visibleFaces} rolling={state.phase==='rolling'} onThrow={()=>throwYut()} disabled={!canThrow} label={state.phase==='extraThrow'?'한 번 더 던지기':undefined}/><div className="result-guide"><div className="result-strip">{resultNames.map(name=><span className={state.lastRoll?.result===name?'active':''} key={name}><ResultIcon name={name}/><b>{name}</b></span>)}</div><div className="png-result"><strong>{resultLabel}</strong><p>{state.message}</p></div></div><div className="waiting-area"><div><b>빨강팀 대기</b>{state.pieces.filter(piece=>piece.team==='red'&&piece.position===WAITING).map(piece=><Pawn key={piece.id} team="red" selectable={selectable.includes(piece.id)} hinting={state.hinting&&selectable.includes(piece.id)} onActivate={()=>choosePiece(piece.id)}/>)}</div><div><b>파랑팀 대기</b>{state.pieces.filter(piece=>piece.team==='blue'&&piece.position===WAITING).map(piece=><Pawn key={piece.id} team="blue" selectable={selectable.includes(piece.id)} hinting={state.hinting&&selectable.includes(piece.id)} onActivate={()=>choosePiece(piece.id)}/>)}</div></div>{devMode&&<div className="yut-dev-tests" aria-label="개발용 강제 결과"><b>개발 테스트</b>{resultNames.map(name=><button key={name} type="button" disabled={!canThrow} onPointerUp={()=>throwYut(name)}>{name}</button>)}</div>}</aside>{showRules&&<Rules close={()=>setShowRules(false)}/>} {confirm&&<dialog open className="png-yut-modal"><div className="confirm-card"><h2>{confirm==='home'?'처음 화면으로 갈까요?':'새로 시작할까요?'}</h2><p>지금까지의 놀이는 사라져요.</p><div><Button variant="outline" onPointerUp={()=>setConfirm(null)}>계속 놀기</Button><Button onPointerUp={()=>confirm==='home'?onHome():reset()}>네, 시작해요</Button></div></div></dialog>}{state.winner&&<dialog open className="png-yut-modal"><div className="victory-card"><img src={pawnSrc(state.winner,2)} alt="업힌 윷말"/><h2>{names[state.winner]} 승리!</h2><p>축하해요! 두 개의 말이 모두 도착했어요!</p><div><Button onPointerUp={reset}>같은 팀으로 다시 하기</Button><Button variant="outline" onPointerUp={onBack}>팀 바꾸기</Button><HomeIconButton onClick={onHome}/></div></div></dialog>}<button className="game-home-guard" onPointerUp={()=>setConfirm('home')} aria-label="게임을 끝내고 홈으로"/></section>;
}

export default function YutGame({home,soundOn,toggleSound}:{home:()=>void;soundOn:boolean;toggleSound:()=>void}){
  const[mode,setMode]=useState<Mode>('start');
  const[names,setNames]=useState<Record<Team,string>>({red:'빨강팀',blue:'파랑팀'});
  const guardedHome=()=>mode==='game'?document.querySelector<HTMLButtonElement>('.game-home-guard')?.dispatchEvent(new PointerEvent('pointerup',{bubbles:true})):home();
  return <main className="activity png-yut-app"><header className="topbar"><HomeIconButton onClick={guardedHome}/><div className="activity-title"><h1>함께하는 윷놀이</h1></div><SoundIconButton soundOn={soundOn} onClick={toggleSound} className="round-action sound-only"/></header>{mode==='start'&&<section className="png-yut-start"><h2>윷을 던지고 나온 수만큼 말을 움직여요!</h2><div><button onPointerUp={()=>setMode('practice')}><img src={`${asset}yut_flat.png`} alt="윷가락"/><b>윷놀이 연습</b><small>도·개·걸·윷·모·백도를 익혀요</small></button><button onPointerUp={()=>setMode('names')}><img src={`${asset}traditional_yut_board.png`} alt="전통 정사각형 윷판"/><b>함께 윷놀이</b><small>빨강팀과 파랑팀이 함께 놀아요</small></button></div></section>}{mode==='practice'&&<Practice soundOn={soundOn} onBack={()=>setMode('start')}/>} {mode==='names'&&<section className="png-team-names"><Button variant="outline" onPointerUp={()=>setMode('start')}>이전</Button><div><img src={`${asset}red_mal.png`} alt="빨강팀 말"/><img src={`${asset}blue_mal.png`} alt="파랑팀 말"/><h2>팀 이름을 정해요</h2><label>빨강 줄무늬 팀<Input value={names.red} maxLength={8} onChange={event=>setNames({...names,red:event.target.value||'빨강팀'})}/></label><label>파랑 꽃무늬 팀<Input value={names.blue} maxLength={8} onChange={event=>setNames({...names,blue:event.target.value||'파랑팀'})}/></label><Button onPointerUp={()=>setMode('rules')}>게임 시작</Button></div></section>}{mode==='rules'&&<Rules start={()=>setMode('game')}/>} {mode==='game'&&<Game key={`${names.red}-${names.blue}`} soundOn={soundOn} names={names} onBack={()=>setMode('names')} onHome={home}/>}</main>;
}
