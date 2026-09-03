'use client';

import {Button} from '@/components/ui/button';

export default function SoundIconButton({soundOn,onClick,className=''}:{soundOn:boolean;onClick:()=>void;className?:string}){
  return <Button type="button" variant="outline" onClick={onClick} className={`sound-icon-button ${className}`} aria-label={soundOn?'소리 끄기':'소리 켜기'} title={soundOn?'소리 끄기':'소리 켜기'}><img src={soundOn?'/sound-on-icon.png':'/sound-off-icon.png'} alt="" aria-hidden="true"/></Button>;
}
