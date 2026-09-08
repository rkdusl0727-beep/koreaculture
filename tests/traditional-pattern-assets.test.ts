import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {traditionalPatterns} from '../app/traditional-pattern-data.ts';

test('모든 전통문양은 정사각형 PNG 원본을 사용한다',async()=>{
  assert.equal(new Set(traditionalPatterns.map(pattern=>pattern.id)).size,traditionalPatterns.length);
  for(const pattern of traditionalPatterns){
    assert.match(pattern.preview,/\.png$/);
    const image=await readFile(`public${pattern.preview}`);
    assert.equal(image.toString('ascii',1,4),'PNG');
    const width=image.readUInt32BE(16),height=image.readUInt32BE(20);
    assert.ok(width>=1200&&height>=1200,`${pattern.name} 해상도가 너무 낮습니다.`);
    assert.equal(width,height,`${pattern.name} 이미지 비율이 정사각형이 아닙니다.`);
  }
});
