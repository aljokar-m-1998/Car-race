// استيراد من CDN (ES Modules)
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import * as CANNON from "https://cdn.skypack.dev/cannon-es";

const canvas = document.getElementById('c');

// مشهد/كاميرا/رندر
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x121418);

const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, powerPreference:'high-performance' });
renderer.shadowMap.enabled = true;

const camera = new THREE.PerspectiveCamera( clamp(mapRange(window.innerWidth,320,1080,70,60),55,75),
                                            window.innerWidth/window.innerHeight, 0.1, 1000 );
camera.position.set(0, 12, 22);

// إضاءة
const hemi = new THREE.HemisphereLight(0xffffff, 0x202024, 0.8);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0xffffff, 0.9);
dir.position.set(10,18,8); dir.castShadow = true;
dir.shadow.mapSize.set(1024,1024);
scene.add(dir);

// عالم فيزياء
const world = new CANNON.World({ gravity: new CANNON.Vec3(0,-9.82,0) });
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;

// مادة أرضية وسيارة
const matTrack = new CANNON.Material('track');
const matTire  = new CANNON.Material('tire');
world.addContactMaterial(new CANNON.ContactMaterial(matTrack, matTire, {
  friction: 0.9, restitution: 0.0, contactEquationRelaxation: 3
}));

// منصة المضمار (لو وقعت منها تخسر)
const trackW = 24, trackH = 1, trackD = 70;
const trackBody = new CANNON.Body({ mass:0, material: matTrack, shape: new CANNON.Box(new CANNON.Vec3(trackW/2, trackH/2, trackD/2)) });
trackBody.position.set(0,0,0);
world.addBody(trackBody);

const trackGeo = new THREE.BoxGeometry(trackW, trackH, trackD);
const trackMat = new THREE.MeshStandardMaterial({ color:0x2b303b, metalness:0.1, roughness:0.9 });
const trackMesh = new THREE.Mesh(trackGeo, trackMat); trackMesh.receiveShadow = true;
trackMesh.position.copy(trackBody.position);
scene.add(trackMesh);

// حواف منخفضة (إزعاج فقط)
addGuard(-trackW/2+0.6, 0.6, 0);
addGuard(trackW/2-0.6, 0.6, 0);
function addGuard(x,y,z){
  const gBody = new CANNON.Body({ mass:0, shape: new CANNON.Box(new CANNON.Vec3(0.5,0.6,trackD/2-2)), material: matTrack });
  gBody.position.set(x,y,z); world.addBody(gBody);
  const gMesh = new THREE.Mesh(new THREE.BoxGeometry(1,1.2,trackD-4),
                new THREE.MeshStandardMaterial({ color:0x3a4750 }));
  gMesh.castShadow = true; gMesh.position.copy(gBody.position); scene.add(gMesh);
}

// عقبات متحركة بسيطة
const obstacles = [];
makeSpinner(0, 0.8, -10, 8);
makeSpinner(-6, 0.8, 18, 6, 1.3);
makeSpinner(6, 0.8, 35, 5, -1.8);
function makeSpinner(x,y,z, length=8, speed=1.6){
  const barGeo = new THREE.BoxGeometry(length, 0.5, 0.5);
  const barMat = new THREE.MeshStandardMaterial({ color:0xe85d75 });
  const bar = new THREE.Mesh(barGeo, barMat); bar.castShadow = true;
  bar.position.set(x,y,z); scene.add(bar);
  obstacles.push({ mesh: bar, speed, originY:y });
}

// سيارة كلا صندوق + فيزياء
const car = new THREE.Group();
const bodyGeo = new THREE.BoxGeometry(1.6, 0.6, 3.2);
const bodyMat = new THREE.MeshStandardMaterial({ color:0x45a29e, metalness:0.2, roughness:0.6 });
const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat); bodyMesh.castShadow = true;
car.add(bodyMesh);
scene.add(car);

const carShape = new CANNON.Box(new CANNON.Vec3(0.8,0.3,1.6));
const carBody = new CANNON.Body({ mass: 680, shape: carShape, material: matTire, linearDamping:0.2, angularDamping:0.4 });
carBody.position.set(0, 2.5, -trackD/2 + 5);
world.addBody(carBody);

// كاميرا تتبع
const camTarget = new THREE.Vector3();

// مدخلات تحكم (لمس + كيبورد)
const input = { left:false, right:false, gas:false, brk:false };
bindTouch('left','left'); bindTouch('right','right'); bindTouch('gas','gas'); bindTouch('brk','brk');
window.addEventListener('keydown', e => setKey(e.key,true));
window.addEventListener('keyup', e => setKey(e.key,false));
function setKey(k,on){
  if(k==='ArrowLeft'||k==='a') input.left = on;
  if(k==='ArrowRight'||k==='d') input.right = on;
  if(k==='ArrowUp'||k==='w') input.gas = on;
  if(k==='ArrowDown'||k==='s') input.brk = on;
}
function bindTouch(id, key){
  const b = document.getElementById(id);
  const on = (v)=>{ input[key]=v; };
  b.addEventListener('touchstart', e=>{ e.preventDefault(); on(true); }, {passive:false});
  b.addEventListener('touchend',   e=>{ e.preventDefault(); on(false); }, {passive:false});
}

// HUD
const hud = {
  level: document.getElementById('level'),
  speed: document.getElementById('speed'),
  status: document.getElementById('status'),
};

// منطق المستوى والصعوبة
let level = 1;
hud.level.textContent = level.toString();
function setDifficulty(lv){
  // كل مستوى: سرعة العقبات أعلى وقبضة أقل
  obstacles.forEach((o,i)=>{ o.speed = (i%2?1.3:-1.6) * (1 + (lv-1)*0.2); });
  carBody.linearDamping = 0.18 + (lv-1)*0.02;
}
setDifficulty(level);

// تحديث مقاس الرندر
function onResize(){
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.fov = clamp(mapRange(window.innerWidth, 320, 1080, 72, 60), 58, 76);
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize); onResize();

// حلقة التحديث
let last = 0;
function animate(t){
  const now = t/1000;
  const dt = Math.min(0.0167*2, now - (last || now));
  last = now;

  // فيزياء: قوة دفع ودركسيون
  const forward = new CANNON.Vec3(Math.sin(carBody.quaternion.y), 0, Math.cos(carBody.quaternion.y)); // تقريبي
  const steerPower = 1.8;
  const engine = 1800; // نيوتن
  const brakeF = 2200;

  // اتجاه العالم للسيارة (استخدم محور Y للدوران فقط)
  const q = carBody.quaternion;
  const yaw = getYawFromQuat(q);
  const dirF = new CANNON.Vec3(Math.sin(yaw), 0, Math.cos(yaw));

  if (input.gas) {
    carBody.applyForce(dirF.scale(engine), carBody.position);
  }
  if (input.brk) {
    const brkV = carBody.velocity.scale(-0.05);
    carBody.velocity.vadd(brkV, carBody.velocity);
    carBody.applyForce(dirF.scale(-brakeF), carBody.position);
  }

  // لف العربية: غيّر السرعة الزاوية حوالين Y
  if (input.left) carBody.angularVelocity.y = lerp(carBody.angularVelocity.y,  steerPower, 0.15);
  if (input.right)carBody.angularVelocity.y = lerp(carBody.angularVelocity.y, -steerPower, 0.15);
  if (!input.left && !input.right) carBody.angularVelocity.y *= 0.92;

  // خطوة فيزياء
  world.step(1/60, dt, 3);

  // مزامنة نموذج 3D مع جسم الفيزياء
  car.position.copy(carBody.position);
  car.quaternion.copy(new THREE.Quaternion(q.x,q.y,q.z,q.w));

  // حركة العقبات
  obstacles.forEach(o=>{
    o.mesh.rotation.y += o.speed * dt;
  });

  // كاميرا تتبع خلف السيارة
  const back = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  const camPos = new THREE.Vector3().copy(car.position).addScaledVector(back, -8).add(new THREE.Vector3(0,5,0));
  camera.position.lerp(camPos, 0.12);
  camTarget.lerp(new THREE.Vector3(car.position.x, car.position.y+0.8, car.position.z), 0.2);
  camera.lookAt(camTarget);

  // HUD سرعة
  const speedKmh = carBody.velocity.length() * 3.6;
  hud.speed.textContent = Math.round(speedKmh).toString();

  // حالة السقوط = خسارة
  if (carBody.position.y < -3) {
    hud.status.textContent = 'خسرت — وقعّت من المضمار';
    resetRun();
  } else {
    hud.status.textContent = 'جارٍ السباق';
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// إعادة الضبط (بداية جديدة وزيادة صعوبة بعد كل نجاح)
function resetRun(){
  // رجّع العربية لبداية المضمار
  carBody.velocity.set(0,0,0);
  carBody.angularVelocity.set(0,0,0);
  carBody.position.set(0, 2.5, -trackD/2 + 5);
  carBody.quaternion.set(0,0,0,1);
  // صعوبة أعلى بعد 5 بقاءات ناجحة (مثال بسيط: كل Reset = مستوى +1 لحد 5)
  level = Math.min(5, level+1);
  hud.level.textContent = level.toString();
  setDifficulty(level);
}

// أدوات صغيرة
function mapRange(v, inMin, inMax, outMin, outMax){
  const t = (v - inMin) / (inMax - inMin);
  return outMin + (outMax - outMin) * clamp(t,0,1);
}
function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
function lerp(a,b,t){ return a + (b-a)*t; }
function getYawFromQuat(q){
  // yaw من كواتيرنيون (تبسيط: تجاهل رول/بيتش)
  const ysqr = q.y * q.y;
  const t3 = 2.0 * (q.w * q.y + q.x * q.z);
  const t4 = 1.0 - 2.0 * (ysqr + q.z * q.z);
  return Math.atan2(t3, t4);
}
