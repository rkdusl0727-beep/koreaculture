export function playDingDongDaeng(enabled:boolean){
  if(!enabled||typeof window==='undefined')return;
  const AudioContextClass=window.AudioContext||(window as typeof window&{webkitAudioContext:typeof AudioContext}).webkitAudioContext;
  if(!AudioContextClass)return;
  const context=new AudioContextClass();
  const start=context.currentTime;
  [659.25,783.99,987.77].forEach((frequency,index)=>{
    const oscillator=context.createOscillator();
    const gain=context.createGain();
    const at=start+index*.12;
    oscillator.type='sine';
    oscillator.frequency.setValueAtTime(frequency,at);
    gain.gain.setValueAtTime(.0001,at);
    gain.gain.exponentialRampToValueAtTime(.17,at+.025);
    gain.gain.exponentialRampToValueAtTime(.0001,at+.34);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(at);
    oscillator.stop(at+.36);
  });
  window.setTimeout(()=>context.close(),900);
}

export function playCelebrationSound(enabled:boolean){
  if(!enabled||typeof window==='undefined')return;
  const AudioContextClass=window.AudioContext||(window as typeof window&{webkitAudioContext:typeof AudioContext}).webkitAudioContext;
  if(!AudioContextClass)return;
  const context=new AudioContextClass();
  const start=context.currentTime;
  const melody=[523.25,659.25,783.99,1046.5,783.99,1046.5];
  melody.forEach((frequency,index)=>{
    const oscillator=context.createOscillator();
    const gain=context.createGain();
    const at=start+index*.14;
    oscillator.type=index<4?'sine':'triangle';
    oscillator.frequency.setValueAtTime(frequency,at);
    gain.gain.setValueAtTime(.0001,at);
    gain.gain.exponentialRampToValueAtTime(.19,at+.025);
    gain.gain.exponentialRampToValueAtTime(.0001,at+.38);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(at);
    oscillator.stop(at+.4);
  });
  [523.25,659.25,783.99].forEach(frequency=>{
    const oscillator=context.createOscillator();
    const gain=context.createGain();
    const at=start+.9;
    oscillator.type='sine';
    oscillator.frequency.setValueAtTime(frequency,at);
    gain.gain.setValueAtTime(.0001,at);
    gain.gain.exponentialRampToValueAtTime(.1,at+.03);
    gain.gain.exponentialRampToValueAtTime(.0001,at+.62);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(at);
    oscillator.stop(at+.65);
  });
  window.setTimeout(()=>context.close(),1800);
}
