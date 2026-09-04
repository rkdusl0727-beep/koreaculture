export type Team='red'|'blue';
export type Face='flat'|'round'|'backdo';
export type Route='outer'|'tr_to_bl'|'tl_to_home'|'center_to_bl'|'center_to_home';
export type ResultName='도'|'개'|'걸'|'윷'|'모'|'백도';
export type MoveDirection='forward'|'backward';
export type PieceStatus='waiting'|'ready'|'onBoard'|'finished';
export type Piece={id:string;team:Team;teamId:Team;status:PieceStatus;currentNode:number|null;previousPath:number[];finishOrder:number|null;route:Route};
export type ThrowResult={readonly rollId:string;readonly faces:readonly Face[];readonly result:ResultName;readonly steps:number;readonly moveDirection:MoveDirection;readonly extraThrow:boolean;readonly sentence:string};

// Route calculation sentinels. Piece state itself uses explicit status/currentNode.
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
  '도':['round','flat','round','round'],'개':['round','flat','flat','round'],'걸':['round','flat','flat','flat'],
  '윷':['backdo','flat','flat','flat'],'모':['round','round','round','round'],'백도':['backdo','round','round','round'],
};

let rollSequence=0;
const nextRollId=()=>`roll-${Date.now()}-${++rollSequence}`;
function lockResult(result:ResultName,faces:readonly Face[],rollId=nextRollId()):ThrowResult{return Object.freeze({...resultInfo[result],rollId,faces:Object.freeze([...faces])})}
export function yutResultFromFaces(faces:readonly Face[],rollId?:string):ThrowResult{
  if(faces.length!==4)throw new Error('윷가락은 반드시 네 개여야 합니다.');
  if(faces[0]==='backdo'&&faces.slice(1).every(face=>face==='round'))return lockResult('백도',faces,rollId);
  const flats=faces.filter(face=>face==='flat'||face==='backdo').length;
  return lockResult(flats===0?'모':flats===1?'도':flats===2?'개':flats===3?'걸':'윷',faces,rollId);
}
const fairResults:readonly ResultName[]=['도','개','걸','윷','모'];
export function makeYutThrow(random:()=>number=Math.random):ThrowResult{
  const value=Math.max(0,Math.min(.999999999,random()));
  if(value<.05)return makeForcedYutThrow('백도');
  const index=Math.min(fairResults.length-1,Math.floor((value-.05)/.19));
  return makeForcedYutThrow(fairResults[index]);
}
export function makeForcedYutThrow(result:ResultName):ThrowResult{return lockResult(result,fixedFaces[result])}

export function initialPieces():Piece[]{
  return(['red-1','red-2','blue-1','blue-2'] as const).map(id=>{const team=id.startsWith('red')?'red':'blue';return{id,team,teamId:team,status:'waiting',currentNode:null,previousPath:[],finishOrder:null,route:'outer'}});
}
export function prepareStartingTeam(pieces:Piece[],pieceId:string):{pieces:Piece[];currentTeam:Team}{
  const chosen=pieces.find(piece=>piece.id===pieceId&&piece.status==='waiting');
  if(!chosen)throw new Error('먼저 시작할 말을 찾을 수 없습니다.');
  return{currentTeam:chosen.teamId,pieces:pieces.map(piece=>piece.status==='waiting'?{...piece,status:'ready',currentNode:null,previousPath:[],finishOrder:null,route:'outer'}:piece)};
}

const outerAfter=(position:number|null)=>(position===null||position===0)?Array.from({length:19},(_,i)=>i+1).concat(FINISHED):position>=1&&position<=19?Array.from({length:19-position},(_,i)=>position+i+1).concat(FINISHED):[FINISHED];
const shortcut:Record<Route,number[]>={outer:[],tr_to_bl:[23,22,24,26,25,15,16,17,18,19,FINISHED],tl_to_home:[20,21,24,27,28,FINISHED],center_to_bl:[26,25,15,16,17,18,19,FINISHED],center_to_home:[27,28,FINISHED]};
export function possibleRoutes(piece:Piece,result?:ThrowResult):Route[]{
  if(result?.moveDirection==='backward')return[piece.route];
  if(piece.status==='ready')return['outer'];
  if(piece.currentNode===5)return['outer','tr_to_bl'];
  if(piece.currentNode===10)return['outer','tl_to_home'];
  if(piece.currentNode===24)return['center_to_bl','center_to_home'];
  return[piece.route];
}
export function forwardSequence(piece:Piece,route:Route):number[]{
  const position=piece.currentNode;
  if(position===5&&route==='tr_to_bl')return shortcut.tr_to_bl;
  if(position===10&&route==='tl_to_home')return shortcut.tl_to_home;
  if(position===24&&(route==='center_to_bl'||route==='center_to_home'))return shortcut[route];
  if(position===23||position===22)return shortcut.tr_to_bl.slice(shortcut.tr_to_bl.indexOf(position)+1);
  if(position===20||position===21)return shortcut.tl_to_home.slice(shortcut.tl_to_home.indexOf(position)+1);
  if(position===26||position===25)return shortcut.center_to_bl.slice(shortcut.center_to_bl.indexOf(position)+1);
  if(position===27||position===28)return shortcut.center_to_home.slice(shortcut.center_to_home.indexOf(position)+1);
  return outerAfter(position);
}
export function movePath(piece:Piece,result:ThrowResult,route:Route):number[]{
  if(result.moveDirection==='backward'){
    if(piece.status==='ready')return[19,FINISHED];
    return[piece.previousPath.length>1?piece.previousPath[piece.previousPath.length-2]:WAITING];
  }
  const path=forwardSequence(piece,route).slice(0,result.steps);
  return path.includes(FINISHED)?path.slice(0,path.indexOf(FINISHED)+1):path;
}
export function moveTarget(piece:Piece,result:ThrowResult,route:Route){const path=movePath(piece,result,route);return path[path.length-1]??piece.currentNode??WAITING}
export function movablePieceIds(pieces:Piece[],team:Team,result:ThrowResult):string[]{
  return pieces.filter(piece=>piece.team===team&&piece.status!=='waiting'&&piece.status!=='finished'&&(result.moveDirection==='forward'||piece.status==='ready'||piece.currentNode!==null)).map(piece=>piece.id);
}
export function canFinish(piece:Piece,result:ThrowResult,route:Route=piece.route){return moveTarget(piece,result,route)===FINISHED}
export function finishOptions(pieces:Piece[],team:Team,result:ThrowResult):Array<{pieceId:string;route:Route}>{
  return movablePieceIds(pieces,team,result).flatMap(pieceId=>{
    const piece=pieces.find(item=>item.id===pieceId)!;
    return possibleRoutes(piece,result).filter(route=>canFinish(piece,result,route)).map(route=>({pieceId,route}));
  });
}
export function finishedCount(pieces:Piece[],team:Team){return pieces.filter(piece=>piece.team===team&&piece.status==='finished').length}
export function winnerFor(pieces:Piece[],team:Team,totalPieces=2):Team|null{return finishedCount(pieces,team)===totalPieces?team:null}

export function resolveMove(pieces:Piece[],team:Team,selectedId:string,result:ThrowResult,route:Route){
  const chosen=pieces.find(piece=>piece.id===selectedId);
  if(!chosen||chosen.team!==team||chosen.status==='waiting'||chosen.status==='finished')throw new Error('선택한 윷말을 이동할 수 없습니다.');
  const stacked=chosen.status==='onBoard'?pieces.filter(piece=>piece.team===team&&piece.status==='onBoard'&&piece.currentNode===chosen.currentNode).map(piece=>piece.id):[];
  const movingIds=stacked.length?stacked:[selectedId];
  const path=movePath(chosen,result,route);
  const target=path[path.length-1]??chosen.currentNode??WAITING;
  const readyBackdo=chosen.status==='ready'&&result.result==='백도';
  const existingFinished=finishedCount(pieces,team);
  let finishIndex=0;
  const moved=pieces.map(piece=>{
    if(!movingIds.includes(piece.id))return piece;
    if(target===FINISHED){finishIndex+=1;return{...piece,status:'finished' as const,currentNode:null,previousPath:[...piece.previousPath,...path.filter(node=>node>=0)],finishOrder:existingFinished+finishIndex,route}}
    if(target===WAITING)return{...piece,status:'ready' as const,currentNode:null,previousPath:[],finishOrder:null,route:'outer' as Route};
    const previousPath=result.moveDirection==='backward'?piece.previousPath.slice(0,-1):[...piece.previousPath,...path.filter(node=>node>=0)];
    return{...piece,status:'onBoard' as const,currentNode:target,previousPath,finishOrder:null,route};
  });
  const caughtIds=target>=0?moved.filter(piece=>piece.team!==team&&piece.status==='onBoard'&&piece.currentNode===target).map(piece=>piece.id):[];
  const finalPieces=moved.map(piece=>caughtIds.includes(piece.id)?{...piece,status:'ready' as const,currentNode:null,previousPath:[],finishOrder:null,route:'outer' as Route}:piece);
  const animationNode=target===FINISHED?[...path].reverse().find(node=>node>=0)??chosen.currentNode:null;
  const animationPieces=target===FINISHED&&animationNode!==null?pieces.map(piece=>movingIds.includes(piece.id)?{...piece,status:'onBoard' as const,currentNode:animationNode,route}:piece):finalPieces;
  return{path,target,movingIds,caughtIds,finalPieces,animationPieces,readyBackdo,won:winnerFor(finalPieces,team)!==null,extraThrow:result.extraThrow||caughtIds.length>0};
}
