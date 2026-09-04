import assert from 'node:assert/strict';
import test from 'node:test';
import {bodyFitProfiles,getHanbokFit,type HanbokFitSlot} from '../app/hanbok-fit.ts';

const items:Array<[string,HanbokFitSlot]>=[
  ...Array.from({length:6},(_,i)=>[`jeogori-${i+1}`,'top'] as [string,HanbokFitSlot]),
  ['jeogori-boy-v1','top'],
  ...Array.from({length:6},(_,i)=>[`chima-${i+1}`,'bottom'] as [string,HanbokFitSlot]),
  ...Array.from({length:5},(_,i)=>[`baji-${i+1}`,'bottom'] as [string,HanbokFitSlot]),
  ...Array.from({length:3},(_,i)=>[`durumagi-${i+1}`,'coat'] as [string,HanbokFitSlot]),
  ...Array.from({length:3},(_,i)=>[`beoseon-${i+1}`,'socks'] as [string,HanbokFitSlot]),
  ...Array.from({length:4},(_,i)=>[`flower-shoes-${i+1}`,'shoes'] as [string,HanbokFitSlot]),
  ...Array.from({length:2},(_,i)=>[`hairband-${i+1}`,'hair'] as [string,HanbokFitSlot]),
  ...Array.from({length:2},(_,i)=>[`hairpin-${i+1}`,'hair'] as [string,HanbokFitSlot]),
];

void test('both children have independent anatomical anchors',()=>{
  assert.notDeepEqual(bodyFitProfiles[0],bodyFitProfiles[1]);
  for(const profile of Object.values(bodyFitProfiles)){
    assert.ok(profile.head.width>0);
    assert.ok(profile.shoulders.left.x<profile.neck.x);
    assert.ok(profile.shoulders.right.x>profile.neck.x);
    assert.ok(profile.feet.left.x<profile.feet.right.x);
  }
});

for(const kind of [0,1] as const){
  void test(`child ${kind+1} uses stable percentage fits for every selectable item`,()=>{
    for(const [id,slot] of items){
      const fit=getHanbokFit(kind,id,slot);
      for(const value of [fit.left,fit.top,fit.width,fit.height,fit.rotation,fit.zIndex]) assert.ok(Number.isFinite(value),id);
      assert.ok(fit.width>0&&fit.height>0,id);
      assert.ok(fit.left>-20&&fit.left+fit.width<125,id);
      assert.ok(fit.top>-10&&fit.top+fit.height<115,id);
    }
  });

  void test(`child ${kind+1} hairpins stay proportional to the head`,()=>{
    const headWidth=bodyFitProfiles[kind].head.width;
    for(const id of ['hairpin-1','hairpin-2']){
      const fit=getHanbokFit(kind,id,'hair');
      const visibleWidth=id==='hairpin-1'?fit.width*(1458/1536):fit.width*(1205/1536);
      assert.ok(visibleWidth/headWidth<=.25,`${id} is too wide for child ${kind+1}`);
    }
  });
}
