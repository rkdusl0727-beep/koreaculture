import test from 'node:test';
import assert from 'node:assert/strict';
import {fitProfiles,getHanbokFit} from '../app/hanbok-fit.ts';

const required=['jeogori','skirt','pants','durumagi','beoseonLeft','beoseonRight','shoeLeft','shoeRight','headband','hairAccessoryLeft','hairAccessoryRight','ornament'] as const;

test('두 어린이는 서로 독립된 전체 착용 프로필을 가진다',()=>{
  assert.notDeepEqual(fitProfiles.child1,fitProfiles.child2);
  for(const profile of Object.values(fitProfiles))for(const name of required){
    const placement=profile[name];
    assert.ok(Number.isFinite(placement.x)&&Number.isFinite(placement.y));
    assert.ok(placement.width>0&&placement.height>0&&placement.scale>0);
    assert.ok(Number.isFinite(placement.rotation)&&Number.isInteger(placement.zIndex));
  }
});

test('모든 착용 레이어는 같은 1:2 캔버스 안에서 비율을 유지한다',()=>{
  const samples=[
    ['jeogori-1','top'],['chima-2','bottom'],['baji-3','bottom'],['durumagi-1','coat'],
    ['beoseon-1','socks'],['flower-shoes-1','shoes'],['hairband-1','hair'],['hairpin-2','hair'],['norigae-1','ornament'],
  ] as const;
  for(const kind of [0,1] as const)for(const [id,slot] of samples){
    const fit=getHanbokFit(kind,id,slot);
    assert.ok(fit.width>0&&fit.height>0);
    assert.ok(fit.left>-50&&fit.left+fit.width<150);
    assert.ok(fit.top>-50&&fit.top+fit.height<150);
  }
});

test('신발은 버선보다 앞에, 장식은 옷과 얼굴보다 앞에 표시된다',()=>{
  for(const profile of Object.values(fitProfiles)){
    assert.ok(profile.shoeLeft.zIndex>profile.beoseonLeft.zIndex);
    assert.ok(profile.shoeRight.zIndex>profile.beoseonRight.zIndex);
    assert.ok(profile.ornament.zIndex>profile.durumagi.zIndex);
    assert.ok(profile.hairAccessoryLeft.zIndex>profile.headband.zIndex);
  }
});

test('버선과 꽃신은 양쪽 발 중심에 맞고 캐릭터 캔버스 밖으로 내려가지 않는다',()=>{
  for(const [key,profile] of Object.entries(fitProfiles)){
    const child=key==='child1'?0:1;
    const feet=child===0?{left:37,right:64}:{left:34,right:62};
    for(const [placement,center] of [[profile.beoseonLeft,feet.left],[profile.beoseonRight,feet.right],[profile.shoeLeft,feet.left],[profile.shoeRight,feet.right]] as const){
      assert.ok(placement.x<center&&placement.x+placement.width>center);
      assert.ok(placement.y+placement.height<=100);
    }
  }
});
