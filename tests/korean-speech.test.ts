import assert from 'node:assert/strict';
import test from 'node:test';
import {normalizeKoreanSpeechText} from '../app/korean-speech.ts';

void test('갓은 음성에서 받침이 분명한 발음으로 전달된다',()=>{
  assert.equal(normalizeKoreanSpeechText('갓'), '갇');
  assert.equal(normalizeKoreanSpeechText('갓. 옛날 어른들이 머리에 썼어요.'), '갇. 옛날 어른들이 머리에 썼어요.');
});

void test('갓이 포함된 다른 단어는 바꾸지 않는다',()=>{
  assert.equal(normalizeKoreanSpeechText('갓길'), '갓길');
});
