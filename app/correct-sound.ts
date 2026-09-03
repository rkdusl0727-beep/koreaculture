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
