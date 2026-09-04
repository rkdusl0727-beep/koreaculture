export type HanbokFitSlot='socks'|'bottom'|'top'|'coat'|'shoes'|'ornament'|'hair'|'tie';

export type BodyAnchor={x:number;y:number};
export type BodyFitProfile={
  head:{center:BodyAnchor;width:number;height:number};
  hair:{left:BodyAnchor;right:BodyAnchor;band:BodyAnchor;top:BodyAnchor};
  neck:BodyAnchor;
  shoulders:{left:BodyAnchor;right:BodyAnchor};
  waist:BodyAnchor;
  wrists:{left:BodyAnchor;right:BodyAnchor};
  feet:{left:BodyAnchor;right:BodyAnchor};
};

export type GarmentFit={left:number;top:number;width:number;height:number;rotation:number;zIndex:number};
type VisibleTarget={left:number;top:number;width:number;rotation?:number;zIndex?:number};
type ImageGeometry={width:number;height:number;alpha:{x:number;y:number;width:number;height:number}};

// All values use the shared 1:2 character canvas. These anchors are intentionally
// separate: child B is narrower through the head, shoulders, waist and feet.
export const bodyFitProfiles:Record<0|1,BodyFitProfile>={
  0:{
    head:{center:{x:50,y:15.2},width:56,height:25},
    hair:{left:{x:26,y:8},right:{x:74,y:8},band:{x:50,y:8.8},top:{x:50,y:2.8}},
    neck:{x:50,y:28.2},shoulders:{left:{x:31,y:31},right:{x:69,y:31}},waist:{x:50,y:52.5},
    wrists:{left:{x:8,y:54},right:{x:92,y:54}},feet:{left:{x:37,y:94},right:{x:64,y:94}},
  },
  1:{
    head:{center:{x:48.9,y:14.3},width:49,height:24},
    hair:{left:{x:31,y:8},right:{x:68,y:8},band:{x:49,y:7.7},top:{x:49,y:2.2}},
    neck:{x:49,y:28.8},shoulders:{left:{x:33,y:31.5},right:{x:66,y:31.5}},waist:{x:49,y:53.2},
    wrists:{left:{x:8,y:55},right:{x:90,y:55}},feet:{left:{x:34,y:94},right:{x:62,y:94}},
  },
};

const geometry:Record<string,ImageGeometry>={
  'jeogori-1':{width:271,height:257,alpha:{x:23,y:13,width:238,height:195}},
  'jeogori-2':{width:271,height:288,alpha:{x:17,y:49,width:244,height:195}},
  'jeogori-3':{width:270,height:287,alpha:{x:13,y:33,width:246,height:198}},
  'jeogori-4':{width:271,height:307,alpha:{x:11,y:61,width:244,height:194}},
  'jeogori-5':{width:261,height:313,alpha:{x:10,y:56,width:238,height:194}},
  'jeogori-6':{width:271,height:290,alpha:{x:21,y:36,width:240,height:200}},
  'jeogori-boy-v1':{width:1536,height:1024,alpha:{x:101,y:87,width:1334,height:834}},
  'chima-1':{width:256,height:321,alpha:{x:14,y:15,width:232,height:296}},
  'chima-2':{width:271,height:320,alpha:{x:33,y:13,width:228,height:297}},
  'chima-3':{width:270,height:322,alpha:{x:23,y:15,width:234,height:297}},
  'chima-4':{width:271,height:321,alpha:{x:10,y:15,width:237,height:296}},
  'chima-5':{width:249,height:321,alpha:{x:10,y:14,width:224,height:297}},
  'chima-6':{width:256,height:321,alpha:{x:14,y:15,width:232,height:296}},
  'baji-1':{width:256,height:333,alpha:{x:16,y:41,width:230,height:282}},
  'baji-2':{width:271,height:333,alpha:{x:36,y:42,width:224,height:281}},
  'baji-3':{width:270,height:333,alpha:{x:24,y:42,width:222,height:281}},
  'baji-4':{width:271,height:333,alpha:{x:18,y:42,width:224,height:281}},
  'baji-5':{width:253,height:333,alpha:{x:13,y:42,width:222,height:281}},
  'durumagi-1':{width:1024,height:1536,alpha:{x:24,y:32,width:978,height:1504}},
  'durumagi-2':{width:1024,height:1536,alpha:{x:43,y:78,width:939,height:1416}},
  'durumagi-3':{width:1024,height:1536,alpha:{x:27,y:0,width:968,height:1496}},
  'beoseon-1':{width:1536,height:1024,alpha:{x:189,y:84,width:1066,height:850}},
  'beoseon-2':{width:1536,height:1024,alpha:{x:189,y:84,width:1066,height:850}},
  'beoseon-3':{width:1536,height:1024,alpha:{x:189,y:84,width:1066,height:850}},
  'flower-shoes-1':{width:600,height:300,alpha:{x:64,y:32,width:472,height:235}},
  'flower-shoes-2':{width:600,height:300,alpha:{x:63,y:32,width:471,height:235}},
  'flower-shoes-3':{width:600,height:300,alpha:{x:64,y:32,width:472,height:235}},
  'flower-shoes-4':{width:600,height:300,alpha:{x:63,y:32,width:471,height:235}},
  'hairband-1':{width:1536,height:1024,alpha:{x:25,y:93,width:1485,height:797}},
  'hairband-2':{width:1536,height:1024,alpha:{x:51,y:55,width:1451,height:889}},
  'hairpin-1':{width:1536,height:1024,alpha:{x:45,y:64,width:1458,height:860}},
  'hairpin-2':{width:1536,height:1024,alpha:{x:172,y:19,width:1205,height:975}},
};

const slotTargets:Record<0|1,Record<Exclude<HanbokFitSlot,'tie'>,VisibleTarget>>={
  0:{
    socks:{left:24,top:84,width:52,zIndex:1},bottom:{left:6,top:48.5,width:88,zIndex:2},
    top:{left:6,top:28.2,width:88,zIndex:3},coat:{left:1,top:24,width:98,zIndex:4},
    shoes:{left:31,top:91,width:38,zIndex:5},ornament:{left:51,top:39,width:27,zIndex:6},
    hair:{left:22,top:4.2,width:56,zIndex:9},
  },
  1:{
    socks:{left:24,top:84.5,width:48,zIndex:1},bottom:{left:10,top:49,width:78,zIndex:2},
    top:{left:2,top:27.5,width:94,zIndex:3},coat:{left:3,top:24.5,width:92,zIndex:4},
    shoes:{left:31,top:91,width:36,zIndex:5},ornament:{left:50,top:40,width:25,zIndex:6},
    hair:{left:25,top:3.8,width:48,zIndex:9},
  },
};

const itemTargets:Record<0|1,Record<string,VisibleTarget>>={
  0:{
    'hairband-1':{left:24,top:5.8,width:52,zIndex:8},'hairband-2':{left:24,top:5.2,width:52,zIndex:8},
    'hairpin-1':{left:67,top:7.2,width:13.5,rotation:-8,zIndex:10},'hairpin-2':{left:20.2,top:7.6,width:13.8,rotation:8,zIndex:10},
  },
  1:{
    'hairband-1':{left:25,top:4.6,width:48,zIndex:8},'hairband-2':{left:26,top:4.1,width:46,zIndex:8},
    'hairpin-1':{left:63,top:7.1,width:12,rotation:-8,zIndex:10},'hairpin-2':{left:27.2,top:7.4,width:12.2,rotation:8,zIndex:10},
  },
};

const fallbackGeometry:ImageGeometry={width:100,height:100,alpha:{x:0,y:0,width:100,height:100}};

function imageBox(target:VisibleTarget,image:ImageGeometry):GarmentFit{
  const width=target.width/(image.alpha.width/image.width);
  // The character canvas is 1:2, so an undistorted image needs half as much
  // percentage height as percentage width before applying its native ratio.
  const height=width*.5*(image.height/image.width);
  return{
    left:target.left-(image.alpha.x/image.width)*width,
    top:target.top-(image.alpha.y/image.height)*height,
    width,height,rotation:target.rotation||0,zIndex:target.zIndex||1,
  };
}

export function getHanbokFit(kind:0|1,id:string,slot:HanbokFitSlot):GarmentFit{
  const target=itemTargets[kind][id]||slotTargets[kind][slot as Exclude<HanbokFitSlot,'tie'>]||slotTargets[kind].top;
  return imageBox(target,geometry[id]||fallbackGeometry);
}
