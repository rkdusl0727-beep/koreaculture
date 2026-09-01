'use client';

import { useEffect, useRef, useState } from 'react';
import { Home, MapPinned, Music2, Pause, Play, RotateCcw, Search, Sparkles, Trash2, Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Screen = 'home' | 'map' | 'hanbok' | 'hanok' | 'music' | 'detective';
type Instrument = '장구' | '북' | '징' | '꽹과리';
const colors = [{name:'단청 빨강',value:'#e7473c'},{name:'쪽빛 파랑',value:'#2878b8'},{name:'솔잎 초록',value:'#318b61'},{name:'햇살 노랑',value:'#f2bd37'},{name:'연꽃 분홍',value:'#e8899b'}];
const patterns = [{name:'꽃',mark:'✿'},{name:'구름',mark:'☁'},{name:'태극',mark:'◉'},{name:'무늬 없음',mark:'·'}];

const regions = [
  {name:'서울',top:'19%',left:'42%',emoji:'🏯',title:'경복궁',desc:'조선의 임금님이 살고 일하던 큰 궁궐이에요.',mission:'🔔'},
  {name:'전주',top:'50%',left:'32%',emoji:'🍚',title:'전주비빔밥',desc:'여러 가지 나물과 밥을 알록달록 비벼 먹어요.',mission:'🥢'},
  {name:'경주',top:'48%',left:'68%',emoji:'👑',title:'신라의 금관',desc:'옛 신라 사람들이 만든 반짝이는 금관이에요.',mission:'✨'},
  {name:'제주',top:'82%',left:'26%',emoji:'🌋',title:'한라산',desc:'제주 한가운데 우뚝 솟은 우리나라 산이에요.',mission:'🍊'},
];

const menus = [
  {id:'map' as Screen,number:'01',title:'우리나라 지도 탐험',hint:'지도를 누르고 문화를 찾아요',icon:MapPinned,color:'red',art:'🗺️'},
  {id:'hanbok' as Screen,number:'02',title:'한복 디자이너',hint:'알록달록 한복을 꾸며요',icon:Sparkles,color:'blue',art:'👘'},
  {id:'hanok' as Screen,number:'03',title:'한옥 짓기',hint:'우리 손으로 집을 지어요',icon:Home,color:'green',art:'🏠'},
  {id:'music' as Screen,number:'04',title:'국악 연주',hint:'신나는 우리 소리를 내요',icon:Music2,color:'yellow',art:'🥁'},
  {id:'detective' as Screen,number:'05',title:'문화재 탐정 미션',hint:'꼭꼭 숨은 보물을 찾아요',icon:Search,color:'purple',art:'🔍'},
];

function tone(instrument: Instrument | 'ui', soundOn: boolean, at = 0) {
  if (!soundOn || typeof window === 'undefined') return;
  const AudioContextClass = window.AudioContext || (window as typeof window & {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
  const ctx = new AudioContextClass();
  const start = ctx.currentTime + at;
  const gain = ctx.createGain(); gain.connect(ctx.destination); gain.gain.setValueAtTime(.0001,start);
  const osc = ctx.createOscillator(); osc.connect(gain);
  const setup = {
    '장구':['triangle',310,.32], '북':['sine',105,.46], '징':['sine',520,1.15], '꽹과리':['square',760,.38], 'ui':['sine',440,.12]
  } as const;
  const [wave,freq,duration] = setup[instrument]; osc.type=wave; osc.frequency.setValueAtTime(freq,start);
  if(instrument==='북') osc.frequency.exponentialRampToValueAtTime(55,start+duration);
  if(instrument==='징') osc.frequency.linearRampToValueAtTime(470,start+duration);
  gain.gain.exponentialRampToValueAtTime(instrument==='징' ? .18 : .32,start+.02);
  gain.gain.exponentialRampToValueAtTime(.0001,start+duration); osc.start(start); osc.stop(start+duration+.03);
  window.setTimeout(()=>ctx.close(),(at+duration+1)*1000);
}

function Confetti() { return <div className="confetti" aria-hidden="true">{Array.from({length:24},(_,i)=><i key={i} style={{'--i':i} as React.CSSProperties} />)}</div>; }

function TopBar({title,onHome,soundOn,onSound}:{title:string;onHome:()=>void;soundOn:boolean;onSound:()=>void}) {
  return <header className="topbar"><Button onClick={onHome} variant="outline" className="round-action"><Home/> <span>처음으로</span></Button><div className="activity-title"><span>✦</span><h1>{title}</h1><span>✦</span></div><Button onClick={onSound} variant="outline" className="round-action sound-only" aria-label={soundOn?'소리 끄기':'소리 켜기'}>{soundOn?<Volume2/>:<VolumeX/>}<span>{soundOn?'소리 켬':'소리 끔'}</span></Button></header>;
}

function HomeScreen({go,soundOn,toggleSound}:{go:(s:Screen)=>void;soundOn:boolean;toggleSound:()=>void}) {
  return <main className="app-shell"><div className="dancheong" aria-hidden="true"/><header className="hero"><div className="hero-copy"><div className="eyebrow"><span>✦</span> 오늘의 문화 탐험 <span>✦</span></div><h1>우리나라<br/><em>문화 탐험대</em></h1><p>우리나라의 멋과 지혜를 찾아 떠나요!</p></div><div className="hero-mark" aria-hidden="true"><div className="sun">☀</div><div className="mountain mountain-a"/><div className="mountain mountain-b"/><div className="cloud">☁</div><div className="gate">🏯</div></div></header><section className="menu-section" aria-labelledby="menu-title"><div className="section-heading"><div><span className="mini-label">어디로 떠나볼까요?</span><h2 id="menu-title">탐험을 골라요!</h2></div><Button onClick={toggleSound} aria-label={soundOn?'소리 끄기':'소리 켜기'} variant="outline" size="icon" className="sound-button">{soundOn?<Volume2/>:<VolumeX/>}</Button></div><div className="menu-grid">{menus.map(({id,number,title,hint,icon:Icon,color,art},index)=><button key={id} className={`menu-card card-${color} ${index===0?'featured':''}`} onClick={()=>go(id)} type="button"><span className="menu-number">{number}</span><span className="menu-art" aria-hidden="true">{art}</span><span className="menu-text"><Icon/><strong>{title}</strong><small>{hint}</small></span><span className="go" aria-hidden="true">→</span></button>)}</div></section><footer><span>●</span><span>●</span><span>●</span> 준비됐나요? 함께 출발!</footer></main>;
}

function MapActivity({home,soundOn,toggleSound}:{home:()=>void;soundOn:boolean;toggleSound:()=>void}) {
  const [selected,setSelected]=useState<(typeof regions)[number]|null>(null); const [found,setFound]=useState<string[]>([]);
  const find=(name:string)=>{if(!found.includes(name)){setFound([...found,name]);tone('ui',soundOn)}};
  return <main className="activity activity-map"><TopBar title="우리나라 지도 탐험" onHome={home} soundOn={soundOn} onSound={toggleSound}/><section className="activity-body split"><div className="instruction"><b>1</b><div><h2>지역을 눌러 보세요!</h2><p>어떤 문화 보물이 숨어 있을까요?</p></div></div><div className="map-board" aria-label="대한민국 문화 지도"><div className="map-silhouette"><span>대한민국</span></div>{regions.map(r=><button key={r.name} className="map-pin" style={{top:r.top,left:r.left}} onClick={()=>{setSelected(r);tone('ui',soundOn)}}><i>{r.emoji}</i><strong>{r.name}</strong>{found.includes(r.name)&&<em>✓</em>}</button>)}</div><aside className="progress-card"><span className="label">발견한 지역</span><strong>{found.length} / 4</strong><div className="dot-progress">{regions.map(r=><span key={r.name} className={found.includes(r.name)?'done':''}>{found.includes(r.name)?r.emoji:'?'}</span>)}</div><p>{found.length===4?'모든 문화 보물을 찾았어요!':'지역을 하나씩 탐험해요.'}</p></aside></section><Dialog open={!!selected} onOpenChange={open=>!open&&setSelected(null)}>{selected&&<DialogContent className="culture-dialog"><DialogHeader><div className="popup-art">{selected.emoji}</div><DialogTitle>{selected.name} · {selected.title}</DialogTitle><DialogDescription>{selected.desc}</DialogDescription></DialogHeader><div className="touch-mission"><b>숨은 그림을 찾아요!</b><div>{['🌟',selected.mission,'🌈'].map((item,i)=><button key={`${item}-${i}`} onClick={()=>item===selected.mission?find(selected.name):tone('ui',soundOn)} className={found.includes(selected.name)&&item===selected.mission?'found':''}>{item}</button>)}</div><p>{found.includes(selected.name)?'찾았다! 참 잘했어요! 🎉':'보물을 톡 눌러 보세요.'}</p></div></DialogContent>}</Dialog></main>;
}

function HanbokActivity({home,soundOn,toggleSound}:{home:()=>void;soundOn:boolean;toggleSound:()=>void}) {
  const [type,setType]=useState<'여자'|'남자'>('여자'); const [top,setTop]=useState(colors[0].value); const [bottom,setBottom]=useState(colors[1].value); const [pattern,setPattern]=useState(patterns[0]); const [done,setDone]=useState(false); const [name,setName]=useState('');
  return <main className="activity activity-hanbok"><TopBar title="한복 디자이너" onHome={home} soundOn={soundOn} onSound={toggleSound}/><section className="designer-grid"><aside className="control-panel"><div className="choice-group"><h2><span>1</span> 누구의 한복일까요?</h2><div className="segmented hanbok-types"><button className={type==='여자'?'active':''} onClick={()=>setType('여자')}><img src="/hanbok-girl.png" alt="여자아이 전통 한복"/><b>여자아이 한복</b><small>저고리와 치마</small></button><button className={type==='남자'?'active':''} onClick={()=>setType('남자')}><img src="/hanbok-boy.png" alt="남자아이 전통 한복"/><b>남자아이 한복</b><small>저고리와 바지</small></button></div></div><div className="choice-group"><h2><span>2</span> {type==='여자'?'저고리':'저고리·조끼'} 색</h2><div className="swatches">{colors.map(c=><button key={c.value} aria-label={c.name} className={top===c.value?'active':''} style={{background:c.value}} onClick={()=>{setTop(c.value);tone('ui',soundOn)}}/>)}</div></div><div className="choice-group"><h2><span>3</span> {type==='여자'?'치마':'바지'} 색</h2><div className="swatches">{colors.map(c=><button key={c.value} aria-label={c.name} className={bottom===c.value?'active':''} style={{background:c.value}} onClick={()=>setBottom(c.value)}/>)}</div></div><div className="choice-group"><h2><span>4</span> 전통무늬</h2><div className="pattern-list">{patterns.map(p=><button key={p.name} className={pattern.name===p.name?'active':''} onClick={()=>setPattern(p)}><b>{p.mark}</b>{p.name}</button>)}</div></div></aside><div className="hanbok-stage"><div className="stage-label">{type}아이의 나만의 한복</div><div className="hanbok-person"><div className="person-head"><img src={type==='여자'?'/hanbok-girl.png':'/hanbok-boy.png'} alt=""/></div><div className="garment top-garment" style={{backgroundColor:top}}><span>{pattern.mark}</span><b>저고리</b></div><div className={`garment bottom-garment ${type==='남자'?'pants':''}`} style={{backgroundColor:bottom}}><span>{pattern.mark}</span><b>{type==='여자'?'치마':'바지'}</b></div></div><Button onClick={()=>{setDone(true);tone('징',soundOn)}} className="complete-button"><Sparkles/> 완성하기</Button></div></section>{done&&<div className="celebrate-layer" role="dialog" aria-modal="true" aria-label="한복 완성"><Confetti/><div className="celebrate-card"><button className="close" onClick={()=>setDone(false)} aria-label="닫기"><X/></button><span className="trophy">🎊</span><h2>멋진 한복 완성!</h2><p>작품에 이름을 지어 주세요.</p><Input value={name} maxLength={12} onChange={e=>setName(e.target.value)} placeholder="예: 무지개 한복" className="name-input"/><Button onClick={()=>setDone(false)} className="keep-button">{name?`‘${name}’ 저장하지 않고 감상하기`:'작품 감상하기'}</Button><small>이름은 기기에 저장되지 않아요.</small></div></div>}</main>;
}

const hanokItems=[{id:'roof',name:'기와지붕',icon:'🏠',use:'비와 눈을 막아 줘요.'},{id:'gate',name:'대문',icon:'🚪',use:'집으로 들어가는 큰 문이에요.'},{id:'window',name:'창호문',icon:'▦',use:'한지를 발라 빛이 들어와요.'},{id:'floor',name:'마루',icon:'🟫',use:'시원하게 쉬는 나무 바닥이에요.'},{id:'jars',name:'장독대',icon:'🏺',use:'장을 담근 항아리를 두어요.'},{id:'tree',name:'나무',icon:'🌳',use:'그늘과 맑은 공기를 줘요.'}];
function HanokActivity({home,soundOn,toggleSound}:{home:()=>void;soundOn:boolean;toggleSound:()=>void}) {
  const [placed,setPlaced]=useState<string[]>([]); const [info,setInfo]=useState<(typeof hanokItems)[number]|null>(null); const [dragging,setDragging]=useState<string|null>(null); const yardRef=useRef<HTMLDivElement>(null); const completed=placed.length===hanokItems.length;
  const add=(id:string)=>{if(!placed.includes(id)){setPlaced([...placed,id]);tone('ui',soundOn)}};
  const pointerUp=(e:React.PointerEvent)=>{if(dragging&&yardRef.current){const r=yardRef.current.getBoundingClientRect();if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom)add(dragging)}setDragging(null)};
  return <main className="activity activity-hanok" onPointerUp={pointerUp}><TopBar title="한옥 짓기" onHome={home} soundOn={soundOn} onSound={toggleSound}/><div className="hanok-layout"><aside className="toolbox"><div><span className="label">한옥 재료</span><h2>끌어서 놓아요!</h2><p>톡 눌러도 놓을 수 있어요.</p></div><div className="hanok-tools">{hanokItems.map(item=><button key={item.id} disabled={placed.includes(item.id)} onClick={()=>add(item.id)} onPointerDown={e=>{setDragging(item.id);e.currentTarget.setPointerCapture(e.pointerId)}}><span>{item.icon}</span><b>{item.name}</b><small>{placed.includes(item.id)?'놓았어요 ✓':'끌어 보기'}</small></button>)}</div></aside><section className={`hanok-yard ${dragging?'drag-ready':''}`} ref={yardRef} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();add(e.dataTransfer.getData('text/plain'))}}><div className="yard-sky">☀️　☁️</div><div className="yard-ground"/><div className="placement-area">{placed.map((id,index)=>{const item=hanokItems.find(x=>x.id===id)!;return <button key={id} className={`placed item-${id}`} style={{'--order':index} as React.CSSProperties} onClick={()=>setInfo(item)}><span>{item.icon}</span><b>{item.name}</b></button>})}{placed.length===0&&<div className="drop-hint">☝️<b>이곳에 재료를 놓아요</b></div>}</div>{completed&&<div className="hanok-complete"><Confetti/><strong>우리 한옥 완성!</strong><span>🎉</span></div>}</section></div>{info&&<div className="info-toast" role="status"><span>{info.icon}</span><div><b>{info.name}</b><p>{info.use}</p></div><button onClick={()=>setInfo(null)} aria-label="닫기"><X/></button></div>}</main>;
}

const instruments:{name:Instrument;emoji:string;color:string;note:string}[]=[{name:'장구',emoji:'🥁',color:'#e7473c',note:'덩 덕 쿵!'},{name:'북',emoji:'🪘',color:'#2878b8',note:'둥 둥!'},{name:'징',emoji:'🟡',color:'#318b61',note:'지이잉!'},{name:'꽹과리',emoji:'🔔',color:'#d9a51d',note:'꽹 꽹!'}];
function MusicActivity({home,soundOn,toggleSound}:{home:()=>void;soundOn:boolean;toggleSound:()=>void}) {
  const [sequence,setSequence]=useState<Instrument[]>([]); const [playing,setPlaying]=useState(false); const timers=useRef<number[]>([]);
  const hit=(name:Instrument)=>{tone(name,soundOn);setSequence(s=>[...s,name].slice(-16))};
  const stop=()=>{timers.current.forEach(clearTimeout);timers.current=[];setPlaying(false)};
  const play=()=>{stop();if(!sequence.length)return;setPlaying(true);sequence.forEach((name,i)=>timers.current.push(window.setTimeout(()=>tone(name,soundOn),i*650)));timers.current.push(window.setTimeout(()=>setPlaying(false),sequence.length*650+300))};
  useEffect(()=>()=>timers.current.forEach(clearTimeout),[]);
  return <main className="activity activity-music"><TopBar title="국악 연주" onHome={home} soundOn={soundOn} onSound={toggleSound}/><section className="music-body"><div className="instruction centered"><b>♪</b><div><h2>악기를 신나게 눌러 보세요!</h2><p>내가 누른 순서가 아래에 차곡차곡 쌓여요.</p></div></div><div className="instrument-grid">{instruments.map(inst=><button key={inst.name} style={{'--instrument':inst.color} as React.CSSProperties} onClick={()=>hit(inst.name)}><span className="instrument-emoji">{inst.emoji}</span><strong>{inst.name}</strong><small>{inst.note}</small></button>)}</div><div className="recorder"><div className="record-head"><div><span className="red-dot"/> 나의 연주 <b>{sequence.length}</b></div><div className="record-actions"><Button variant="outline" onClick={()=>setSequence([])} disabled={!sequence.length}><Trash2/> 모두 지우기</Button><Button onClick={play} disabled={!sequence.length||playing}><Play/> 연주하기</Button><Button variant="outline" onClick={stop} disabled={!playing}><Pause/> 멈추기</Button></div></div><div className="sequence" aria-live="polite">{sequence.length?sequence.map((name,i)=><span key={`${name}-${i}`} style={{background:instruments.find(x=>x.name===name)!.color}}>{instruments.find(x=>x.name===name)!.emoji}<b>{name}</b></span>):<p>악기를 누르면 여기에 소리가 기록돼요 ♪</p>}</div></div></section></main>;
}

const treasures=[{id:'flag',name:'태극기',icon:'🇰🇷',desc:'대한민국을 나타내는 우리나라 국기예요.'},{id:'flower',name:'무궁화',icon:'🌺',desc:'오래오래 피는 우리나라 꽃이에요.'},{id:'hangul',name:'한글',icon:'가',desc:'세종대왕이 만든 소중한 우리 글자예요.'},{id:'hanbok',name:'한복',icon:'👘',desc:'아름다운 선과 색을 가진 우리 옷이에요.'},{id:'gate',name:'숭례문',icon:'🏯',desc:'서울을 지켜 온 커다란 성문이에요.'}];
const decoys=['🐯','🍉','🚲','🐟','🎈','🧸','🍙'];
function DetectiveActivity({home,soundOn,toggleSound}:{home:()=>void;soundOn:boolean;toggleSound:()=>void}) {
  const [found,setFound]=useState<string[]>([]); const [message,setMessage]=useState('돋보기로 문화 보물을 찾아요!'); const [focus,setFocus]=useState<string|null>(null); const complete=found.length===5;
  const find=(id:string)=>{const t=treasures.find(x=>x.id===id)!;if(!found.includes(id)){setFound([...found,id]);tone('징',soundOn)}setFocus(id);setMessage(`${t.name}: ${t.desc}`)};
  return <main className="activity activity-detective"><TopBar title="문화재 탐정 미션" onHome={home} soundOn={soundOn} onSound={toggleSound}/><section className="detective-layout"><aside className="case-file"><div className="detective-badge-small">🔎</div><span className="label">오늘의 임무</span><h2>5개의 문화 보물을 찾아라!</h2><div className="treasure-list">{treasures.map(t=><div key={t.id} className={found.includes(t.id)?'done':''}><span>{found.includes(t.id)?t.icon:'?'}</span><b>{t.name}</b>{found.includes(t.id)&&<em>찾음!</em>}</div>)}</div><strong className="detective-count">{found.length} / 5</strong></aside><div className="search-scene"><div className="scene-title">그림을 톡톡 눌러 보세요!</div><div className="picture-cloud">{[treasures[0],decoys[0],decoys[1],treasures[1],decoys[2],treasures[2],decoys[3],treasures[3],decoys[4],decoys[5],treasures[4],decoys[6]].map((item,i)=>typeof item==='string'?<button key={`${item}-${i}`} className="picture decoy" onClick={()=>{setMessage('앗, 이건 아니네요. 다른 그림을 찾아볼까요?');tone('ui',soundOn)}}>{item}</button>:<button key={item.id} className={`picture treasure ${found.includes(item.id)?'found':''} ${focus===item.id?'magnified':''}`} onClick={()=>find(item.id)}>{item.icon}</button>)}</div><div className="clue-message" aria-live="polite"><Search/><p>{message}</p></div>{complete&&<div className="detective-complete"><Confetti/><div className="big-badge"><span>🔍</span><b>문화재<br/>탐정</b></div><h2>모두 찾았어요!</h2><p>최고의 문화재 탐정이에요!</p><Button onClick={()=>{setFound([]);setFocus(null);setMessage('다시 한번 찾아볼까요?')}}><RotateCcw/> 다시 찾기</Button></div>}</div></section></main>;
}

export default function HomePage(){const[screen,setScreen]=useState<Screen>('home');const[soundOn,setSoundOn]=useState(true);const go=(s:Screen)=>{tone('ui',soundOn);setScreen(s);window.scrollTo(0,0)};const props={home:()=>go('home'),soundOn,toggleSound:()=>setSoundOn(v=>!v)};if(screen==='home')return <HomeScreen go={go} soundOn={soundOn} toggleSound={props.toggleSound}/>;if(screen==='map')return <MapActivity {...props}/>;if(screen==='hanbok')return <HanbokActivity {...props}/>;if(screen==='hanok')return <HanokActivity {...props}/>;if(screen==='music')return <MusicActivity {...props}/>;return <DetectiveActivity {...props}/>}
