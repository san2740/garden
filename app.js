import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {FilesetResolver, ImageSegmenter} from './vendor/vision/vision_bundle.mjs';

window.THREE = THREE;
const status = document.querySelector('#status');
const start = document.querySelector('#start');
const reset = document.querySelector('#reset');
const people = document.querySelector('#people');
const canvas = document.querySelector('#camera');
const snapshot = document.createElement('canvas');
snapshot.width = snapshot.height = 256;
const context = snapshot.getContext('2d');
const rgba = new Uint8Array(256 * 256 * 4);
const frameImage = context.createImageData(256,256);
const personImage = context.createImageData(256,256);
const portrait = document.createElement('canvas');
portrait.width = portrait.height = 256;
const portraitContext = portrait.getContext('2d');
const texture = new THREE.CanvasTexture(portrait);
texture.colorSpace = THREE.SRGBColorSpace;
const person = new THREE.Mesh(new THREE.PlaneGeometry(2,2), new THREE.MeshBasicMaterial({
  map:texture, transparent:true, depthTest:true, depthWrite:false, toneMapped:false
}));
person.visible = false;
person.frustumCulled = false;
const captureScene = new THREE.Scene();
const captureCamera = new THREE.OrthographicCamera(-1,1,1,-1,0,2);
captureCamera.position.z = 1;
const captureMaterial = new THREE.MeshBasicMaterial({toneMapped:false});
captureScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),captureMaterial));
const target = new THREE.WebGLRenderTarget(256,256);
let building, segmenter, xrScene, floorY, placed = false, lastSample = 0, tracking = false;
const ray = new THREE.Raycaster();
const ground = new THREE.Plane(new THREE.Vector3(0,1,0),0);

function say(text) { if (status.textContent !== text) status.textContent = text; }

function loadEngine() {
  return new Promise((resolve,reject) => {
    const script = document.createElement('script');
    script.src = './vendor/xr/xr.js';
    script.dataset.preloadChunks = 'slam';
    script.onerror = () => reject(new Error('AR 엔진 파일을 불러오지 못했습니다.'));
    const timeout = setTimeout(() => reject(new Error('AR 엔진 준비 시간이 초과되었습니다.')),60000);
    window.addEventListener('xrloaded',() => { clearTimeout(timeout); resolve(); },{once:true});
    document.head.append(script);
  });
}

function samplePerson(now) {
  if (!placed || !people.checked || !tracking) { person.visible = false; return; }
  if (now-lastSample < 150) return;
  lastSample = now;
  const {renderer,camera,cameraTexture} = xrScene;
  if (!cameraTexture) return;
  captureMaterial.map = cameraTexture;
  const previous = renderer.getRenderTarget();
  renderer.setRenderTarget(target);
  renderer.render(captureScene,captureCamera);
  renderer.readRenderTargetPixels(target,0,0,256,256,rgba);
  renderer.setRenderTarget(previous);
  for (let y=0;y<256;y++) frameImage.data.set(rgba.subarray((255-y)*1024,(256-y)*1024),y*1024);
  context.putImageData(frameImage,0,0);
  segmenter.segmentForVideo(snapshot,now,result => {
    const mask = result.confidenceMasks?.[0];
    if (!mask) { person.visible = false; return; }
    const confidence = mask.getAsFloat32Array();
    let bottom = -1, sumX = 0, count = 0;
    for (let y=mask.height-1;y>=0;y--) {
      for (let x=0;x<mask.width;x++) {
        if (confidence[y*mask.width+x] < 0.8) continue;
        sumX += x;
        count++;
      }
      if (count >= 3) { bottom=y; break; }
      sumX=0; count=0;
    }
    if (bottom < 0 || bottom >= mask.height-3) { person.visible=false; say('사람의 발까지 화면에 보이게 비춰 주세요.'); return; }
    camera.updateMatrixWorld(true);
    ray.setFromCamera(new THREE.Vector2(2*(sumX/count+0.5)/mask.width-1,1-2*(bottom+0.5)/mask.height),camera);
    ground.constant = -floorY;
    const foot = ray.ray.intersectPlane(ground,new THREE.Vector3());
    if (!foot) { person.visible=false; return; }
    const depth = -camera.worldToLocal(foot.clone()).z;
    if (depth < 0.5 || depth > 15) { person.visible=false; return; }
    for (let y=0;y<256;y++) {
      for (let x=0;x<256;x++) {
        const i=(y*256+x)*4;
        const m=Math.floor(y*mask.height/256)*mask.width+Math.floor(x*mask.width/256);
        personImage.data[i]=frameImage.data[i];
        personImage.data[i+1]=frameImage.data[i+1];
        personImage.data[i+2]=frameImage.data[i+2];
        personImage.data[i+3]=Math.round(255*THREE.MathUtils.clamp((confidence[m]-0.4)/0.4,0,1));
      }
    }
    portraitContext.putImageData(personImage,0,0);
    texture.needsUpdate = true;
    const projection = camera.projectionMatrix.elements;
    person.position.set(depth*projection[8]/projection[0],depth*projection[9]/projection[5],-depth);
    person.scale.set(depth/projection[0],depth/projection[5],1);
    person.visible=true;
    say('사람 거리 약 '+depth.toFixed(1)+'m · 발 위치로 추정');
  });
}

function place(event) {
  if (!xrScene || placed || !tracking) return;
  const bounds=canvas.getBoundingClientRect();
  const hits=XR8.XrController.hitTest((event.clientX-bounds.left)/bounds.width,(event.clientY-bounds.top)/bounds.height,['DETECTED_SURFACE']);
  if (!hits.length) { say('바닥을 천천히 비춘 후 다시 터치하세요.'); return; }
  const door=new THREE.Vector3().copy(hits[0].position);
  const outward=xrScene.camera.position.clone().sub(door);
  outward.y=0;
  if (outward.length()<0.6 || outward.length()>8) { say('2~4m 앞 바닥에 배치하세요.'); return; }
  outward.normalize();
  building.position.copy(door).addScaledVector(outward,-4.9);
  building.rotation.y=Math.atan2(outward.x,outward.z);
  building.visible=true; placed=true; floorY=door.y;
  reset.hidden=false;
  say('배치되었습니다. 사람 한 명의 발까지 비춰 시험하세요.');
}

async function prepare() {
  if (!window.isSecureContext) throw new Error('HTTPS 주소에서 열어 주세요.');
  const [_,gltf,vision] = await Promise.all([
    loadEngine(),new GLTFLoader().loadAsync('./pavilion.glb'),
    FilesetResolver.forVisionTasks('./vendor/vision/wasm')
  ]);
  building=gltf.scene;
  building.traverse(node => { if (['Site','Terrace','Entrance pathway'].includes((node.userData.name??node.name).replaceAll('_',' '))) node.visible=false; });
  building.visible=false;
  segmenter=await ImageSegmenter.createFromOptions(vision,{
    baseOptions:{modelAssetPath:'./person.tflite',delegate:'CPU'},
    runningMode:'VIDEO',outputConfidenceMasks:true,outputCategoryMask:false
  });
  start.disabled=false; start.textContent='카메라 AR 시작'; say('준비되었습니다. Safari에서 시작하세요.');
}

start.onclick=async () => {
  start.disabled=true;
  try {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      const permission=await DeviceMotionEvent.requestPermission();
      if (permission !== 'granted') throw new Error('움직임 센서 접근을 허용해야 합니다.');
    }
    XR8.XrController.configure({scale:'absolute',disableWorldTracking:false});
    XR8.Threejs.configure({renderCameraTexture:true});
    XR8.addCameraPipelineModules([
      XR8.GlTextureRenderer.pipelineModule(),XR8.Threejs.pipelineModule(),XR8.XrController.pipelineModule(),
      {
        name:'pavilion-person',
        onStart:() => {
          xrScene=XR8.Threejs.xrScene();
          xrScene.scene.add(building,new THREE.HemisphereLight(0xffffff,0x9c8f79,2));
          const light=new THREE.DirectionalLight(0xffffff,2);
          light.position.set(3,8,2); xrScene.scene.add(light);
          xrScene.camera.add(person); xrScene.scene.add(xrScene.camera);
          tracking=true;
          start.hidden=true;
          say('주변 바닥을 천천히 비추고 현관 위치를 터치하세요.');
        },
        onUpdate:() => { try { samplePerson(performance.now()); } catch(error) { person.visible=false; people.checked=false; say('사람 합성 오류 · '+error.message); console.error(error); } },
        onException:error => say('AR 오류 · '+(error.message??String(error))),
        onPaused:() => { tracking=false; person.visible=false; },
        onResume:() => { tracking=true; },
        listeners:[{event:'reality.trackingstatus',process:event => {
          tracking=event.detail.status==='NORMAL';
          if (!tracking) { person.visible=false; say('위치 추적 중 · 주변을 천천히 비춰 주세요.'); }
        }}]
      }
    ]);
    await XR8.run({canvas});
  } catch(error) { say(error.message); start.disabled=false; }
};
reset.onclick=() => { placed=false; building.visible=false; person.visible=false; say('바닥을 터치해 다시 배치하세요.'); };
people.onchange=() => { person.visible=false; };
canvas.addEventListener('click',place);
window.addEventListener('pagehide',() => { if (window.XR8) XR8.stop(); segmenter?.close(); });
prepare().catch(error => say(error.message));
