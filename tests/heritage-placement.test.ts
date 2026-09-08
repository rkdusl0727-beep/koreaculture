import assert from 'node:assert/strict';
import test from 'node:test';
import {HERITAGE_TREASURES,hiddenPlacementsOverlap,newHiddenPlacements} from '../app/heritage-data.ts';

test('숨은 문화재는 매번 모두 겹치지 않게 배치된다',()=>{
  let previous:Record<string,number>={};
  for(let round=0;round<300;round+=1){
    const placements=newHiddenPlacements(previous);
    assert.equal(Object.keys(placements).length,HERITAGE_TREASURES.length);
    assert.equal(hiddenPlacementsOverlap(placements),false);
    for(const treasure of HERITAGE_TREASURES){
      assert.ok(Number.isInteger(placements[treasure.id]));
      assert.ok(placements[treasure.id]>=0&&placements[treasure.id]<treasure.positions.length);
    }
    previous=placements;
  }
});
