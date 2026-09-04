'use client';

let speechRequest=0;
let voiceTimer:number|undefined;
let speakTimer:number|undefined;
let activePronunciation:HTMLAudioElement|undefined;
export const NORMAL_SPEECH_RATE=1;

export function setNormalAudioSpeed(audio:HTMLAudioElement){
  audio.defaultPlaybackRate=NORMAL_SPEECH_RATE;
  audio.playbackRate=NORMAL_SPEECH_RATE;
  return audio;
}

const femaleNames=/Yuna|SunHi|Heami|Seoyeon|Sora|Yu-ri|Soeun|Jimin|Nari|유나|선히|희미|서연|소라|유리|소은|지민|나리|여성|Female|Google 한국의/i;
const maleNames=/InJoon|Joon|Minho|Hyunsu|Eddy|Grandpa|Reed|Rocko|인준|준호|민호|현수|남성|Male/i;
const naturalNames=/Natural|Neural|Enhanced|Premium|Online|고급|향상/i;

function isKorean(voice:SpeechSynthesisVoice){return voice.lang.toLowerCase().replace('_','-').startsWith('ko')}
function voiceScore(voice:SpeechSynthesisVoice){
  if(!isKorean(voice))return-Infinity;
  const language=voice.lang.toLowerCase().replace('_','-');
  let score=language==='ko-kr'?100:80;
  if(femaleNames.test(voice.name))score+=80;
  if(naturalNames.test(voice.name))score+=35;
  if(voice.default)score+=8;
  if(maleNames.test(voice.name))score-=120;
  return score;
}
function preferredKoreanVoice(synth:SpeechSynthesis){return synth.getVoices().filter(isKorean).sort((a,b)=>voiceScore(b)-voiceScore(a))[0]}
export function normalizeKoreanSpeechText(text:string){return text
  .replaceAll('다듬이돌과','다듬이 돌과')
  .replaceAll('다듬이돌','다듬이 돌')
  .replaceAll('고려청자','고려 청자')
  .replaceAll('조선백자','조선 백자')
  .replaceAll('색동저고리','색동 저고리')
  .replaceAll('전통주머니','전통 주머니')
  .replace(/(^|\s)갓(?=$|[.!?,\s])/g,'$1갇')
  .replace(/([!?])(?=\S)/g,'$1 ')
  .replace(/\s+/g,' ')
  .trim()}

export function prepareKoreanVoice(){
  if(typeof window==='undefined'||!('speechSynthesis'in window))return;
  window.speechSynthesis.getVoices();
}

export function stopKoreanSpeech(){
  speechRequest+=1;
  if(voiceTimer!==undefined)window.clearTimeout(voiceTimer);
  if(speakTimer!==undefined)window.clearTimeout(speakTimer);
  voiceTimer=undefined;
  speakTimer=undefined;
  if(activePronunciation){activePronunciation.pause();activePronunciation.currentTime=0;activePronunciation=undefined}
  if(typeof window!=='undefined'&&'speechSynthesis'in window)window.speechSynthesis.cancel();
}

export function speakKorean(text:string,enabled:boolean,rate=NORMAL_SPEECH_RATE){
  if(typeof window==='undefined'||!('speechSynthesis'in window))return;
  const synth=window.speechSynthesis;
  const request=++speechRequest;
  synth.cancel();
  if(voiceTimer!==undefined)window.clearTimeout(voiceTimer);
  if(speakTimer!==undefined)window.clearTimeout(speakTimer);
  voiceTimer=undefined;
  speakTimer=undefined;
  if(!enabled||!text.trim())return;
  const play=(allowSystemKorean=false)=>{
    if(request!==speechRequest)return false;
    const voice=preferredKoreanVoice(synth);
    if(!voice&&!allowSystemKorean)return false;
    const utterance=new SpeechSynthesisUtterance(normalizeKoreanSpeechText(text));
    utterance.lang='ko-KR';
    if(voice)utterance.voice=voice;
    utterance.rate=rate;
    utterance.pitch=1;
    utterance.volume=1;
    speakTimer=window.setTimeout(()=>{
      speakTimer=undefined;
      if(request!==speechRequest)return;
      synth.resume();
      synth.speak(utterance);
    },45);
    return true;
  };
  if(play())return;
  const voicesReady=()=>{if(play()){synth.removeEventListener('voiceschanged',voicesReady);if(voiceTimer!==undefined)window.clearTimeout(voiceTimer);voiceTimer=undefined}};
  synth.addEventListener('voiceschanged',voicesReady);
  voiceTimer=window.setTimeout(()=>{synth.removeEventListener('voiceschanged',voicesReady);voiceTimer=undefined;play(true)},350);
}

export function playFootPronunciation(enabled:boolean){
  stopKoreanSpeech();
  if(!enabled||typeof window==='undefined')return;
  const audio=new Audio('/audio/bal.wav');
  activePronunciation=audio;
  audio.playbackRate=.86;
  audio.onended=()=>{if(activePronunciation===audio)activePronunciation=undefined};
  void audio.play().catch(()=>{if(activePronunciation===audio)activePronunciation=undefined;speakKorean('발이에요. 발로 걸어요.',true,.86)});
}
