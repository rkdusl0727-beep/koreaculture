import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FINISHED,
  canFinish,
  finishedCount,
  fixedFaces,
  initialPieces,
  makeForcedYutThrow,
  makeYutThrow,
  movablePieceIds,
  moveTarget,
  possibleRoutes,
  placeStartingPiece,
  resolveMove,
  resultInfo,
  startingSetupPieceIds,
  winnerFor,
  yutResultFromFaces,
  type Piece,
  type ResultName,
  type Team,
} from '../app/yut-logic.ts';

const names:ResultName[]=['도','개','걸','윷','모','백도'];
const onBoard=(id:string,team:Team,node:number,path=Array.from({length:node+1},(_,i)=>i)):Piece=>({id,team,teamId:team,status:'onBoard',currentNode:node,previousPath:path,finishOrder:null,route:'outer'});
const ready=(id:string,team:Team):Piece=>({id,team,teamId:team,status:'ready',currentNode:null,previousPath:[],finishOrder:null,route:'outer'});
const finished=(id:string,team:Team,order:number):Piece=>({id,team,teamId:team,status:'finished',currentNode:null,previousPath:[1,2,3],finishOrder:order,route:'outer'});

test('도·개·걸·윷·모는 같은 확률이고 백도만 별도 낮은 확률이다',()=>{
  const counts=new Map<ResultName,number>(names.map(name=>[name,0]));
  for(let index=0;index<10000;index++){
    const roll=makeYutThrow(()=>(index+.5)/10000);
    counts.set(roll.result,counts.get(roll.result)!+1);
  }
  for(const name of ['도','개','걸','윷','모'] as ResultName[])assert.equal(counts.get(name),1900);
  assert.equal(counts.get('백도'),500);
});

for(const name of names){
  test(`${name} 결과·윷가락·문장·이동 규칙이 20회 동일하다`,()=>{
    for(let index=0;index<20;index++){
      const roll=makeForcedYutThrow(name);
      const fromFaces=yutResultFromFaces(roll.faces);
      assert.equal(roll.result,name);
      assert.equal(fromFaces.result,name);
      assert.deepEqual(roll.faces,fixedFaces[name]);
      assert.equal(roll.steps,resultInfo[name].steps);
      assert.equal(roll.moveDirection,resultInfo[name].moveDirection);
      assert.equal(roll.extraThrow,resultInfo[name].extraThrow);
      assert.equal(roll.sentence,resultInfo[name].sentence);
      assert.ok(Object.isFrozen(roll));
      assert.ok(Object.isFrozen(roll.faces));
    }
  });
}

test('새 게임은 어느 팀도 선공으로 고정하지 않고 모든 말을 waiting으로 둔다',()=>{
  const pieces=initialPieces();
  assert.ok(pieces.every(piece=>piece.teamId===piece.team&&piece.status==='waiting'&&piece.currentNode===null&&piece.finishOrder===null));
});

for(const team of ['red','blue'] as Team[]){
  test(`${team} 말을 먼저 놓으면 해당 팀이 선공이고 선택한 말만 ready가 된다`,()=>{
    const initial=initialPieces();
    const placed=placeStartingPiece(initial,`${team}-1`,null);
    assert.equal(placed.currentTeam,team);
    assert.equal(placed.pieces.find(piece=>piece.id===`${team}-1`)?.status,'ready');
    assert.equal(placed.pieces.filter(piece=>piece.status==='waiting').length,3);
    assert.ok(initial.every(piece=>piece.status==='waiting'),'원본 상태를 바꾸지 않는다');
  });
}

test('두 번째 말도 직접 놓고 첫 번째 말의 팀이 선공으로 유지된다',()=>{
  const first=placeStartingPiece(initialPieces(),'blue-1',null);
  const second=placeStartingPiece(first.pieces,'red-1',first.currentTeam);
  assert.equal(second.currentTeam,'blue');
  assert.equal(second.pieces.find(piece=>piece.id==='blue-1')?.status,'ready');
  assert.equal(second.pieces.find(piece=>piece.id==='red-1')?.status,'ready');
});

test('첫 말을 놓은 뒤에는 반대 팀의 기다리는 말만 출발 준비로 선택한다',()=>{
  const redFirst=placeStartingPiece(initialPieces(),'red-1',null);
  assert.deepEqual(startingSetupPieceIds(redFirst.pieces,redFirst.currentTeam),['blue-1','blue-2']);
  const blueFirst=placeStartingPiece(initialPieces(),'blue-2',null);
  assert.deepEqual(startingSetupPieceIds(blueFirst.pieces,blueFirst.currentTeam),['red-1','red-2']);
});

test('빨강과 파랑 말을 하나씩 놓으면 초기 출발 준비가 끝난다',()=>{
  const first=placeStartingPiece(initialPieces(),'blue-1',null);
  const second=placeStartingPiece(first.pieces,'red-2',first.currentTeam);
  assert.equal(second.currentTeam,'blue');
  assert.equal(second.pieces.filter(piece=>piece.status==='ready'&&piece.team==='red').length,1);
  assert.equal(second.pieces.filter(piece=>piece.status==='ready'&&piece.team==='blue').length,1);
  assert.equal(second.pieces.filter(piece=>piece.status==='waiting').length,2);
});

test('말 한 개만 놓아도 그 말은 바로 출발 준비 상태가 된다',()=>{
  const placed=placeStartingPiece(initialPieces(),'red-2',null);
  assert.equal(placed.currentTeam,'red');
  assert.equal(placed.pieces.filter(piece=>piece.status==='ready').length,1);
  assert.equal(placed.pieces.filter(piece=>piece.status==='waiting').length,3);
});

test('ready 말은 첫 번째 이동 칸 밖의 출발 대기 상태에서 앞으로 이동한다',()=>{
  const piece=ready('red-1','red');
  assert.equal(moveTarget(piece,makeForcedYutThrow('도'),'outer'),1);
  const solved=resolveMove([piece],'red',piece.id,makeForcedYutThrow('개'),'outer');
  assert.equal(solved.finalPieces[0].status,'onBoard');
  assert.equal(solved.finalPieces[0].currentNode,2);
});

test('ready 말의 백도는 마지막 칸을 거쳐 즉시 finished가 된다',()=>{
  const pieces=[ready('red-1','red'),ready('red-2','red')];
  const solved=resolveMove(pieces,'red','red-2',makeForcedYutThrow('백도'),'outer');
  assert.deepEqual(solved.path,[19,FINISHED]);
  assert.equal(solved.readyBackdo,true);
  assert.equal(solved.finalPieces[1].status,'finished');
  assert.equal(solved.finalPieces[1].currentNode,null);
  assert.equal(solved.finalPieces[1].finishOrder,1);
  assert.equal(solved.finalPieces[0].status,'ready');
});

test('백도 도착 말은 다시 ready나 waiting으로 돌아가지 않는다',()=>{
  const solved=resolveMove([ready('red-1','red')],'red','red-1',makeForcedYutThrow('백도'),'outer');
  assert.equal(solved.finalPieces[0].status,'finished');
  assert.deepEqual(movablePieceIds(solved.finalPieces,'red',makeForcedYutThrow('도')),[]);
});

test('윷판 위 백도는 실제 지나온 경로를 따라 한 칸 뒤로 간다',()=>{
  const piece=onBoard('red-1','red',7,[1,2,3,4,5,6,7]);
  const solved=resolveMove([piece],'red',piece.id,makeForcedYutThrow('백도'),'outer');
  assert.equal(solved.target,6);
  assert.deepEqual(solved.finalPieces[0].previousPath,[1,2,3,4,5,6]);
});

test('waiting 말과 finished 말은 어떤 결과에서도 이동 대상이 아니다',()=>{
  const pieces=[initialPieces()[0],finished('red-2','red',1)];
  for(const name of names)assert.deepEqual(movablePieceIds(pieces,'red',makeForcedYutThrow(name)),[]);
});

test('같은 팀 말은 업혀서 함께 이동한다',()=>{
  const pieces=[onBoard('red-1','red',3,[1,2,3]),onBoard('red-2','red',3,[1,2,3])];
  const solved=resolveMove(pieces,'red','red-1',makeForcedYutThrow('개'),'outer');
  assert.deepEqual(solved.movingIds.sort(),['red-1','red-2']);
  assert.ok(solved.finalPieces.every(piece=>piece.currentNode===5));
});

test('상대 말을 잡으면 상대 말은 finished가 아닌 ready로 돌아간다',()=>{
  const pieces=[onBoard('red-1','red',3,[1,2,3]),onBoard('blue-1','blue',4,[1,2,3,4])];
  const solved=resolveMove(pieces,'red','red-1',makeForcedYutThrow('도'),'outer');
  const caught=solved.finalPieces.find(piece=>piece.id==='blue-1')!;
  assert.equal(caught.status,'ready');
  assert.equal(caught.currentNode,null);
  assert.equal(solved.extraThrow,true);
});

test('갈림길은 두 경로만 제시하고 선택한 길을 한 번 계산한다',()=>{
  const piece=onBoard('red-1','red',5,[1,2,3,4,5]);
  const roll=makeForcedYutThrow('개');
  assert.deepEqual(possibleRoutes(piece,roll),['outer','tr_to_bl']);
  assert.equal(moveTarget(piece,roll,'outer'),7);
  assert.equal(moveTarget(piece,roll,'tr_to_bl'),22);
});

test('도착까지 수가 같거나 넘으면 도착점이 활성화될 수 있다',()=>{
  const piece=onBoard('red-1','red',19,Array.from({length:19},(_,i)=>i+1));
  assert.equal(canFinish(piece,makeForcedYutThrow('도'),'outer'),true);
  assert.equal(canFinish(piece,makeForcedYutThrow('모'),'outer'),true);
});

test('도착 처리는 status, currentNode, finishOrder를 한 번에 갱신한다',()=>{
  const pieces=[finished('red-1','red',1),onBoard('red-2','red',19,Array.from({length:19},(_,i)=>i+1))];
  const solved=resolveMove(pieces,'red','red-2',makeForcedYutThrow('도'),'outer');
  const arrived=solved.finalPieces.find(piece=>piece.id==='red-2')!;
  assert.deepEqual({status:arrived.status,currentNode:arrived.currentNode,finishOrder:arrived.finishOrder},{status:'finished',currentNode:null,finishOrder:2});
  assert.equal(finishedCount(solved.finalPieces,'red'),2);
  assert.equal(solved.won,true);
});

for(const team of ['red','blue'] as Team[]){
  test(`${team}팀은 finished 말이 정확히 2개일 때만 승리한다`,()=>{
    const one=[finished(`${team}-1`,team,1),ready(`${team}-2`,team)];
    const two=[finished(`${team}-1`,team,1),finished(`${team}-2`,team,2)];
    assert.equal(winnerFor(one,team),null);
    assert.equal(winnerFor(two,team),team);
  });
}

test('완료된 상태를 다시 계산해도 선공과 도착 순서 데이터는 바뀌지 않는다',()=>{
  const placed=placeStartingPiece(initialPieces(),'blue-1',null);
  const snapshot=structuredClone(placed);
  assert.deepEqual(placed,snapshot);
  assert.equal(placed.currentTeam,'blue');
});
