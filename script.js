/* 3D Car Race – minimal-yet-polished demo with touch & keyboard controls */

const canvas = document.getElementById('game');
const startMenu = document.getElementById('menu');
const diffSelect = document.getElementById('difficulty');
const startBtn = document.getElementById('startBtn');

const overMenu = document.getElementById('gameover');
const finalScore = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');

const hudScore = document.getElementById('score');
const hudTime = document.getElementById('time');
const hudSpeed = document.getElementById('speed');

const touchUI = document.getElementById('touchControls');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const accelBtn = document.getElementById('accelBtn');
const brakeBtn = document.getElementById('brakeBtn');

let renderer, scene, camera;
let road, player;
let obstacles = [];
let lastSpawn = 0;
let spawnInterval = 1000;
let baseSpeed = 0.5; // forward world scroll speed
let lateralSpeed = 0.03;
let maxSpeed = 2.5;
let speed = 0.6;
let score = 0;
let startTime = 0;
let running = false;
let dead = false;
let worldZ = 0;

const keys = { left:false, right:false, up:false, down:false };
const touches = { left:false, right:false, up:false, down:false };

function init() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  resize();
  window.addEventListener('resize', resize);

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0a0d12, 20, 120);

  camera = new THREE.PerspectiveCamera(60, canvas.clientWidth/canvas.clientHeight, 0.1, 300);
  camera.position.set(0, 5, 10);
  camera.rotation.x = -0.25;

  // Lights
  const amb = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(amb);
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(5,10,7);
  scene.add(dir);

  // Road (long plane with lane lines as repeating texture via shader-like stripes)
  const roadGeo = new THREE.PlaneGeometry(8, 400, 1, 1);
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x111419, roughness: 0.9, metalness: 0.0 });
  road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI/2;
  road.position.z = -180;
  scene.add(road);

  // Lane lines (thin boxes repeated)
  for (let i=0;i<80;i++){
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.02, 1.1),
      new THREE.MeshStandardMaterial({ color: 0xe5e7eb, emissive: 0x20262f, emissiveIntensity: 0.4 })
    );
    const laneX = [-2.0, 0, 2.0];
    line.position.set(laneX[i%3], 0.011, -i*5);
    scene.add(line);
  }

  // Guard rails
  const railMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness:0.2, roughness:0.6 });
  const railGeo = new THREE.BoxGeometry(0.2, 0.6, 400);
  const leftRail = new THREE.Mesh(railGeo, railMat);
  leftRail.position.set(-4.2, 0.3, -180);
  scene.add(leftRail);
  const rightRail = new THREE.Mesh(railGeo, railMat);
  rightRail.position.set(4.2, 0.3, -180);
  scene.add(rightRail);

  // Player car (stylized low-poly)
  player = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.4, 1.8),
    new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness:0.1, roughness:0.5 })
  );
  body.position.y = 0.35;
  player.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.3, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness:0.2, roughness:0.4 })
  );
  cabin.position.set(0,0.6, -0.2);
  player.add(cabin);

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.20,0.20,0.12,16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness:0.0, roughness:0.9 });
  const wheelPos = [
    [-0.42,0.2, 0.65], [0.42,0.2, 0.65],
    [-0.42,0.2,-0.65], [0.42,0.2,-0.65]
  ];
  wheelPos.forEach(p=>{
    const w = new THREE.Mesh(wheelGeo,wheelMat);
    w.rotation.z = Math.PI/2;
    w.position.set(p[0],p[1],p[2]);
    player.add(w);
  });

  player.position.set(0,0,3);
  scene.add(player);

  // Input
  window.addEventListener('keydown', (e)=>setKey(e.code,true));
  window.addEventListener('keyup',   (e)=>setKey(e.code,false));

  // Touch controls visible on small screens
  if (window.innerWidth < 900) {
    touchUI.classList.remove('hidden');
    setupTouch(leftBtn,  'left');
    setupTouch(rightBtn, 'right');
    setupTouch(accelBtn, 'up');
    setupTouch(brakeBtn, 'down');
  }
}

function setKey(code, v){
  if (code === 'ArrowLeft' || code === 'KeyA') keys.left = v;
  if (code === 'ArrowRight'|| code === 'KeyD') keys.right = v;
  if (code === 'ArrowUp'   || code === 'KeyW') keys.up = v;
  if (code === 'ArrowDown' || code === 'KeyS') keys.down = v;
}
function setupTouch(el, dir){
  const down = ()=> touches[dir] = true;
  const up   = ()=> touches[dir] = false;
  ['touchstart','mousedown'].forEach(ev=>el.addEventListener(ev, e=>{e.preventDefault();down();}));
  ['touchend','touchcancel','mouseup','mouseleave'].forEach(ev=>el.addEventListener(ev, e=>{e.preventDefault();up();}));
}

function applyDifficulty(d){
  if (d==='easy'){ spawnInterval=1200; baseSpeed=0.5; maxSpeed=2.2; lateralSpeed=0.028; }
  if (d==='normal'){ spawnInterval=900; baseSpeed=0.65; maxSpeed=2.7; lateralSpeed=0.032; }
  if (d==='hard'){ spawnInterval=700; baseSpeed=0.8; maxSpeed=3.2; lateralSpeed=0.036; }
  speed = baseSpeed + 0.05;
}

function spawnObstacle(){
  const car = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.9,0.4,1.7),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness:0.05, roughness:0.6 })
  );
  body.position.y = 0.3; car.add(body);
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(0.7,0.25,0.7),
    new THREE.MeshStandardMaterial({ color: 0x111827 })
  );
  roof.position.set(0,0.55,-0.15); car.add(roof);

  const laneX = [-2.0,0,2.0];
  car.position.set(laneX[Math.floor(Math.random()*3)], 0, -60);
  car.userData = {
    speed: baseSpeed + Math.random()*0.7 + 0.4
  };
  scene.add(car);
  obstacles.push(car);
}

function resetGame() {
  // remove obstacles
  obstacles.forEach(o=>scene.remove(o));
  obstacles = [];
  score = 0; worldZ = 0;
  startTime = performance.now();
  running = true; dead = false;
  overMenu.classList.add('hidden');
}

function gameOver(){
  running = false; dead = true;
  finalScore.textContent = `Score: ${Math.floor(score)}`;
  overMenu.classList.remove('hidden');
}

function update(dt){
  if (!running) return;

  const steerLeft  = keys.left  || touches.left;
  const steerRight = keys.right || touches.right;
  const accel      = keys.up    || touches.up;
  const brake      = keys.down  || touches.down;

  // Speed control
  if (accel) speed = Math.min(maxSpeed, speed + 0.02);
  else speed = Math.max(baseSpeed, speed - 0.015);
  if (brake) speed = Math.max(0.3, speed - 0.04);

  // Move player laterally within road bounds
  const dx = (steerRight - steerLeft) * lateralSpeed * (1.0 + speed*0.3) * dt;
  player.position.x = THREE.MathUtils.clamp(player.position.x + dx, -2.8, 2.8);

  // World scroll (move everything towards camera)
  worldZ += speed * 0.06 * dt;
  road.position.z = -180 + (worldZ % 5);

  // Spawn obstacles
  if (performance.now() - lastSpawn > spawnInterval){
    spawnObstacle();
    lastSpawn = performance.now();
  }

  // Move obstacles and check collisions
  for (let i=obstacles.length-1;i>=0;i--){
    const o = obstacles[i];
    o.position.z += speed * 0.06 * dt + o.userData.speed * 0.02 * dt;
    // remove passed ones
    if (o.position.z > 15){
      scene.remove(o);
      obstacles.splice(i,1);
      score += 10;
      continue;
    }
    // AABB-ish collision
    const dz = Math.abs(o.position.z - player.position.z);
    const dx2 = Math.abs(o.position.x - player.position.x);
    if (dz < 1.3 && dx2 < 0.8){
      gameOver();
      break;
    }
  }

  // Camera follow slight tilt
  camera.position.x = THREE.MathUtils.lerp(camera.position.x, player.position.x*0.3, 0.08);
  camera.lookAt(new THREE.Vector3(0,0,-6));

  // HUD
  hudScore.textContent = `Score: ${Math.floor(score)}`;
  hudSpeed.textContent = `Speed: ${speed.toFixed(2)}`;
  const t = (performance.now() - startTime)/1000;
  hudTime.textContent = `Time: ${t.toFixed(1)}s`;
}

let prev = 0;
function loop(ts){
  const dt = Math.min(50, ts - prev); // cap delta
  prev = ts;
  update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function resize(){
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w,h,false);
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  if (camera){
    camera.aspect = w/h;
    camera.updateProjectionMatrix();
  }
}

// Buttons
startBtn.addEventListener('click', ()=>{
  startMenu.classList.add('hidden');
  applyDifficulty(diffSelect.value);
  resetGame();
});
restartBtn.addEventListener('click', ()=>{
  applyDifficulty(diffSelect.value);
  resetGame();
});

// Init
init();
requestAnimationFrame(loop);
