import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const noise = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const vertex = /* glsl */ `
uniform float uTime; uniform float uAmp; uniform vec2 uMouse;
varying vec3 vNormal; varying vec3 vView; varying float vNoise;
${noise}
float disp(vec3 p){
  float n = snoise(p*1.1 + vec3(uTime*.25, uTime*.18, 0.));
  n += .45*snoise(p*2.6 - uTime*.3 + vec3(uMouse*1.5, 0.));
  return n;
}
void main(){
  vec3 p = position;
  float n = disp(normalize(p));
  vec3 np = p + normal * n * uAmp;
  vec3 t = normalize(cross(normal, vec3(0.,1.,.001)));
  vec3 b = normalize(cross(normal, t));
  float e = .015;
  vec3 pt = p + t*e; pt += normalize(pt)*disp(normalize(pt))*uAmp;
  vec3 pb = p + b*e; pb += normalize(pb)*disp(normalize(pb))*uAmp;
  vec3 nn = normalize(cross(pt-np, pb-np));
  if(dot(nn, normal) < 0.) nn = -nn;
  vNoise = n;
  vec4 mv = modelViewMatrix * vec4(np,1.);
  vNormal = normalize(normalMatrix * nn);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

const fragment = /* glsl */ `
uniform float uTime; uniform vec3 uA; uniform vec3 uB; uniform vec3 uC;
varying vec3 vNormal; varying vec3 vView; varying float vNoise;
void main(){
  float fres = pow(1. - max(dot(vNormal, vView), 0.), 2.2);
  vec3 iri = .5 + .5*cos(6.2831*(vec3(.0,.33,.67) + fres*1.2 + vNoise*.35 + uTime*.05));
  vec3 base = mix(uB, uA, smoothstep(-.6, .9, vNoise));
  vec3 col = mix(base, iri*uC, fres*.85);
  float spec = pow(max(dot(reflect(-normalize(vec3(.4,.8,.6)), vNormal), vView), 0.), 24.);
  col += spec * .6;
  col += fres * .35 * uA;
  gl_FragColor = vec4(col, 1.);
}`;

// Onde o blob fica em cada seção: x, y, escala, deformação, abertura das órbitas e visibilidade (vis 0 = some).
// Regra: ele só aparece onde não cobre texto — atrás da foto, atrás dos cards, no miolo da esfera, atrás do rodapé.
export const KEYFRAMES = {
  desktop: {
    hero:     { x: 1.45, y: -0.1, s: 0.92, amp: 0.3,  spread: 1,   vis: 1 },
    sobre:    { x: -2.1, y: 0.2,  s: 0.5,  amp: 0.4,  spread: 0.25, vis: 1 },
    projetos: { x: 0,    y: 0,    s: 1.9,  amp: 0.55, spread: 2.2, vis: 1 },
    atividade:{ x: 0,    y: -2.6, s: 0.6,  amp: 0.4,  spread: 1,   vis: 0 },
    stack:    { x: 1.45, y: 0,    s: 0.5,  amp: 0.35, spread: 0.6, vis: 1 },
    valores:  { x: 3.5,  y: 0,    s: 0.4,  amp: 0.4,  spread: 0.8, vis: 0 },
    contato:  { x: 0,    y: -2.6, s: 0.6,  amp: 0.3,  spread: 1,   vis: 0 },
    rodape:   { x: 0,    y: -0.45, s: 0.6,  amp: 0.35, spread: 1.6, vis: 1 },
  },
  mobile: {
    hero:     { x: 0,    y: 0.6,  s: 0.48, amp: 0.3,  spread: 0.7, vis: 1 },
    sobre:    { x: 0,    y: 1.8,  s: 0.3,  amp: 0.4,  spread: 0.5, vis: 0 },
    projetos: { x: 0,    y: 0,    s: 1.1,  amp: 0.55, spread: 1.3, vis: 1 },
    atividade:{ x: 0,    y: -2.6, s: 0.4,  amp: 0.4,  spread: 0.8, vis: 0 },
    stack:    { x: 0,    y: -2.6, s: 0.3,  amp: 0.35, spread: 0.5, vis: 0 },
    valores:  { x: 0,    y: -2.6, s: 0.3,  amp: 0.4,  spread: 0.6, vis: 0 },
    contato:  { x: 0,    y: -2.6, s: 0.4,  amp: 0.3,  spread: 0.7, vis: 0 },
    rodape:   { x: 0,    y: -1.4, s: 0.45, amp: 0.35, spread: 0.9, vis: 1 },
  },
};

export function initScene(canvas, mobile) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
  let dpr = Math.min(window.devicePixelRatio, mobile ? 1.25 : 1.5);
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.z = 6;

  const uniforms = {
    uTime: { value: 0 },
    uAmp: { value: 0.3 },
    uMouse: { value: new THREE.Vector2() },
    uA: { value: new THREE.Color('#c77dff') },
    uB: { value: new THREE.Color('#1a0b2e') },
    uC: { value: new THREE.Color('#d6ff3d') },
  };

  // grupo que viaja pela página: blob + objetos em órbita
  const rig = new THREE.Group();
  scene.add(rig);

  const blob = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.35, mobile ? 18 : 36), // ~78k vértices no desktop: suave o bastante p/ o ruído
    new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms })
  );
  rig.add(blob);

  const glass = (color) =>
    new THREE.MeshPhysicalMaterial({
      color, metalness: 0.35, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05,
      iridescence: 1, iridescenceIOR: 1.4, envMapIntensity: 1.4,
    });

  const shapes = [
    { geo: new THREE.TorusGeometry(0.32, 0.12, 20, 48), mat: glass('#d6ff3d'), r: 2.1, speed: 0.35, tilt: 0.4, phase: 0 },
    { geo: new THREE.IcosahedronGeometry(0.3, 0), mat: glass('#c77dff'), r: 2.5, speed: -0.25, tilt: -0.6, phase: 1.6 },
    { geo: new THREE.TorusKnotGeometry(0.22, 0.07, 80, 12), mat: glass('#ffffff'), r: 2.3, speed: 0.2, tilt: 1.1, phase: 3.2 },
    { geo: new THREE.OctahedronGeometry(0.26, 0), mat: glass('#ff7ad9'), r: 2.8, speed: -0.3, tilt: 0.9, phase: 4.4 },
    { geo: new THREE.CapsuleGeometry(0.12, 0.35, 8, 24), mat: glass('#3dc3ff'), r: 1.9, speed: 0.45, tilt: -1.2, phase: 5.5 },
    { geo: new THREE.SphereGeometry(0.16, 24, 16), mat: glass('#d6ff3d'), r: 2.6, speed: 0.15, tilt: 0.2, phase: 2.4 },
  ].map((o) => {
    const mesh = new THREE.Mesh(o.geo, o.mat);
    rig.add(mesh);
    return { ...o, mesh, spin: new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(0.8) };
  });

  const light = new THREE.PointLight('#d6ff3d', 6, 10);
  light.position.set(2, 2, 3);
  scene.add(light, new THREE.AmbientLight('#7b2cbf', 0.6));

  // campo de estrelas que atravessa a página
  const count = mobile ? 500 : 1100;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos.set([(Math.random() - 0.5) * 16, (Math.random() - 0.5) * 30, -Math.random() * 8 + 1], i * 3);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({ color: '#e8d9ff', size: 0.02, transparent: true, opacity: 0.65, depthWrite: false })
  );
  scene.add(dust);

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  const keyframes = KEYFRAMES[mobile ? 'mobile' : 'desktop'];
  // `target` é animado pelo ScrollTrigger; `cur` persegue com suavização
  const target = { ...keyframes.hero };
  const cur = { ...keyframes.hero };
  const state = { target, frames: keyframes, scroll: 0, kick: 0 };

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  const clock = new THREE.Clock();
  const tmp = new THREE.Vector3();
  // Qualidade adaptativa: se a média de quadros ficar lenta, baixa a resolução do canvas.
  let acc = 0, frames = 0;
  function adapt(dt) {
    acc += dt; frames++;
    if (frames < 90) return;
    const avg = acc / frames;
    acc = 0; frames = 0;
    if (avg > 1 / 45 && dpr > 0.75) {
      dpr = Math.max(0.75, dpr - 0.25);
      renderer.setPixelRatio(dpr);
      resize();
    }
  }

  let prev = 0;
  function tick() {
    requestAnimationFrame(tick);
    if (document.hidden) return;
    const t = clock.getElapsedTime();
    adapt(Math.min(t - prev, 0.25));
    prev = t;
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    for (const k in cur) cur[k] += (target[k] - cur[k]) * 0.06;
    state.kick *= 0.94;

    uniforms.uTime.value = t;
    uniforms.uMouse.value.set(mouse.x, mouse.y);
    uniforms.uAmp.value = cur.amp + state.kick;

    const vis = Math.max(cur.vis, 0);
    rig.visible = vis > 0.01;
    rig.position.set(cur.x + mouse.x * 0.15, cur.y + mouse.y * 0.15, 0);
    blob.scale.setScalar(Math.max(cur.s * vis, 0.0001));
    blob.rotation.y = t * 0.12 + mouse.x * 0.5;
    blob.rotation.x = mouse.y * 0.35;

    // órbitas inclinadas em 3D, abrindo/fechando com `spread`
    rig.rotation.x = mouse.y * 0.25;
    rig.rotation.y = mouse.x * 0.35;
    for (const o of shapes) {
      const a = t * o.speed + o.phase + state.scroll * 4;
      const r = o.r * cur.spread * Math.max(cur.s, 0.45);
      tmp.set(Math.cos(a) * r, Math.sin(a) * r * Math.sin(o.tilt) * 0.6, Math.sin(a) * r * Math.cos(o.tilt));
      o.mesh.position.copy(tmp);
      o.mesh.rotation.x += 0.01 * o.spin.x;
      o.mesh.rotation.y += 0.01 * o.spin.y;
      o.mesh.scale.setScalar(Math.max(Math.max(cur.s, 0.55) * (1 + state.kick) * vis, 0.0001));
    }

    light.position.set(mouse.x * 4, mouse.y * 3, 3);
    dust.position.y = state.scroll * 14;
    dust.rotation.y = mouse.x * 0.08;
    renderer.render(scene, camera);
  }
  tick();

  return state;
}
