export type Team='red'|'blue';
export type Face='flat'|'round';
export type Route='outer'|'left-shortcut'|'right-shortcut';
export type Piece={id:string;team:Team;position:number;route:Route};
export type ThrowResult={name:'도'|'개'|'걸'|'윷'|'모';steps:number;extra:boolean;sentence:string;faces:Face[]};

const resultByFlat:Record<number,Omit<ThrowResult,'faces'>>={
  0:{name:'모',steps:5,extra:true,sentence:'모! 다섯 칸을 가고 한 번 더 던져요.'},
  1:{name:'도',steps:1,extra:false,sentence:'도! 한 칸을 가요.'},
  2:{name:'개',steps:2,extra:false,sentence:'개! 두 칸을 가요.'},
  3:{name:'걸',steps:3,extra:false,sentence:'걸! 세 칸을 가요.'},
  4:{name:'윷',steps:4,extra:true,sentence:'윷! 네 칸을 가고 한 번 더 던져요.'},
};
const outer=[1,2,3,4,5,6,7,8,9,10,11,0];
const routeSteps:Record<Route,Record<number,number[]>>={
  outer:{5:[6,7,8,9,10,11,0],7:[8,9,10,11,0]},
  'left-shortcut':{5:[13,14,15,11,0],13:[14,15,11,0],14:[15,11,0],15:[11,0]},
  'right-shortcut':{7:[16,14,17,0],16:[14,17,0],14:[17,0],17:[0]},
};

export function yutResultFromFaces(faces:Face[]):ThrowResult{const base=resultByFlat[faces.filter(face=>face==='flat').length];return{...base,faces}}
export function makeYutThrow(random:()=>number=Math.random){return yutResultFromFaces(Array.from({length:4},()=>random()<.5?'flat':'round'))}
export function sequenceFor(piece:Piece,route:Route){if(piece.position<0)return outer;const shortcut=routeSteps[route][piece.position];if(shortcut)return shortcut;const index=outer.indexOf(piece.position);return index>=0?outer.slice(index+1):[0]}
export function moveTarget(piece:Piece,steps:number,route:Route=piece.route){const sequence=sequenceFor(piece,route);return sequence[Math.min(steps,sequence.length)-1]??0}
export function possibleRoutes(piece:Piece){if(piece.position===5)return['outer','left-shortcut'] as Route[];if(piece.position===7)return['outer','right-shortcut'] as Route[];return[piece.route]}
export function initialPieces():Piece[]{return[{id:'red-1',team:'red',position:-1,route:'outer'},{id:'red-2',team:'red',position:-1,route:'outer'},{id:'blue-1',team:'blue',position:-1,route:'outer'},{id:'blue-2',team:'blue',position:-1,route:'outer'}]}

export function resolveMove(pieces:Piece[],team:Team,selectedId:string,steps:number,route:Route,earnedExtra=false){
  const chosen=pieces.find(piece=>piece.id===selectedId)!;
  const stacked=pieces.filter(piece=>piece.team===team&&piece.position===chosen.position&&piece.position>0).map(piece=>piece.id);
  const movingIds=stacked.length?stacked:[selectedId];
  const path=sequenceFor(chosen,route).slice(0,steps);while(path.length<steps)path.push(0);
  const target=path[path.length-1]??0;
  const moved=pieces.map(piece=>movingIds.includes(piece.id)?{...piece,position:target,route}:piece);
  const caughtIds=moved.filter(piece=>piece.team!==team&&piece.position===target&&target>0).map(piece=>piece.id);
  const finalPieces=moved.map(piece=>caughtIds.includes(piece.id)?{...piece,position:-1,route:'outer' as Route}:piece);
  return{path,movingIds,caughtIds,finalPieces,won:finalPieces.filter(piece=>piece.team===team&&piece.position===0).length===2,extra:earnedExtra||caughtIds.length>0};
}
