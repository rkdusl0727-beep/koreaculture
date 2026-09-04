export type Team='red'|'blue';
export type Face='flat'|'round'|'backdo';
export type Route='outer'|'tr_to_bl'|'tl_to_home'|'center_to_bl'|'center_to_home';
export type ResultName='도'|'개'|'걸'|'윷'|'모'|'백도';
export type MoveDirection='forward'|'backward';
export type Piece={id:string;team:Team;position:number;route:Route;history:number[]};
export type ThrowResult={
  readonly rollId:string;
  readonly faces:readonly Face[];
  readonly result:ResultName;
  readonly steps:number;
  readonly moveDirection:MoveDirection;
  readonly extraThrow:boolean;
  readonly sentence:string;
};

export const WAITING=-1,FINISHED=-2;

export const resultInfo:Record<ResultName,Omit<ThrowResult,'rollId'|'faces'>>={
  '도':{result:'도',steps:1,moveDirection:'forward',extraThrow:false,sentence:'도! 한 칸 앞으로 가요.'},
  '개':{result:'개',steps:2,moveDirection:'forward',extraThrow:false,sentence:'개! 두 칸 앞으로 가요.'},
  '걸':{result:'걸',steps:3,moveDirection:'forward',extraThrow:false,sentence:'걸! 세 칸 앞으로 가요.'},
  '윷':{result:'윷',steps:4,moveDirection:'forward',extraThrow:true,sentence:'윷! 네 칸 앞으로 가고 한 번 더 던져요.'},
  '모':{result:'모',steps:5,moveDirection:'forward',extraThrow:true,sentence:'모! 다섯 칸 앞으로 가고 한 번 더 던져요.'},
  '백도':{result:'백도',steps:1,moveDirection:'backward',extraThrow:false,sentence:'백도! 한 칸 뒤로 가요.'},
};

export const fixedFaces:Record<ResultName,readonly Face[]>={
  '도':['round','flat','round','round'],
  '개':['round','flat','flat','round'],
  '걸':['round','flat','flat','flat'],
  '윷':['backdo','flat','flat','flat'],
  '모':['round','round','round','round'],
  '백도':['backdo','round','round','round'],
};

let rollSequence=0;
const nextRollId=()=>`roll-${Date.now()}-${++rollSequence}`;

function lockResult(result:ResultName,faces:readonly Face[],rollId=nextRollId()):ThrowResult{
  return Object.freeze({...resultInfo[result],rollId,faces:Object.freeze([...faces])});
}

export function yutResultFromFaces(faces:readonly Face[],rollId?:string):ThrowResult{
  if(faces.length!==4)throw new Error('윷가락은 반드시 네 개여야 합니다.');
  if(faces[0]==='backdo'&&faces.slice(1).every(face=>face==='round'))return lockResult('백도',faces,rollId);
  const flats=faces.filter(face=>face==='flat'||face==='backdo').length;
  const result:ResultName=flats===0?'모':flats===1?'도':flats===2?'개':flats===3?'걸':'윷';
  return lockResult(result,faces,rollId);
}

export function makeYutThrow(random:()=>number=Math.random):ThrowResult{
  const faces:Face[]=[random()<.5?'backdo':'round',...Array.from({length:3},()=>random()<.5?'flat':'round')];
  return yutResultFromFaces(faces);
}

export function makeForcedYutThrow(result:ResultName):ThrowResult{
  return lockResult(result,fixedFaces[result]);
}

const outerAfter=(position:number)=>(position===WAITING||position===0)?Array.from({length:19},(_,i)=>i+1).concat(FINISHED):position>=1&&position<=19?Array.from({length:19-position},(_,i)=>position+i+1).concat(FINISHED):[FINISHED];
const shortcut:Record<Route,number[]>={outer:[],tr_to_bl:[23,22,24,26,25,15,16,17,18,19,FINISHED],tl_to_home:[20,21,24,27,28,FINISHED],center_to_bl:[26,25,15,16,17,18,19,FINISHED],center_to_home:[27,28,FINISHED]};

export function possibleRoutes(piece:Piece,result?:ThrowResult):Route[]{
  if(result?.moveDirection==='backward')return[piece.route];
  if(piece.position===5)return['outer','tr_to_bl'];
  if(piece.position===10)return['outer','tl_to_home'];
  if(piece.position===24)return['center_to_bl','center_to_home'];
  return[piece.route];
}

export function forwardSequence(piece:Piece,route:Route):number[]{
  if(piece.position===5&&route==='tr_to_bl')return shortcut.tr_to_bl;
  if(piece.position===10&&route==='tl_to_home')return shortcut.tl_to_home;
  if(piece.position===24&&(route==='center_to_bl'||route==='center_to_home'))return shortcut[route];
  if(piece.position===23||piece.position===22)return shortcut.tr_to_bl.slice(shortcut.tr_to_bl.indexOf(piece.position)+1);
  if(piece.position===20||piece.position===21)return shortcut.tl_to_home.slice(shortcut.tl_to_home.indexOf(piece.position)+1);
  if(piece.position===26||piece.position===25)return shortcut.center_to_bl.slice(shortcut.center_to_bl.indexOf(piece.position)+1);
  if(piece.position===27||piece.position===28)return shortcut.center_to_home.slice(shortcut.center_to_home.indexOf(piece.position)+1);
  return outerAfter(piece.position);
}

export function movePath(piece:Piece,result:ThrowResult,route:Route):number[]{
  if(result.moveDirection==='backward')return[piece.history.length>1?piece.history[piece.history.length-2]:WAITING];
  const path=forwardSequence(piece,route).slice(0,result.steps);
  return path.includes(FINISHED)?path.slice(0,path.indexOf(FINISHED)+1):path;
}

export function moveTarget(piece:Piece,result:ThrowResult,route:Route){
  const path=movePath(piece,result,route);
  return path[path.length-1]??piece.position;
}

export function initialPieces():Piece[]{
  return[
    {id:'red-1',team:'red',position:WAITING,route:'outer',history:[]},
    {id:'red-2',team:'red',position:WAITING,route:'outer',history:[]},
    {id:'blue-1',team:'blue',position:WAITING,route:'outer',history:[]},
    {id:'blue-2',team:'blue',position:WAITING,route:'outer',history:[]},
  ];
}

export function movablePieceIds(pieces:Piece[],team:Team,result:ThrowResult):string[]{
  return pieces.filter(piece=>piece.team===team&&piece.position!==FINISHED&&(result.moveDirection==='forward'||piece.position>=0)).map(piece=>piece.id);
}

export function resolveMove(pieces:Piece[],team:Team,selectedId:string,result:ThrowResult,route:Route){
  const chosen=pieces.find(piece=>piece.id===selectedId);
  if(!chosen)throw new Error('선택한 윷말을 찾을 수 없습니다.');
  const stacked=pieces.filter(piece=>piece.team===team&&piece.position===chosen.position&&piece.position>=0).map(piece=>piece.id);
  const movingIds=stacked.length?stacked:[selectedId];
  const path=movePath(chosen,result,route);
  const target=path[path.length-1]??chosen.position;
  const newHistory=result.moveDirection==='backward'?chosen.history.slice(0,-1):target===FINISHED?[]:[...chosen.history,...path.filter(node=>node>=0)];
  const moved=pieces.map(piece=>movingIds.includes(piece.id)?{...piece,position:target,route,history:newHistory}:piece);
  const caughtIds=target>=0?moved.filter(piece=>piece.team!==team&&piece.position===target).map(piece=>piece.id):[];
  const finalPieces=moved.map(piece=>caughtIds.includes(piece.id)?{...piece,position:WAITING,route:'outer' as Route,history:[]}:piece);
  return{
    path,
    target,
    movingIds,
    caughtIds,
    finalPieces,
    won:finalPieces.filter(piece=>piece.team===team&&piece.position===FINISHED).length===2,
    extraThrow:result.extraThrow||caughtIds.length>0,
  };
}
