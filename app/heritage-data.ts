export type HeritageTreasure={
  id:string;
  name:string;
  art:string;
  image:string;
  desc:string;
  size:number;
  positions:Array<{x:number;y:number}>;
};

// 세 활동은 이 목록 하나만 함께 사용합니다. 기존 명칭·설명·이미지 경로를 유지합니다.
export const HERITAGE_TREASURES:HeritageTreasure[]=[
  {id:'sungnyemun',name:'숭례문',art:'sungnyemun',image:'/heritage-items/sungnyemun-front.png',desc:'서울을 드나들던 큰 성문이에요.',size:11,positions:[{x:54,y:36},{x:59,y:36},{x:64,y:36}]},
  {id:'cheomseongdae',name:'첨성대',art:'cheomseongdae',image:'/heritage-items/cheomseongdae.png',desc:'옛날 사람들이 하늘과 별을 살펴보던 곳이에요.',size:6.5,positions:[{x:64,y:40},{x:70,y:40},{x:76,y:39},{x:81,y:38}]},
  {id:'dabotap',name:'다보탑',art:'dabotap',image:'/heritage-items/dabotap.png',desc:'돌을 정교하게 쌓아 만든 아름다운 탑이에요.',size:7,positions:[{x:37,y:40},{x:42,y:40},{x:47,y:39}]},
  {id:'geunjeongjeon',name:'경복궁 근정전',art:'geunjeongjeon',image:'/heritage-items/geunjeongjeon.png',desc:'조선 시대 왕이 중요한 일을 하던 궁궐 건물이에요.',size:12,positions:[{x:23,y:30},{x:27,y:30},{x:31,y:31}]},
  {id:'seokguram',name:'석굴암',art:'seokguram',image:'/heritage-items/seokguram.png',desc:'돌로 만든 방 안에 부처님상이 있는 문화재예요.',size:9,positions:[{x:8,y:22},{x:12,y:22},{x:16,y:23}]},
  {id:'silla-crown',name:'신라 금관',art:'silla-crown',image:'/heritage-items/silla-crown.png',desc:'신라 왕과 왕족이 머리에 쓰던 반짝이는 금관이에요.',size:7,positions:[{x:10,y:50},{x:14,y:51},{x:18,y:51},{x:22,y:50}]},
  {id:'turtle-ship',name:'거북선',art:'turtle-ship',image:'/heritage-items/turtle-ship.png',desc:'단단한 지붕을 얹어 바다를 지키던 배예요.',size:9,positions:[{x:72,y:47},{x:69,y:46},{x:75,y:46}]},
  {id:'traditional-mask',name:'전통 탈',art:'traditional-mask',image:'/heritage-items/traditional-mask-clean.png',desc:'얼굴에 쓰고 춤과 이야기를 보여 주던 탈이에요.',size:5.5,positions:[{x:26,y:53},{x:31,y:52},{x:36,y:52}]},
  {id:'goryeo-celadon',name:'고려청자',art:'goryeo-celadon',image:'/heritage-items/goryeo-celadon-v2.png',desc:'푸른 옥빛이 아름다운 고려 시대 그릇이에요.',size:5.5,positions:[{x:18,y:96},{x:23,y:96},{x:29,y:96},{x:34,y:96}]},
  {id:'joseon-white-porcelain',name:'조선백자',art:'joseon-white-porcelain',image:'/heritage-items/joseon-white-porcelain.png',desc:'깨끗한 흰빛과 둥근 모양이 아름다운 그릇이에요.',size:5,positions:[{x:68,y:96},{x:73,y:96},{x:79,y:96},{x:84,y:96}]},
  {id:'seokgatap',name:'석가탑',art:'seokgatap',image:'/heritage-items/seokgatap.png',desc:'단정하게 쌓은 세 층의 돌탑이에요.',size:7.5,positions:[{x:38,y:42},{x:44,y:42},{x:50,y:41},{x:56,y:41}]},
  {id:'cheonmachong',name:'천마총 무덤',art:'cheonmachong',image:'/heritage-items/cheonmachong.png',desc:'신라의 왕과 왕족을 모신 둥근 무덤이에요.',size:9,positions:[{x:84,y:29},{x:88,y:30},{x:92,y:30}]},
];

export const HERITAGE_CLUES=[
  '지붕과 문 모양을 자세히 살펴보세요.',
  '돌을 쌓아 만든 모습을 찾아보세요.',
  '잔디로 덮인 둥근 무덤을 찾아보세요.',
  '야외의 넓은 땅을 살펴보세요.',
  '사찰 마당의 돌 구조물을 찾아보세요.',
];

type HiddenPlacement={point:{x:number;y:number};index:number};

export function hiddenPlacementsOverlap(placements:Record<string,number>){
  const placed=HERITAGE_TREASURES.map(treasure=>({treasure,point:treasure.positions[placements[treasure.id]??0]}));
  return placed.some((current,index)=>placed.slice(index+1).some(other=>Math.hypot(current.point.x-other.point.x,current.point.y-other.point.y)<(current.treasure.size+other.treasure.size)/2+3));
}

export function newHiddenPlacements(previous:Record<string,number>={}){
  const order=[...HERITAGE_TREASURES].sort((a,b)=>a.positions.length-b.positions.length||b.size-a.size);
  const chosen:Record<string,number>={};
  const used:Array<{x:number;y:number;size:number}>=[];
  const place=(orderIndex:number):boolean=>{
    if(orderIndex===order.length)return true;
    const treasure=order[orderIndex];
    const candidates:HiddenPlacement[]=shuffled(treasure.positions.map((point,index)=>({point,index}))).sort((a,b)=>Number(a.index===previous[treasure.id])-Number(b.index===previous[treasure.id]));
    for(const candidate of candidates){
      if(!used.every(other=>Math.hypot(candidate.point.x-other.x,candidate.point.y-other.y)>=(treasure.size+other.size)/2+3))continue;
      chosen[treasure.id]=candidate.index;
      used.push({...candidate.point,size:treasure.size});
      if(place(orderIndex+1))return true;
      used.pop();
      delete chosen[treasure.id];
    }
    return false;
  };
  if(!place(0))throw new Error('문화재가 겹치지 않는 배치를 만들 수 없습니다.');
  return chosen;
}

export function shuffled<T>(items:T[]){
  const next=[...items];
  for(let i=next.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[next[i],next[j]]=[next[j],next[i]]}
  return next;
}
