import{a as e,i as t,n,o as r,r as i,t as a}from"./index-Khd-LpU_.js";var o=`
attribute vec3 a_target; attribute vec3 a_start; attribute vec2 a_meta; // meta: kind, seed
uniform vec2 u_res; uniform vec2 u_mouse; uniform float u_time; uniform float u_progress;
uniform float u_yaw; uniform float u_pitch; uniform float u_k; uniform float u_dpr;
varying float v_kind; varying float v_alpha;
float easeOutExpo(float t){ return t >= 1.0 ? 1.0 : 1.0 - pow(2.0, -10.0 * t); }
void main(){
  float kind = a_meta.x, seed = a_meta.y;
  float delay = (1.0 - (a_target.x + 500.0) / 1000.0) * 0.45 + seed * 0.15;
  float t = easeOutExpo(clamp((u_progress - delay) / 0.9, 0.0, 1.0));
  vec3 p = mix(a_start, a_target, t);
  p.y += sin(u_time * 1.3 + seed * 40.0) * 0.9 * t;
  float cy = cos(u_yaw), sy = sin(u_yaw), cp = cos(u_pitch), sp = sin(u_pitch);
  p = vec3(cy * p.x + sy * p.z, p.y, -sy * p.x + cy * p.z);
  p = vec3(p.x, cp * p.y - sp * p.z, sp * p.y + cp * p.z);
  float depth = 1500.0 - p.z;
  float s = 1500.0 / depth;
  vec2 px = u_res * 0.5 + vec2(p.x, -p.y) * s * u_k;
  vec2 d = px - u_mouse;
  float dl = length(d);
  float R = 110.0 * u_dpr;
  if (u_mouse.x > -9000.0 && dl < R) px += d / max(dl, 0.001) * (R - dl) * 0.55;
  vec2 clip = px / u_res * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  float base = kind < 0.5 ? 2.3 : kind < 1.5 ? 1.6 : kind < 2.5 ? 2.6 : 1.4;
  gl_PointSize = base * s * u_dpr;
  float flicker = 0.85 + 0.15 * sin(u_time * 2.0 + seed * 60.0);
  v_alpha = (kind < 0.5 ? 0.95 : kind < 1.5 ? 0.38 : kind < 2.5 ? 1.0 : 0.22) * flicker * (0.35 + 0.65 * t);
  v_kind = kind;
}`,s=`
precision mediump float;
varying float v_kind; varying float v_alpha;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float a = smoothstep(0.5, 0.15, length(c)) * v_alpha;
  vec3 light = vec3(0.925, 0.925, 0.937);
  vec3 accent = vec3(1.0, 0.416, 0.0);
  vec3 col = v_kind > 1.5 && v_kind < 2.5 ? accent : light;
  gl_FragColor = vec4(col * a, a);
}`;function c(o){let s=1e3,c=document.createElement(`canvas`);c.width=s,c.height=300;let l=c.getContext(`2d`,{willReadFrequently:!0}),u=new Path2D(a),d=(e,t)=>{l.clearRect(0,0,s,300),l.lineWidth=t,l.strokeStyle=`#fff`;for(let t of e)l.stroke(t);let n=l.getImageData(0,0,s,300).data,r=[];for(let e=0;e<300;e+=1)for(let t=0;t<s;t+=1)n[(e*s+t)*4+3]>120&&r.push([t,e]);return r},f=e.flatMap(({cx:e,cy:t,r:n})=>{let r=new Path2D,i=new Path2D;return r.arc(e,t,n,0,Math.PI*2),i.arc(e,t,n*.68,0,Math.PI*2),[r,i]}),p=d([u,new Path2D(r),...i.slice(0,2).map(e=>new Path2D(e)),...i.slice(4).map(e=>new Path2D(e))],1.6),m=d([...f,...t.map(e=>new Path2D(e)),new Path2D(n),new Path2D(i[2]),new Path2D(i[3])],1.6),h=e=>190*(e<150?.62+.38*Math.max(0,(e-60)/90):1),g=(e,t)=>Array.from({length:t},()=>e[Math.random()*e.length|0]),_=[],v=(e,t,n,r)=>_.push(e-500,-(t-175),n,r),y=Math.round(o*.42),b=Math.round(o*.22),x=Math.round(o*.2),S=o-y-b-x;for(let[e,t]of g(p,y)){let n=Math.random()<.62;v(e,t,(n?1:-1)*h(t),+!n)}for(let[e,t]of g(m,b)){let n=Math.random()<.66;v(e,t,(n?1:-1)*(h(t)-18),n?2:1)}l.clearRect(0,0,s,300);let C=p.filter(([e,t])=>t<200&&!l.isPointInPath(u,e,t-5)&&l.isPointInPath(u,e,t+5));for(let[e,t]of g(C,x))v(e,t,(Math.random()*2-1)*h(t),3);for(let e=0;e<S;e++)v(-40+Math.random()*1080,292,(Math.random()*2-1)*260,3);return _}function l(e,{count:t=6e3,interactive:n=!0,onReady:r,onLost:i}={}){let a=e.getContext(`webgl`,{alpha:!0,antialias:!1,depth:!1,stencil:!1,premultipliedAlpha:!0,powerPreference:`low-power`});if(!a)return i?.(),()=>{};let l=(e,t)=>{let n=a.createShader(e);if(a.shaderSource(n,t),a.compileShader(n),!a.getShaderParameter(n,a.COMPILE_STATUS))throw Error(a.getShaderInfoLog(n)||`shader`);return n},u;try{if(u=a.createProgram(),a.attachShader(u,l(a.VERTEX_SHADER,o)),a.attachShader(u,l(a.FRAGMENT_SHADER,s)),a.linkProgram(u),!a.getProgramParameter(u,a.LINK_STATUS))throw Error(`link`)}catch{return i?.(),()=>{}}a.useProgram(u),a.enable(a.BLEND),a.blendFunc(a.ONE,a.ONE);let d=c(t),f=d.length/4,p=new Float32Array(f*3),m=new Float32Array(f*3),h=new Float32Array(f*2);for(let e=0;e<f;e++){let[t,n,r,i]=d.slice(e*4,e*4+4);p.set([t,n,r],e*3),m.set([t+900+Math.random()*900,n+(Math.random()-.5)*160,r*.3],e*3),h.set([i,Math.random()],e*2)}let g=(e,t,n)=>{let r=a.createBuffer();a.bindBuffer(a.ARRAY_BUFFER,r),a.bufferData(a.ARRAY_BUFFER,t,a.STATIC_DRAW);let i=a.getAttribLocation(u,e);a.enableVertexAttribArray(i),a.vertexAttribPointer(i,n,a.FLOAT,!1,0,0)};g(`a_target`,p,3),g(`a_start`,m,3),g(`a_meta`,h,2);let _=e=>a.getUniformLocation(u,e),v={res:_(`u_res`),mouse:_(`u_mouse`),time:_(`u_time`),progress:_(`u_progress`),yaw:_(`u_yaw`),pitch:_(`u_pitch`),k:_(`u_k`),dpr:_(`u_dpr`)},y=Math.min(window.devicePixelRatio||1,1.75),b=0,x=0,S=()=>{b=e.clientWidth,x=e.clientHeight;let t=Math.max(1,Math.round(b*y)),n=Math.max(1,Math.round(x*y));(e.width!==t||e.height!==n)&&(e.width=t,e.height=n,a.viewport(0,0,t,n))},C={x:-1e4,y:-1e4,nx:0,ny:0},w=-.34,T={yaw:w,pitch:.16},E=t=>{let n=e.getBoundingClientRect();C.x=(t.clientX-n.left)*y,C.y=(t.clientY-n.top)*y,C.nx=t.clientX/window.innerWidth*2-1,C.ny=t.clientY/window.innerHeight*2-1},D=()=>{C.x=C.y=-1e4};n&&(window.addEventListener(`pointermove`,E,{passive:!0}),document.documentElement.addEventListener(`pointerleave`,D));let O=0,k=!1,A=!1,j=!1,M=!1,N=performance.now(),P=()=>{O=requestAnimationFrame(P),S();let t=(performance.now()-N)/1e3,n=Math.min(1,window.scrollY/Math.max(1,x)),i=w+C.nx*.32+n*.55+Math.sin(t*.35)*.06,o=.16+C.ny*.08+n*.1;T.yaw+=(i-T.yaw)*.06,T.pitch+=(o-T.pitch)*.06,a.clearColor(0,0,0,0),a.clear(a.COLOR_BUFFER_BIT),a.uniform2f(v.res,e.width,e.height),a.uniform2f(v.mouse,C.x,C.y),a.uniform1f(v.time,t),a.uniform1f(v.progress,Math.min(t/1.9,1.6)),a.uniform1f(v.yaw,T.yaw),a.uniform1f(v.pitch,T.pitch),a.uniform1f(v.k,Math.min(b,x*2.4)/1280*y),a.uniform1f(v.dpr,y),a.drawArrays(a.POINTS,0,f),j||(j=!0,r?.())},F=()=>{let e=A&&!document.hidden&&!M;e&&!k?(k=!0,O=requestAnimationFrame(P)):!e&&k&&(k=!1,cancelAnimationFrame(O))},I=new IntersectionObserver(([e])=>{A=!!e?.isIntersecting,F()});I.observe(e),document.addEventListener(`visibilitychange`,F);let L=e=>{e.preventDefault(),M=!0,F(),i?.()};return e.addEventListener(`webglcontextlost`,L),()=>{I.disconnect(),document.removeEventListener(`visibilitychange`,F),e.removeEventListener(`webglcontextlost`,L),window.removeEventListener(`pointermove`,E),document.documentElement.removeEventListener(`pointerleave`,D),cancelAnimationFrame(O),a.getExtension(`WEBGL_lose_context`)?.loseContext()}}export{l as startCar};