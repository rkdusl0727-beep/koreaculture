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
  {id:'sungnyemun',name:'숭례문',art:'sungnyemun',image:'/heritage-items/sungnyemun.png',desc:'서울을 드나들던 큰 성문이에요.',size:11,positions:[{x:58,y:30},{x:54,y:29},{x:62,y:30}]},
  {id:'cheomseongdae',name:'첨성대',art:'cheomseongdae',image:'/heritage-items/cheomseongdae.png',desc:'옛날 사람들이 하늘과 별을 살펴보던 곳이에요.',size:6.5,positions:[{x:76,y:18},{x:80,y:20},{x:72,y:19}]},
  {id:'dabotap',name:'다보탑',art:'dabotap',image:'/heritage-items/dabotap.png',desc:'돌을 정교하게 쌓아 만든 아름다운 탑이에요.',size:7,positions:[{x:88,y:25},{x:91,y:29},{x:85,y:27}]},
  {id:'geunjeongjeon',name:'경복궁 근정전',art:'geunjeongjeon',image:'/heritage-items/geunjeongjeon.png',desc:'조선 시대 왕이 중요한 일을 하던 궁궐 건물이에요.',size:12,positions:[{x:23,y:16},{x:27,y:18},{x:20,y:19}]},
  {id:'seokguram',name:'석굴암',art:'seokguram',image:'/heritage-items/seokguram.png',desc:'돌로 만든 방 안에 부처님상이 있는 문화재예요.',size:9,positions:[{x:8,y:20},{x:11,y:18},{x:13,y:22}]},
  {id:'silla-crown',name:'신라 금관',art:'silla-crown',image:'/heritage-items/silla-crown.png',desc:'신라 왕과 왕족이 머리에 쓰던 반짝이는 금관이에요.',size:6,positions:[{x:51,y:36},{x:48,y:38},{x:55,y:37}]},
  {id:'turtle-ship',name:'거북선',art:'turtle-ship',image:'/heritage-items/turtle-ship.png',desc:'단단한 지붕을 얹어 바다를 지키던 배예요.',size:9,positions:[{x:72,y:47},{x:66,y:45},{x:77,y:45}]},
  {id:'traditional-mask',name:'전통 탈',art:'traditional-mask',image:'/heritage-items/traditional-mask.png',desc:'얼굴에 쓰고 춤과 이야기를 보여 주던 탈이에요.',size:5.5,positions:[{x:29,y:46},{x:34,y:48},{x:25,y:50}]},
  {id:'goryeo-celadon',name:'고려청자',art:'goryeo-celadon',image:'/heritage-items/goryeo-celadon.png',desc:'푸른 옥빛이 아름다운 고려 시대 그릇이에요.',size:5,positions:[{x:30,y:76},{x:34,y:79},{x:26,y:80}]},
  {id:'joseon-white-porcelain',name:'조선백자',art:'joseon-white-porcelain',image:'/heritage-items/joseon-white-porcelain.png',desc:'깨끗한 흰빛과 둥근 모양이 아름다운 그릇이에요.',size:5,positions:[{x:61,y:82},{x:66,y:84},{x:57,y:84}]},
  {id:'seokgatap',name:'석가탑',art:'seokgatap',image:'/heritage-items/seokgatap.png',desc:'단정하게 쌓은 세 층의 돌탑이에요.',size:6.5,positions:[{x:93,y:17},{x:89,y:19},{x:95,y:22}]},
  {id:'cheonmachong',name:'천마총 무덤',art:'cheonmachong',image:'/heritage-items/cheonmachong.png',desc:'신라의 왕과 왕족을 모신 둥근 무덤이에요.',size:9,positions:[{x:84,y:9},{x:89,y:11},{x:80,y:12}]},
];

export const HERITAGE_CLUES=[
  '지붕과 문 모양을 자세히 살펴보세요.',
  '돌을 쌓아 만든 모습을 찾아보세요.',
  '잔디로 덮인 둥근 무덤을 찾아보세요.',
  '야외의 넓은 땅을 살펴보세요.',
  '사찰 마당의 돌 구조물을 찾아보세요.',
];

export function shuffled<T>(items:T[]){
  const next=[...items];
  for(let i=next.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[next[i],next[j]]=[next[j],next[i]]}
  return next;
}
