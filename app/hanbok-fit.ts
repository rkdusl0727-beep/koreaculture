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
export type WearablePlacement={x:number;y:number;width:number;height:number;scale:number;rotation:number;zIndex:number};
export type CharacterFitProfile={
  jeogori:WearablePlacement;skirt:WearablePlacement;pants:WearablePlacement;durumagi:WearablePlacement;
  beoseonLeft:WearablePlacement;beoseonRight:WearablePlacement;shoeLeft:WearablePlacement;shoeRight:WearablePlacement;
  headband:WearablePlacement;hairAccessoryLeft:WearablePlacement;hairAccessoryRight:WearablePlacement;ornament:WearablePlacement;
};
type VisibleTarget={left:number;top:number;width:number;height:number;scale?:number;rotation?:number;zIndex?:number};
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
  // The studio uses the paired, front-facing beoseon cutouts. Their canvas and
  // visible bounds differ from the catalog image, so they need their own crop.
  'beoseon-1':{width:600,height:300,alpha:{x:68,y:32,width:452,height:235}},
  'beoseon-2':{width:600,height:300,alpha:{x:56,y:32,width:461,height:235}},
  'beoseon-3':{width:600,height:300,alpha:{x:68,y:32,width:452,height:235}},
  'flower-shoes-1':{width:600,height:300,alpha:{x:64,y:32,width:472,height:235}},
  'flower-shoes-2':{width:600,height:300,alpha:{x:63,y:32,width:471,height:235}},
  'flower-shoes-3':{width:600,height:300,alpha:{x:64,y:32,width:472,height:235}},
  'flower-shoes-4':{width:600,height:300,alpha:{x:63,y:32,width:471,height:235}},
  'hairband-1':{width:1536,height:1024,alpha:{x:25,y:93,width:1485,height:797}},
  'hairband-2':{width:1536,height:1024,alpha:{x:51,y:55,width:1451,height:889}},
  'hairpin-1':{width:1536,height:1024,alpha:{x:45,y:64,width:1458,height:860}},
  'hairpin-2':{width:1536,height:1024,alpha:{x:172,y:19,width:1205,height:975}},
};

// Fixed placements are stored separately for each child on the shared 1:2
// percentage canvas. No screen-pixel or drop coordinate is used for wearing.
export const fitProfiles:Record<'child1'|'child2',CharacterFitProfile>={
  child1:{
    jeogori:{x:6,y:28.2,width:88,height:34,scale:1,rotation:0,zIndex:3},skirt:{x:17,y:49.5,width:66,height:42,scale:1,rotation:0,zIndex:2},pants:{x:18,y:50,width:64,height:42,scale:1,rotation:0,zIndex:2},durumagi:{x:1,y:24,width:98,height:66,scale:1,rotation:0,zIndex:4},
    beoseonLeft:{x:31,y:86,width:18,height:11,scale:1,rotation:0,zIndex:1},beoseonRight:{x:51,y:86,width:18,height:11,scale:1,rotation:0,zIndex:1},shoeLeft:{x:34,y:92.5,width:15,height:5.5,scale:1,rotation:0,zIndex:5},shoeRight:{x:51,y:92.5,width:15,height:5.5,scale:1,rotation:0,zIndex:5},
    headband:{x:29,y:6.4,width:42,height:13,scale:1,rotation:0,zIndex:9},hairAccessoryLeft:{x:21.5,y:7.8,width:11.8,height:9,scale:1,rotation:8,zIndex:11},hairAccessoryRight:{x:68,y:7.4,width:11.5,height:9,scale:1,rotation:-8,zIndex:11},ornament:{x:51,y:39,width:27,height:28,scale:1,rotation:0,zIndex:12},
  },
  child2:{
    jeogori:{x:2,y:27.5,width:94,height:35,scale:1,rotation:0,zIndex:3},skirt:{x:18,y:50,width:64,height:42,scale:1,rotation:0,zIndex:2},pants:{x:17,y:50,width:64,height:42,scale:1,rotation:0,zIndex:2},durumagi:{x:3,y:24.5,width:92,height:65,scale:1,rotation:0,zIndex:4},
    beoseonLeft:{x:31,y:86.5,width:17,height:10.5,scale:1,rotation:0,zIndex:1},beoseonRight:{x:50,y:86.5,width:17,height:10.5,scale:1,rotation:0,zIndex:1},shoeLeft:{x:35,y:92.5,width:14,height:5.3,scale:1,rotation:0,zIndex:5},shoeRight:{x:51,y:92.5,width:14,height:5.3,scale:1,rotation:0,zIndex:5},
    headband:{x:30,y:5.5,width:38,height:12.5,scale:1,rotation:0,zIndex:9},hairAccessoryLeft:{x:28,y:7.6,width:10.7,height:8.5,scale:1,rotation:8,zIndex:11},hairAccessoryRight:{x:63.5,y:7.2,width:10.5,height:8.5,scale:1,rotation:-8,zIndex:11},ornament:{x:50,y:40,width:25,height:26,scale:1,rotation:0,zIndex:12},
  },
};

const asTarget=(placement:WearablePlacement):VisibleTarget=>({left:placement.x,top:placement.y,width:placement.width,height:placement.height,scale:placement.scale,rotation:placement.rotation,zIndex:placement.zIndex});
const paired=(left:WearablePlacement,right:WearablePlacement):VisibleTarget=>({left:Math.min(left.x,right.x),top:Math.min(left.y,right.y),width:Math.max(left.x+left.width,right.x+right.width)-Math.min(left.x,right.x),height:Math.max(left.y+left.height,right.y+right.height)-Math.min(left.y,right.y),scale:1,rotation:0,zIndex:left.zIndex});
const profileFor=(kind:0|1)=>fitProfiles[kind===0?'child1':'child2'];

function targetFor(kind:0|1,id:string,slot:HanbokFitSlot):VisibleTarget{
  const profile=profileFor(kind);
  if(slot==='top')return asTarget(profile.jeogori);
  if(slot==='bottom')return asTarget(id.startsWith('chima-')?profile.skirt:profile.pants);
  if(slot==='coat')return asTarget(profile.durumagi);
  if(slot==='socks')return paired(profile.beoseonLeft,profile.beoseonRight);
  if(slot==='shoes')return paired(profile.shoeLeft,profile.shoeRight);
  if(slot==='ornament')return asTarget(profile.ornament);
  if(id.startsWith('hairband-'))return asTarget(profile.headband);
  if(id==='hairpin-2')return asTarget(profile.hairAccessoryLeft);
  if(id==='hairpin-1')return asTarget(profile.hairAccessoryRight);
  return asTarget(profile.jeogori);
}

const fallbackGeometry:ImageGeometry={width:100,height:100,alpha:{x:0,y:0,width:100,height:100}};

function imageBox(target:VisibleTarget,image:ImageGeometry):GarmentFit{
  const visibleWidth=target.width*(target.scale||1);
  const width=visibleWidth/(image.alpha.width/image.width);
  // The character canvas is 1:2, so an undistorted image needs half as much
  // percentage height as percentage width before applying its native ratio.
  const height=width*.5*(image.height/image.width);
  return{
    left:target.left-(visibleWidth-target.width)/2-(image.alpha.x/image.width)*width,
    top:target.top-(image.alpha.y/image.height)*height,
    width,height,rotation:target.rotation||0,zIndex:target.zIndex||1,
  };
}

export function getHanbokFit(kind:0|1,id:string,slot:HanbokFitSlot):GarmentFit{
  return imageBox(targetFor(kind,id,slot),geometry[id]||fallbackGeometry);
}
