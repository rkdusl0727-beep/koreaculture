'use client';

import {Button} from '@/components/ui/button';

export default function HomeIconButton({onClick,className=''}:{onClick:()=>void;className?:string}){
  return <Button type="button" variant="outline" className={`home-icon-button ${className}`} onClick={onClick} aria-label="홈으로"><span aria-hidden="true"/></Button>;
}
