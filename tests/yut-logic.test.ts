import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FINISHED,
  WAITING,
  fixedFaces,
  initialPieces,
  makeForcedYutThrow,
  movablePieceIds,
  moveTarget,
  possibleRoutes,
  resolveMove,
  resultInfo,
  yutResultFromFaces,
  type Piece,
  type ResultName,
} from '../app/yut-logic.ts';

const names:ResultName[]=['도','개','걸','윷','모','백도'];

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

test('도·개·걸·윷·모는 확정된 칸 수만큼 한 번에 계산한다',()=>{
  const piece:Piece={id:'red-1',team:'red',position:0,route:'outer',history:[0]};
  for(const name of ['도','개','걸','윷','모'] as ResultName[]){
    assert.equal(moveTarget(piece,makeForcedYutThrow(name),'outer'),resultInfo[name].steps);
  }
});

test('백도는 실제 지나온 경로를 따라 한 칸 뒤로 간다',()=>{
  const piece:Piece={id:'red-1',team:'red',position:7,route:'outer',history:[0,1,2,3,4,5,6,7]};
  const solved=resolveMove([piece],'red',piece.id,makeForcedYutThrow('백도'),'outer');
  assert.equal(solved.target,6);
  assert.deepEqual(solved.finalPieces[0].history,[0,1,2,3,4,5,6]);
});

test('윷판 위 말이 없을 때 백도는 이동 가능한 말이 없다',()=>{
  assert.deepEqual(movablePieceIds(initialPieces(),'red',makeForcedYutThrow('백도')),[]);
});

test('같은 팀 말은 업혀서 항상 함께 이동한다',()=>{
  const pieces:Piece[]=[
    {id:'red-1',team:'red',position:3,route:'outer',history:[0,1,2,3]},
    {id:'red-2',team:'red',position:3,route:'outer',history:[0,1,2,3]},
  ];
  const solved=resolveMove(pieces,'red','red-1',makeForcedYutThrow('개'),'outer');
  assert.deepEqual(solved.movingIds.sort(),['red-1','red-2']);
  assert.ok(solved.finalPieces.every(piece=>piece.position===5));
});

test('상대 말을 잡으면 상대 말은 대기로 돌아가고 추가 던지기를 얻는다',()=>{
  const pieces:Piece[]=[
    {id:'red-1',team:'red',position:3,route:'outer',history:[0,1,2,3]},
    {id:'blue-1',team:'blue',position:4,route:'outer',history:[0,1,2,3,4]},
  ];
  const solved=resolveMove(pieces,'red','red-1',makeForcedYutThrow('도'),'outer');
  assert.equal(solved.finalPieces.find(piece=>piece.id==='blue-1')?.position,WAITING);
  assert.equal(solved.extraThrow,true);
});

test('갈림길에서는 두 경로만 제시하고 선택한 길의 도착점을 한 번 계산한다',()=>{
  const piece:Piece={id:'red-1',team:'red',position:5,route:'outer',history:[0,1,2,3,4,5]};
  const roll=makeForcedYutThrow('개');
  assert.deepEqual(possibleRoutes(piece,roll),['outer','tr_to_bl']);
  assert.equal(moveTarget(piece,roll,'outer'),7);
  assert.equal(moveTarget(piece,roll,'tr_to_bl'),22);
});

test('두 말이 모두 도착하면 게임 종료 판정이 난다',()=>{
  const pieces:Piece[]=[
    {id:'red-1',team:'red',position:FINISHED,route:'outer',history:[]},
    {id:'red-2',team:'red',position:19,route:'outer',history:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]},
  ];
  const solved=resolveMove(pieces,'red','red-2',makeForcedYutThrow('도'),'outer');
  assert.equal(solved.won,true);
});
