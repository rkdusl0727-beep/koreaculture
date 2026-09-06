'use client';

import {useEffect,useMemo,useReducer,useRef,useState,type CSSProperties} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {
  CAPTURE_ANNOUNCEMENT,
  FINISHED,
  WAITING,
  finishedCount,
  initialPieces,
  makeYutThrow,
  movablePieceIds,
  movePath,
  moveTarget,
  possibleRoutes,
  placeStartingPiece,
  resolveMove,
  startingSetupPieceIds,
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
type Phase='setup'|'ready'|'rolling'|'awaitingMove'|'choosingPath'|'stepping'|'moving'|'resolving'|'extraThrow'|'turnEnd'|'gameOver';
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

function playVictorySound(enabled:boolean){
  if(!enabled)return;
  const ctx=audioContext();
  if(!ctx)return;
  const start=ctx.currentTime;
  [523,659,784,1046,1318].forEach((frequency,index)=>{
    const osc=ctx.createOscillator();
    const gain=ctx.createGain();
    const at=start+index*.11;
    osc.type=index%2?'triangle':'sine';
    osc.frequency.setValueAtTime(frequency,at);
    gain.gain.setValueAtTime(.0001,at);
    gain.gain.exponentialRampToValueAtTime(.2,at+.018);
    gain.gain.exponentialRampToValueAtTime(.0001,at+.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at+.32);
  });
  window.setTimeout(()=>void ctx.close(),1500);
}

const keyActivate=(activate:()=>void)=>(event:React.KeyboardEvent)=>{
  if(event.key==='Enter'||event.key===' '){event.preventDefault();activate()}
};
const pawnSrc=(team:Team,count:number)=>`${asset}${team}_${count>1?'mal_stack':'mal'}.png`;

function Pawn({team,count=1,selectable=false,hinting=false,moving=false,onActivate}:{team:Team;count?:number;selectable?:boolean;hinting?:boolean;moving?:boolean;onActivate?:()=>void}){
  return <button type="button" className={`png-pawn ${team} ${selectable?'selectable':''} ${hinting?'hinting':''} ${moving?'moving':''}`} onPointerUp={event=>{event.preventDefault();if(selectable)onActivate?.()}} onKeyDown={keyActivate(()=>selectable&&onActivate?.())} disabled={!selectable} aria-label={`${team==='red'?'빨강':'파랑'}팀 말 ${count}개`}><img src={pawnSrc(team,count)} alt=""/></button>;
}

function ResultIcon({name}:{name:ResultName}){
  return <img className="result-png" src={`${asset}icons/${icon[name]}`} alt=""/>;
}

function YutSticks({faces,rolling,onThrow,disabled,label}:{faces:readonly Face[];rolling:boolean;onThrow:()=>void;disabled:boolean;label?:string}){
  const start=useRef<number|null>(null);
  const[scatter,setScatter]=useState(0);
  const throwNow=()=>{if(disabled)return;setScatter(value=>(value+1)%stickScatters.length);onThrow()};
  const layout=stickScatters[scatter];
  return <section className="png-throw-zone"><div className="throw-mat"><div className="throw-mat-inner"><img className="mat-png" src={`${asset}yut_throw_mat.png`} alt="전통 윷 던지기 놀이판"/><div className={`png-sticks ${rolling?'rolling':''}`} onPointerDown={event=>{if(disabled)return;start.current=event.clientY;event.currentTarget.setPointerCapture(event.pointerId)}} onPointerUp={event=>{if(start.current!==null&&start.current-event.clientY>35)throwNow();start.current=null}}>{faces.map((face,index)=>{const spot=layout[index];const style={'--stick-x':`${spot.x}%`,'--stick-y':`${spot.y}%`,'--stick-r':`${spot.r}deg`,'--stick-delay':`${index*.05}s`} as CSSProperties;return <span key={index} style={style}><img src={`${asset}yut_${face}_trimmed.png`} alt={face==='round'?'둥근 면':face==='backdo'?'백도 표시 면':'평평한 면'}/></span>})}</div></div></div><Button className="png-throw-button" onPointerUp={event=>{event.preventDefault();throwNow()}} onKeyDown={keyActivate(throwNow)} disabled={disabled}>{rolling?'윷이 날아가요':label||'윷 던지기'}</Button></section>;
}

type Target={display:number;actual:number;route:Route;label?:string;pieceId?:string;finishing?:boolean};
function Board({pieces,selectable=[],targets=[],hintTargets=[],hinting=false,movingIds=[],onPiece,onTarget}:{pieces:Piece[];selectable?:string[];targets?:Target[];hintTargets?:Target[];hinting?:boolean;movingIds?:string[];onPiece:(id:string)=>void;onTarget:(target:Target)=>void}){
  const grouped=useMemo(()=>{
    const groups=new Map<string,Piece[]>();
    pieces.filter(piece=>piece.status==='onBoard'&&piece.currentNode!==null).forEach(piece=>{const key=`${piece.team}-${piece.currentNode}`;groups.set(key,[...(groups.get(key)||[]),piece])});
    return[...groups.values()];
  },[pieces]);
  const readyByTeam=useMemo(()=>({red:pieces.filter(piece=>piece.team==='red'&&piece.status==='ready'),blue:pieces.filter(piece=>piece.team==='blue'&&piece.status==='ready')}),[pieces]);
  const home=nodeMap.get(0)!;
  return <div className="traditional-board" aria-label="정사각형 29밭 전통 윷판"><img className="board-png" src={`${asset}traditional_yut_board.png`} alt="외곽 20밭과 X자 지름길이 있는 전통 윷판"/>{nodes.map(node=>{const option=targets.find(target=>target.display===node.id);const hints=hintTargets.filter(target=>target.display===node.id);return <button key={node.id} type="button" data-yut-target={node.id} className={`board-touch ${option?'target':''} ${option?.finishing?'finish-target':''} ${option?.route==='outer'?'route-outer':''} ${option&&option.route!=='outer'?'route-shortcut':''} ${hints.length?'hint-destination':''} ${hints.some(target=>target.route!=='outer')?'shortcut-hint':''} ${node.id===0?'home':''}`} style={{left:`${node.x}%`,top:`${node.y}%`}} disabled={!option} onPointerDown={event=>{event.preventDefault();if(option)onTarget(option)}} onKeyDown={keyActivate(()=>option&&onTarget(option))} aria-label={option?.label||(node.id===0?'출발과 도착':`${node.id}번 밭`)}>{node.id===0&&<span>{option?.finishing?'도착!':'출발·도착'}</span>}{option?.label&&node.id!==0&&<b className="route-choice-label">{option.label}</b>}</button>})}{grouped.map(group=>{const piece=group[0];const node=nodeMap.get(piece.currentNode!)!;const active=group.find(item=>selectable.includes(item.id));const ids=group.map(item=>item.id);return <div key={`${piece.team}-${piece.currentNode}`} className={`pawn-anchor ${piece.team}`} style={{left:`${node.x}%`,top:`${node.y}%`}}><Pawn team={piece.team} count={group.length} selectable={!!active} hinting={hinting&&!!active} moving={ids.some(id=>movingIds.includes(id))} onActivate={()=>active&&onPiece(active.id)}/></div>})}{(['red','blue'] as Team[]).map(team=>{const ready=readyByTeam[team];if(!ready.length)return null;const active=ready.find(piece=>selectable.includes(piece.id));const offset=team==='red'?{x:-2.7,y:2.7}:{x:2.7,y:-2.7};return <div key={`ready-${team}`} className={`pawn-anchor ready-anchor ${team}`} style={{left:`${home.x+offset.x}%`,top:`${home.y+offset.y}%`}}><Pawn team={team} count={ready.length} selectable={!!active} hinting={hinting&&!!active} onActivate={()=>active&&onPiece(active.id)}/><small>{team==='red'?'빨강':'파랑'} 출발</small></div>})}</div>;
}

function Rules({close,start}:{close?:()=>void;start?:()=>void}){
  const steps=[['do_icon.png','1. 각 팀의 말을 하나씩 눌러 출발점에 놓아요.'],['do_icon.png','2. 윷을 던져요.'],['gae_icon.png','3. 밝게 표시된 칸을 한 칸씩 눌러 이동해요.'],['yut_icon.png','4. 같은 팀 말을 만나면 함께 가요.'],['geol_icon.png','5. 다른 팀 말을 만나면 잡아요.'],['mo_icon.png','6. 윷과 모는 한 번 더 던져요.'],['backdo_icon.png','7. 백도도 한 칸씩 눌러 이동해요.'],['do_icon.png','8. 말 두 개가 먼저 도착하면 이겨요.']];
  return <dialog open className="png-yut-modal"><div className="png-rules"><h2>쉬운 윷놀이 규칙</h2><div>{steps.map(([src,text])=><article key={text}><img src={`${asset}icons/${src}`} alt=""/><b>{text}</b></article>)}</div><p>같이 놀며 천천히 익혀요!</p>{start?<Button onPointerUp={start}>알았어요, 시작!</Button>:<Button onPointerUp={close}>규칙 닫기</Button>}</div></dialog>;
}

function TeamPanel({team,name,pieces,active}:{team:Team;name:string;pieces:Piece[];active:boolean}){
  const mine=pieces.filter(piece=>piece.team===team);
  return <article className={`png-team ${team} ${active?'active':''}`}><div><img src={pawnSrc(team,1)} alt=""/><h3>{name}</h3><strong>도착 {finishedCount(pieces,team)}/2</strong></div><p><span>출발 대기 <b>{mine.filter(piece=>piece.status==='ready'||piece.status==='waiting').length}</b></span><span>윷판 위 <b>{mine.filter(piece=>piece.status==='onBoard').length}</b></span></p></article>;
}

function TeamStation({team,name,pieces,selectable,onPiece}:{team:Team;name:string;pieces:Piece[];selectable:string[];onPiece:(id:string)=>void}){
  const mine=pieces.filter(piece=>piece.team===team);
  const waiting=mine.filter(piece=>piece.status==='waiting');
  const ready=mine.filter(piece=>piece.status==='ready');
  const finished=mine.filter(piece=>piece.status==='finished').sort((a,b)=>(a.finishOrder||0)-(b.finishOrder||0));
  return <article className={`team-station ${team}`}><h4>{name}</h4>{waiting.length>0&&<section className="piece-pick"><b>말 선택</b><div className="waiting-slots">{waiting.map(piece=><Pawn key={piece.id} team={team} selectable={selectable.includes(piece.id)} onActivate={()=>onPiece(piece.id)}/>)}</div></section>}<section className={`start-ready ${ready.length?'has-ready':''}`}><b>출발 대기</b><div className="starter-slots">{ready.length?<span className="board-ready-note">윷판 출발점 {ready.length}개</span>:null}</div></section><section><b>도착한 말</b><div className="finish-slots">{[0,1].map(index=>{const piece=finished[index];return <span key={index} className={piece?'filled':''}>{piece?<><img src={pawnSrc(team,1)} alt=""/><small>{piece.finishOrder}번째 도착</small></>:'☆'}</span>})}</div></section></article>;
}

function Practice({soundOn,onBack}:{soundOn:boolean;onBack:()=>void}){
  const[faces,setFaces]=useState<readonly Face[]>(initialFaces);
  const[rolling,setRolling]=useState(false);
  const[result,setResult]=useState<ThrowResult|null>(null);
  const[seen,setSeen]=useState<ResultName[]>([]);
  const[piece,setPiece]=useState<Piece>({id:'practice',team:'red',teamId:'red',status:'ready',currentNode:null,previousPath:[],finishOrder:null,route:'outer'});
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
      if(roll.moveDirection==='backward'&&piece.status==='ready')timer.current=window.setTimeout(()=>{locked.current=false;setResult(null);setMessage('연습에서는 말을 앞으로 보낸 뒤 백도를 사용해 보세요.')},900);
    },650);
  };
  const move=()=>{
    if(!result||locked.current===false)return;
    const route=possibleRoutes(piece,result)[0];
    const solved=resolveMove([piece],'red','practice',result,route);
    const reached=solved.finalPieces[0].status==='finished';
    if(reached)playArrivalSound(soundOn);
    setPiece(reached?{...solved.finalPieces[0],status:'ready',currentNode:null,previousPath:[],finishOrder:null}:solved.finalPieces[0]);
    locked.current=false;
    setResult(null);
    setMessage(reached?'도착했어요! 다시 출발해요.':seen.length===6?'윷놀이 준비 완료!':'다시 윷을 던져 보세요!');
  };
  return <section className="practice-screen"><div className="practice-top"><Button variant="outline" onPointerUp={onBack}>이전</Button><h2>윷놀이 연습</h2><div>{resultNames.map(name=><span className={seen.includes(name)?'seen':''} key={name}><ResultIcon name={name}/><b>{name}</b></span>)}</div></div><div className="practice-layout"><div className="practice-board"><Board pieces={piece.status==='onBoard'?[piece]:[]} selectable={result&&piece.status==='onBoard'?['practice']:[]} onPiece={move} onTarget={()=>{}}/>{piece.status==='ready'&&<div className="practice-wait"><Pawn team="red" selectable={!!result&&result.moveDirection==='forward'} onActivate={move}/><b>연습 말</b></div>}</div><aside><YutSticks faces={faces} rolling={rolling} onThrow={throwYut} disabled={rolling||!!result}/><div className="png-result"><strong>{result?.result||'준비'}</strong><p>{message}</p></div>{seen.length===6&&<div className="ready-badge">윷놀이 준비 완료!</div>}</aside></div></section>;
}

type MoveResolution=ReturnType<typeof resolveMove>;
type PendingMove={moveId:string;rollId:string;pieceId:string;route:Route;resolution:MoveResolution;nextStepIndex:number};
type GameState={
  names:Record<Team,string>;
  phase:Phase;
  pieces:Piece[];
  currentTeam:Team|null;
  startingTeam:Team|null;
  currentRoll:ThrowResult|null;
  lastRoll:ThrowResult|null;
  selectedPieceId:string|null;
  routeOptions:Route[];
  pendingMove:PendingMove|null;
  message:string;
  bonus:boolean;
  winner:Team|null;
  hinting:boolean;
  captureAnnouncementId:string|null;
};
type Action=
  |{type:'START_WITH_PIECE';pieceId:string}
  |{type:'ROLL_START';roll:ThrowResult}
  |{type:'ROLL_SETTLED';rollId:string}
  |{type:'SELECT_PIECE';pieceId:string}
  |{type:'CHOOSE_ROUTE';route:Route}
  |{type:'ADVANCE_STEP'}
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

function piecesAtNode(pieces:Piece[],pending:PendingMove,node:number):Piece[]{
  if(node<0)return pieces;
  return pieces.map(piece=>pending.resolution.movingIds.includes(piece.id)?{...piece,status:'onBoard' as const,currentNode:node,route:pending.route}:piece);
}

function advanceManualMove(state:GameState,pending:PendingMove):GameState{
  const node=pending.resolution.path[pending.nextStepIndex];
  if(node===undefined)return state;
  const nextPending={...pending,nextStepIndex:pending.nextStepIndex+1};
  const last=nextPending.nextStepIndex>=pending.resolution.path.length;
  if(node===FINISHED){
    return{...state,phase:'moving',pendingMove:nextPending,routeOptions:[],hinting:false,message:'도착점을 통과해 말을 완성하고 있어요!'};
  }
  if(last){
    return{...state,phase:'resolving',pieces:pending.resolution.finalPieces,pendingMove:nextPending,routeOptions:[],hinting:false,message:`${state.currentRoll?.result||''} 이동을 마쳤어요.`};
  }
  return{...state,phase:'stepping',pieces:piecesAtNode(state.pieces,pending,node),pendingMove:nextPending,routeOptions:[],hinting:false,message:`${nextPending.nextStepIndex}칸 이동했어요. 밝게 표시된 다음 칸을 눌러요.`};
}

function beginManualMove(state:GameState,pieceId:string,route:Route):GameState{
  if(!state.currentRoll||!state.currentTeam)return state;
  const resolution=resolveMove(state.pieces,state.currentTeam,pieceId,state.currentRoll,route);
  const pending:PendingMove={moveId:nextMoveId(),rollId:state.currentRoll.rollId,pieceId,route,resolution,nextStepIndex:0};
  return advanceManualMove({...state,selectedPieceId:pieceId,pendingMove:pending},pending);
}

function initialGameState(names:Record<Team,string>):GameState{
  return{names,phase:'setup',pieces:initialPieces(),currentTeam:null,startingTeam:null,currentRoll:null,lastRoll:null,selectedPieceId:null,routeOptions:[],pendingMove:null,message:'먼저 시작할 팀의 말을 출발선에 놓아 보세요!',bonus:false,winner:null,hinting:false,captureAnnouncementId:null};
}

function gameReducer(state:GameState,action:Action):GameState{
  switch(action.type){
    case 'START_WITH_PIECE':{
      if(state.phase!=='setup'&&state.phase!=='ready'&&state.phase!=='extraThrow')return state;
      const selected=state.pieces.find(piece=>piece.id===action.pieceId&&piece.status==='waiting');
      if(!selected||(state.phase==='setup'&&!startingSetupPieceIds(state.pieces,state.startingTeam).includes(action.pieceId))||(state.phase!=='setup'&&selected.team!==state.currentTeam))return state;
      const placed=placeStartingPiece(state.pieces,action.pieceId,state.startingTeam);
      const first=state.startingTeam===null;
      const bothTeamsReady=(['red','blue'] as Team[]).every(team=>placed.pieces.some(piece=>piece.team===team&&piece.status==='ready'));
      const completingSetup=state.phase==='setup'&&bothTeamsReady;
      return{...state,phase:completingSetup?'ready':state.phase,pieces:placed.pieces,currentTeam:placed.currentTeam,startingTeam:placed.currentTeam,selectedPieceId:null,message:first?`${state.names[placed.currentTeam]}이 먼저 시작해요! 이제 반대 팀 말 하나를 출발점에 놓아요.`:completingSetup?`빨강팀과 파랑팀 말이 하나씩 출발점에 놓였어요. ${state.names[placed.currentTeam]}부터 윷을 던져요!`:`${state.names[placed.currentTeam]} 말이 출발점에 놓였어요. 윷을 던져요!`};
    }
    case 'ROLL_START':
      if(!state.currentTeam||state.winner||(state.phase!=='ready'&&state.phase!=='extraThrow'))return state;
      return{...state,phase:'rolling',currentRoll:action.roll,selectedPieceId:null,routeOptions:[],pendingMove:null,bonus:false,hinting:false,captureAnnouncementId:null,message:'윷을 던지고 있어요!'};
    case 'ROLL_SETTLED':{
      if(state.phase!=='rolling'||state.currentRoll?.rollId!==action.rollId)return state;
      if(!state.currentTeam)return state;
      const movable=movablePieceIds(state.pieces,state.currentTeam,state.currentRoll);
      if(!movable.length)return{...state,phase:'turnEnd',lastRoll:state.currentRoll,message:'움직일 수 있는 말이 없어요. 다음 팀 차례예요.'};
      const message=`${state.currentRoll.sentence} 움직일 말을 한 번 눌러요.`;
      return{...state,phase:'awaitingMove',lastRoll:state.currentRoll,message};
    }
    case 'SELECT_PIECE':{
      if(state.phase!=='awaitingMove'||!state.currentRoll||!state.currentTeam)return state;
      if(!movablePieceIds(state.pieces,state.currentTeam,state.currentRoll).includes(action.pieceId))return state;
      const piece=state.pieces.find(item=>item.id===action.pieceId)!;
      const routes=possibleRoutes(piece,state.currentRoll);
      return{...state,phase:'choosingPath',selectedPieceId:action.pieceId,routeOptions:routes,hinting:false,message:routes.length>1?'두 길 중 첫 번째 이동 칸을 한 번 눌러요.':'밝게 표시된 첫 번째 이동 칸을 눌러요.'};
    }
    case 'CHOOSE_ROUTE':
      if(state.phase!=='choosingPath'||!state.selectedPieceId||!state.routeOptions.includes(action.route))return state;
      return beginManualMove(state,state.selectedPieceId,action.route);
    case 'ADVANCE_STEP':
      if(state.phase!=='stepping'||!state.pendingMove)return state;
      return advanceManualMove(state,state.pendingMove);
    case 'MOVE_COMMIT':
      if(state.phase!=='moving'||state.pendingMove?.moveId!==action.moveId)return state;
      if(state.pendingMove.resolution.won&&state.currentTeam)return{...state,phase:'gameOver',pieces:state.pendingMove.resolution.finalPieces,currentRoll:null,pendingMove:null,winner:state.currentTeam,message:`${state.names[state.currentTeam]}의 말이 모두 도착했어요! ${state.names[state.currentTeam]} 승리!`};
      return{...state,phase:'resolving',pieces:state.pendingMove.resolution.finalPieces,message:state.pendingMove.resolution.readyBackdo?'출발선에서 백도! 말이 바로 도착했어요!':state.pendingMove.resolution.target===FINISHED?'말이 도착한 말 칸으로 이동했어요!':'이동 결과를 확인하고 있어요.'};
    case 'RESOLVE_MOVE':{
      if(state.phase!=='resolving'||state.pendingMove?.moveId!==action.moveId)return state;
      const solved=state.pendingMove.resolution;
      if(solved.extraThrow)return{...state,phase:'extraThrow',currentRoll:null,pendingMove:null,selectedPieceId:null,bonus:true,captureAnnouncementId:solved.caughtIds.length?state.pendingMove.moveId:null,message:solved.caughtIds.length?CAPTURE_ANNOUNCEMENT:'한 번 더! 다시 윷을 던져요.'};
      return{...state,phase:'turnEnd',currentRoll:null,pendingMove:null,selectedPieceId:null,message:'이동이 끝났어요. 다음 팀 차례예요.'};
    }
    case 'NEXT_TURN':{
      if(state.phase!=='turnEnd')return state;
      if(!state.currentTeam)return state;
      const currentTeam=otherTeam(state.currentTeam);
      const canMove=state.pieces.some(piece=>piece.team===currentTeam&&(piece.status==='ready'||piece.status==='onBoard'));
      return{...state,phase:'ready',currentTeam,currentRoll:null,selectedPieceId:null,routeOptions:[],pendingMove:null,bonus:false,hinting:false,message:canMove?`${state.names[currentTeam]} 차례예요. 윷을 던져요!`:`${state.names[currentTeam]} 차례예요. 말 하나를 눌러 출발점에 놓아요!`};
    }
    case 'SHOW_HINT':
      if(state.phase!=='awaitingMove'&&state.phase!=='choosingPath'&&state.phase!=='stepping')return state;
      return{...state,hinting:true,message:state.phase==='awaitingMove'?'노란 테두리가 표시된 말을 눌러보세요!':'테두리가 표시된 다음 이동 칸을 눌러보세요!'};
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
  const celebratedWinner=useRef<Team|null>(null);
  const spokenCapture=useRef<string|null>(null);
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
    const settled=state.lastRoll;
    if(!settled||state.currentRoll?.rollId!==settled.rollId||(state.phase!=='awaitingMove'&&state.phase!=='turnEnd')||spokenRoll.current===settled.rollId)return;
    spokenRoll.current=settled.rollId;
    stopKoreanSpeech();
    speakKorean(settled.sentence,soundOn);
  },[state.phase,state.currentRoll?.rollId,state.lastRoll,soundOn]);

  useEffect(()=>{
    if(state.phase!=='moving'||!state.pendingMove)return;
    const moveId=state.pendingMove.moveId;
    if(state.pendingMove.resolution.target===FINISHED)playArrivalSound(soundOn);
    if(state.pendingMove.resolution.readyBackdo){stopKoreanSpeech();speakKorean('출발선에서 백도! 말이 바로 도착했어요!',soundOn)}
    const timer=window.setTimeout(()=>dispatch({type:'MOVE_COMMIT',moveId}),420);
    return()=>window.clearTimeout(timer);
  },[state.phase,state.pendingMove,soundOn]);

  useEffect(()=>{
    if(state.phase!=='resolving'||!state.pendingMove)return;
    const moveId=state.pendingMove.moveId;
    const timer=window.setTimeout(()=>dispatch({type:'RESOLVE_MOVE',moveId}),160);
    return()=>window.clearTimeout(timer);
  },[state.phase,state.pendingMove]);

  useEffect(()=>{
    if(state.phase!=='turnEnd')return;
    const timer=window.setTimeout(()=>dispatch({type:'NEXT_TURN'}),900);
    return()=>window.clearTimeout(timer);
  },[state.phase]);

  useEffect(()=>{
    if(!state.winner||celebratedWinner.current===state.winner)return;
    celebratedWinner.current=state.winner;
    playVictorySound(soundOn);
  },[state.winner,soundOn]);

  useEffect(()=>{
    if(state.phase!=='extraThrow'||!state.captureAnnouncementId||spokenCapture.current===state.captureAnnouncementId)return;
    spokenCapture.current=state.captureAnnouncementId;
    stopKoreanSpeech();
    speakKorean(CAPTURE_ANNOUNCEMENT,soundOn);
  },[state.phase,state.captureAnnouncementId,soundOn]);

  useEffect(()=>{
    if(!state.hinting)return;
    const timer=window.setTimeout(()=>dispatch({type:'CLEAR_HINT'}),2000);
    return()=>window.clearTimeout(timer);
  },[state.hinting]);

  const selectable=useMemo(()=>{
    if(state.phase==='setup')return startingSetupPieceIds(state.pieces,state.startingTeam);
    if((state.phase==='ready'||state.phase==='extraThrow')&&state.currentTeam)return state.pieces.filter(piece=>piece.team===state.currentTeam&&piece.status==='waiting').map(piece=>piece.id);
    if(state.phase==='awaitingMove'&&state.currentRoll&&state.currentTeam){
      return movablePieceIds(state.pieces,state.currentTeam,state.currentRoll);
    }
    return[];
  },[state]);

  const routeTargets=useMemo<Target[]>(()=>{
    if(!state.currentRoll||!state.currentTeam)return[];
    if(state.phase==='choosingPath'&&state.selectedPieceId){
      const selectedPieceId=state.selectedPieceId;
      const piece=state.pieces.find(item=>item.id===selectedPieceId);
      if(!piece)return[];
      return state.routeOptions.map(route=>{const path=movePath(piece,state.currentRoll!,route);const actual=path[0];return{route,actual,display:actual===FINISHED||actual===WAITING?0:actual,label:actual===FINISHED?'도착!':state.routeOptions.length>1?routeLabel(route):'1칸',pieceId:selectedPieceId,finishing:actual===FINISHED}});
    }
    if(state.phase==='stepping'&&state.pendingMove){
      const actual=state.pendingMove.resolution.path[state.pendingMove.nextStepIndex];
      if(actual===undefined)return[];
      return[{route:state.pendingMove.route,actual,display:actual===FINISHED||actual===WAITING?0:actual,label:actual===FINISHED?'도착!':'다음 칸',pieceId:state.pendingMove.pieceId,finishing:actual===FINISHED}];
    }
    return[];
  },[state]);

  const hintTargets=useMemo<Target[]>(()=>{
    if(!state.hinting||!state.currentRoll||!state.currentTeam)return[];
    if(state.phase==='choosingPath'||state.phase==='stepping')return routeTargets;
    if(state.phase!=='awaitingMove')return[];
    return movablePieceIds(state.pieces,state.currentTeam,state.currentRoll).flatMap(pieceId=>{
      const piece=state.pieces.find(item=>item.id===pieceId)!;
      return possibleRoutes(piece,state.currentRoll!).map(route=>{const actual=moveTarget(piece,state.currentRoll!,route);return{route,actual,display:actual===FINISHED||actual===WAITING?0:actual}});
    });
  },[state,routeTargets]);

  const throwYut=()=>{
    const current=stateRef.current;
    if(throwInputLock.current||!current.currentTeam||current.winner||(current.phase!=='ready'&&current.phase!=='extraThrow'))return;
    throwInputLock.current=true;
    const roll=makeYutThrow();
    stopKoreanSpeech();
    dispatch({type:'ROLL_START',roll});
    playThrowSound(soundOn);
  };
  const choosePiece=(pieceId:string)=>{
    const current=stateRef.current;
    const waiting=current.pieces.find(piece=>piece.id===pieceId)?.status==='waiting';
    dispatch(waiting&&current.phase!=='awaitingMove'?{type:'START_WITH_PIECE',pieceId}:{type:'SELECT_PIECE',pieceId});
  };
  const showHint=()=>{
    const current=stateRef.current;
    if(hintInputLock.current||(current.phase!=='awaitingMove'&&current.phase!=='choosingPath'&&current.phase!=='stepping'))return;
    hintInputLock.current=true;
    dispatch({type:'SHOW_HINT'});
    stopKoreanSpeech();
    speakKorean(current.phase==='awaitingMove'?'노란 테두리가 표시된 말을 눌러보세요!':'테두리가 표시된 다음 이동 칸을 눌러보세요!',soundOn);
  };
  const reset=()=>{stopKoreanSpeech();spokenRoll.current=null;spokenCapture.current=null;celebratedWinner.current=null;throwInputLock.current=false;hintInputLock.current=false;dispatch({type:'RESET'});setConfirm(null)};
  const visibleFaces=state.phase==='rolling'?(state.lastRoll?.faces||initialFaces):(state.currentRoll?.faces||state.lastRoll?.faces||initialFaces);
  const canThrow=!!state.currentTeam&&(state.phase==='ready'||state.phase==='extraThrow')&&!state.winner&&state.pieces.some(piece=>piece.team===state.currentTeam&&(piece.status==='ready'||piece.status==='onBoard'));
  const movingIds=state.pendingMove?.resolution.movingIds||[];
  const resultLabel=state.phase==='setup'?'선공 정하기':state.phase==='rolling'?'던지는 중':state.currentRoll?.result||state.lastRoll?.result||'준비';

  return <section className={`png-game phase-${state.phase}`}><div className="game-board-column"><div className="board-heading"><h2>전통 윷판</h2><span>출발·도착은 오른쪽 아래예요</span></div><Board pieces={state.pieces} selectable={selectable} targets={routeTargets} hintTargets={hintTargets} hinting={state.hinting} movingIds={movingIds} onPiece={choosePiece} onTarget={target=>dispatch(stateRef.current.phase==='stepping'?{type:'ADVANCE_STEP'}:{type:'CHOOSE_ROUTE',route:target.route})}/></div><aside className="game-side"><div className="side-actions"><Button variant="outline" onPointerUp={()=>setShowRules(true)}>규칙 다시 보기</Button><Button variant="outline" disabled={state.hinting||(state.phase!=='awaitingMove'&&state.phase!=='choosingPath'&&state.phase!=='stepping')} onPointerUp={showHint}>힌트</Button><Button variant="outline" onPointerUp={()=>setConfirm('restart')}>처음부터</Button></div><div className="turn-box"><span>{state.phase==='setup'?'출발 준비':'현재 차례'}</span><strong className={state.currentTeam||''}>{state.currentTeam?names[state.currentTeam]:'선공을 골라요'}</strong><small>직전 결과: {state.lastRoll?.result||'없음'}</small>{state.bonus&&<b>한 번 더!</b>}</div><div className="team-row"><TeamPanel team="red" name={names.red} pieces={state.pieces} active={state.currentTeam==='red'}/><TeamPanel team="blue" name={names.blue} pieces={state.pieces} active={state.currentTeam==='blue'}/></div><YutSticks faces={visibleFaces} rolling={state.phase==='rolling'} onThrow={throwYut} disabled={!canThrow} label={state.phase==='extraThrow'?'한 번 더 던지기':undefined}/><div className="result-guide"><div className="result-strip">{resultNames.map(name=><span className={state.lastRoll?.result===name?'active':''} key={name}><ResultIcon name={name}/><b>{name}</b></span>)}</div><div className="png-result"><strong>{resultLabel}</strong><p>{state.message}</p></div></div><div className="waiting-area"><TeamStation team="red" name={names.red} pieces={state.pieces} selectable={selectable} onPiece={choosePiece}/><TeamStation team="blue" name={names.blue} pieces={state.pieces} selectable={selectable} onPiece={choosePiece}/></div></aside>{showRules&&<Rules close={()=>setShowRules(false)}/>} {confirm&&<dialog open className="png-yut-modal"><div className="confirm-card"><h2>{confirm==='home'?'처음 화면으로 갈까요?':'새로 시작할까요?'}</h2><p>지금까지의 놀이는 사라져요.</p><div><Button variant="outline" onPointerUp={()=>setConfirm(null)}>계속 놀기</Button><Button onPointerUp={()=>confirm==='home'?onHome():reset()}>네, 시작해요</Button></div></div></dialog>}{state.winner&&<dialog open className="png-yut-modal"><div className="victory-card"><img src={pawnSrc(state.winner,2)} alt="업힌 윷말"/><h2>{names[state.winner]}의 말이 모두 도착했어요! {names[state.winner]} 승리!</h2><p>도착한 말 2개로 승부가 결정됐어요.</p><div><Button onPointerUp={reset}>같은 팀으로 다시 하기</Button><Button variant="outline" onPointerUp={onBack}>팀 바꾸기</Button><HomeIconButton onClick={onHome}/></div></div></dialog>}<button className="game-home-guard" onPointerUp={()=>setConfirm('home')} aria-label="게임을 끝내고 홈으로"/></section>;
}

export default function YutGame({home,soundOn,toggleSound}:{home:()=>void;soundOn:boolean;toggleSound:()=>void}){
  const[mode,setMode]=useState<Mode>('start');
  const[names,setNames]=useState<Record<Team,string>>({red:'빨강팀',blue:'파랑팀'});
  const guardedHome=()=>mode==='game'?document.querySelector<HTMLButtonElement>('.game-home-guard')?.dispatchEvent(new PointerEvent('pointerup',{bubbles:true})):home();
  return <main className="activity png-yut-app"><header className="topbar"><HomeIconButton onClick={guardedHome}/><div className="activity-title"><h1>함께하는 윷놀이</h1></div><SoundIconButton soundOn={soundOn} onClick={toggleSound} className="round-action sound-only"/></header>{mode==='start'&&<section className="png-yut-start"><h2>윷을 던지고 나온 수만큼 말을 움직여요!</h2><div><button onPointerUp={()=>setMode('practice')}><img src={`${asset}yut_flat.png`} alt="윷가락"/><b>윷놀이 연습</b><small>도·개·걸·윷·모·백도를 익혀요</small></button><button onPointerUp={()=>setMode('names')}><img src={`${asset}traditional_yut_board.png`} alt="전통 정사각형 윷판"/><b>함께 윷놀이</b><small>빨강팀과 파랑팀이 함께 놀아요</small></button></div></section>}{mode==='practice'&&<Practice soundOn={soundOn} onBack={()=>setMode('start')}/>} {mode==='names'&&<section className="png-team-names"><Button variant="outline" onPointerUp={()=>setMode('start')}>이전</Button><div><img src={`${asset}red_mal.png`} alt="빨강팀 말"/><img src={`${asset}blue_mal.png`} alt="파랑팀 말"/><h2>팀 이름을 정해요</h2><label>빨강 줄무늬 팀<Input value={names.red} maxLength={8} onChange={event=>setNames({...names,red:event.target.value||'빨강팀'})}/></label><label>파랑 꽃무늬 팀<Input value={names.blue} maxLength={8} onChange={event=>setNames({...names,blue:event.target.value||'파랑팀'})}/></label><Button onPointerUp={()=>setMode('rules')}>게임 시작</Button></div></section>}{mode==='rules'&&<Rules start={()=>setMode('game')}/>} {mode==='game'&&<Game key={`${names.red}-${names.blue}`} soundOn={soundOn} names={names} onBack={()=>setMode('names')} onHome={home}/>}</main>;
}
