// 太阳系行星识别 3D 游戏
// 控制：WASD + 鼠标拖拽视角 + 滚轮缩放 + 飞到行星附近自动弹出 quiz
import * as THREE from "./vendor/three.module.js";

/* ---------- 行星数据 ---------- */
const PLANETS = [
    { id:"mercury", name:"水星", color:0x9c9690, radius:0.4, distance:14, fact:"离太阳最近，昼夜温差极大。" },
    { id:"venus",   name:"金星", color:0xe8c170, radius:0.9, distance:20, fact:"太阳系最热的行星，温室效应失控。" },
    { id:"earth",   name:"地球", color:0x3a7bd5, radius:1.0, distance:28, fact:"目前已知唯一存在生命的行星。" },
    { id:"mars",    name:"火星", color:0xc1502e, radius:0.7, distance:36, fact:"太阳系最高的山——奥林帕斯山在这里。" },
    { id:"jupiter", name:"木星", color:0xd6a878, radius:2.6, distance:50, fact:"太阳系最大行星，已知卫星最多（95+）。" },
    { id:"saturn",  name:"土星", color:0xe6d3a3, radius:2.2, distance:66, fact:"以壮观的环系闻名，主要由冰和岩石组成。" },
    { id:"uranus",  name:"天王星", color:0x9bd5e0, radius:1.6, distance:80, fact:"自转轴几乎躺在轨道面上，侧向自转。" },
    { id:"neptune", name:"海王星", color:0x3b62c4, radius:1.5, distance:92, fact:"太阳系风暴最强的行星，风速 2100 km/h。" },
];

// 每个行星有 3 个 quiz 题目，3 选 1，正确 +100，错 -30
const QUIZ = {
    mercury: [
        { q:"水星离太阳最近，它的表面温度特征是？", choices:["昼夜温差极大","常年均匀温暖","全是液态海洋","比地球更热"], a:0 },
        { q:"水星的一天（自转一周）大约多长？", choices:["24 小时","约 59 地球日","约 1 年","约 1 小时"], a:1 },
        { q:"水星大气的主要特征是？", choices:["浓密二氧化碳","几乎没有大气","充满甲烷","氧气主导"], a:1 },
    ],
    venus: [
        { q:"金星为什么是太阳系最热的行星？", choices:["离太阳最近","失控的温室效应","内部有岩浆","反射阳光最强"], a:1 },
        { q:"金星的自转方向有什么特别？", choices:["和地球一样","自东向西（逆向）","不自转","垂直自转"], a:1 },
        { q:"金星表面气压约为地球的多少倍？", choices:["约 1 倍","约 10 倍","约 92 倍","约 1000 倍"], a:2 },
    ],
    earth: [
        { q:"地球表面大约多少被水覆盖？", choices:["29%","51%","71%","95%"], a:2 },
        { q:"地球的天然卫星叫什么？", choices:["火卫一","月球","泰坦","欧罗巴"], a:1 },
        { q:"地球大气中比例最大的气体是？", choices:["氧气","二氧化碳","氮气","氢气"], a:2 },
    ],
    mars: [
        { q:"火星表面著名的红色来自什么？", choices:["氧化铁（铁锈）","真正的红色岩石","大气散射","植物"], a:0 },
        { q:"火星上最高的山是？", choices:["珠穆朗玛","奥林帕斯山","塔尔西斯","灶神星山"], a:1 },
        { q:"火星有两颗卫星，它们叫？", choices:["火卫一/二","木卫一/二","海卫一/二","泰坦/恩克拉多斯"], a:0 },
    ],
    jupiter: [
        { q:"木星的大红斑是？", choices:["火山","持续了数百年的巨型风暴","陨石坑","极光"], a:1 },
        { q:"木星主要是由什么组成？", choices:["岩石","金属","氢和氦","冰"], a:2 },
        { q:"木星已知卫星数量大致是？", choices:["1","12","约 95","0"], a:2 },
    ],
    saturn: [
        { q:"土星的环主要由什么构成？", choices:["气体","冰块与岩石碎屑","液态水","金属"], a:1 },
        { q:"土星最大卫星是哪颗？", choices:["月球","木卫一","泰坦","欧罗巴"], a:2 },
        { q:"土星密度比水如何？", choices:["比水重很多","和水差不多","比水略重","理论上能浮在水上"], a:3 },
    ],
    uranus: [
        { q:"天王星自转的最大特点是？", choices:["极快","逆向自转","自转轴几乎躺在轨道面上","不自转"], a:2 },
        { q:"天王星大气富含什么使它呈青蓝色？", choices:["水","甲烷","氧","硫"], a:1 },
        { q:"天王星是第几颗被发现的行星？", choices:["第 5 颗","第 6 颗","第 7 颗","第 8 颗"], a:2 },
    ],
    neptune: [
        { q:"海王星的风速可达多少？", choices:["200 km/h","500 km/h","1200 km/h","2100 km/h"], a:3 },
        { q:"海王星的颜色主要来自大气中的？", choices:["氧","甲烷","硫","氢"], a:1 },
        { q:"海王星是第几颗行星？", choices:["第 7 颗","第 8 颗","第 9 颗","第 6 颗"], a:1 },
    ],
};

/* ---------- Three.js 场景搭建 ---------- */
const canvas = document.getElementById("game-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

// 玩家飞船（位置）

// 飞船: 机身 + 两侧太阳能板 + 尾焰
const ship = new THREE.Group();
const bodyMat   = new THREE.MeshStandardMaterial({ color: 0xe8e8ee, metalness: 0.7, roughness: 0.35 });
const accentMat = new THREE.MeshStandardMaterial({ color: 0x2a6cff, metalness: 0.4, roughness: 0.5 });
const panelMat  = new THREE.MeshStandardMaterial({ color: 0x1b2740, metalness: 0.2, roughness: 0.6, emissive: 0x0a1a3a, emissiveIntensity: 0.4 });
const body = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.2, 16), bodyMat);
body.rotation.x = -Math.PI / 2;
body.position.z = -0.2;
ship.add(body);
const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), accentMat);
cockpit.position.set(0, 0.15, -0.6);
ship.add(cockpit);
for (const side of [-1, 1]) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.05, 0.8), panelMat);
    panel.position.set(side * 1.7, 0, 0);
    ship.add(panel);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.15), bodyMat);
    arm.position.set(side * 1.1, 0, 0);
    ship.add(arm);
}
const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 1.0, 12),
    new THREE.MeshBasicMaterial({ color: 0xff7a2a, transparent: true, opacity: 0.0 })
);
flame.rotation.x = Math.PI / 2;
flame.position.set(0, 0, 1.5);
ship.add(flame);
ship.position.set(0, 2, 40);
scene.add(ship);


// 全局光源
scene.add(new THREE.AmbientLight(0xffffff, 0.45));
const sun = new THREE.PointLight(0xffffff, 1.6, 0, 1.2);
sun.position.set(0, 0, 0);
scene.add(sun);
// 太阳本体（小亮球）
const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(3, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xffd27a })
);
scene.add(sunMesh);

// 星空背景
const stars = new THREE.BufferGeometry();
const starPos = [];
for (let i = 0; i < 3000; i++) {
    const r = 300 + Math.random() * 200;
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    starPos.push(r * Math.sin(p) * Math.cos(t), r * Math.cos(p), r * Math.sin(p) * Math.sin(t));
}
stars.setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3));
scene.add(new THREE.Points(stars, new THREE.PointsMaterial({ color: 0xffffff, size: 0.6, sizeAttenuation: true })));

/* ---------- 行星实例 ---------- */
const planetMeshes = {};
PLANETS.forEach((p) => {
    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(p.radius, 32, 32),
        new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.85, metalness: 0.05 })
    );
    mesh.position.set(p.distance, 0, 0);
    scene.add(mesh);
    planetMeshes[p.id] = mesh;

    // 土星加个环
    if (p.id === "saturn") {
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(p.radius * 1.4, p.radius * 2.2, 64),
            new THREE.MeshBasicMaterial({ color: 0xd9c89a, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
        );
        ring.rotation.x = -Math.PI / 2.2;
        mesh.add(ring);
    }
});

/* ---------- 输入控制 ---------- */
const keys = { w:false, a:false, s:false, d:false, q:false, e:false, shift:false };
window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (k in keys) keys[k] = true;
    if (k === "shift") keys.shift = true;
});
window.addEventListener("keyup", (e) => {
    const k = e.key.toLowerCase();
    if (k in keys) keys[k] = false;
    if (k === "shift") keys.shift = false;
});

// 鼠标拖拽旋转视角
let yaw = 0, pitch = -0.2;
let camDist = 8;
let dragging = false, lastX = 0, lastY = 0;
canvas.addEventListener("mousedown", (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
window.addEventListener("mouseup", () => { dragging = false; });
window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    yaw   -= (e.clientX - lastX) * 0.005;
    pitch -= (e.clientY - lastY) * 0.005;
    pitch = Math.max(-1.3, Math.min(1.3, pitch));
    lastX = e.clientX; lastY = e.clientY;
});
canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    camDist = Math.max(3, Math.min(20, camDist * (e.deltaY > 0 ? 1.1 : 0.9)));
}, { passive: false });

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---------- 游戏状态 ---------- */
const state = {
    score: 0,
    answered: {}, // planetId -> { used:[idx] }
    activeQuiz: null, // { planetId, qIdx }
    finished: false,
};

/* ---------- React HUD ---------- */
const { useState, useEffect, useRef } = React;
const { createRoot } = ReactDOM;

function Hud() {
    const [, force] = useState(0);
    const rerender = () => force((x) => x + 1);

    useEffect(() => {
        window.__rerender = rerender;
    }, []);

    const answeredCount = Object.keys(state.answered).filter((k) => state.answered[k].used.length >= 3).length;
    const total = PLANETS.length;

    return React.createElement(React.Fragment, null,
        // 左上：分数
        React.createElement("div", { className: "hud" , style:{ top: 16, left: 16 }},
            React.createElement("div", { className: "panel" },
                React.createElement("div", { className:"text-xs text-white/60" }, "得分"),
                React.createElement("div", { className:"text-3xl font-heading italic" }, String(state.score)),
                React.createElement("div", { className:"text-xs text-white/60 mt-2" }, `已答完 ${answeredCount} / ${total} 颗行星`))),

        // 左下：控制说明
        React.createElement("div", { className: "hud" , style:{ bottom: 16, left: 16 }},
            React.createElement("div", { className: "panel text-xs text-white/70 leading-relaxed" },
                React.createElement("div", null, "WASD 移动 · Q/E 升降"),
                React.createElement("div", null, "鼠标拖拽 视角 · 滚轮 缩放"),
                React.createElement("div", null, "Shift 加速 · 飞到行星附近弹出题目"))),

        // 右上：返回首页
        React.createElement("div", { className: "hud" , style:{ top: 16, right: 16 }},
            React.createElement("a", { href: "./index.html", className: "panel liquid-glass inline-block text-sm" }, "← 返回首页")),

        // 准星
        React.createElement("div", { className: "hud", style:{ top: "50%", left: "50%", transform: "translate(-50%,-50%)" }},
            React.createElement("div", { style:{ width: 14, height: 14, border: "1px solid rgba(255,255,255,0.5)", borderRadius: "50%" }})),

        // quiz 弹窗
        state.activeQuiz && React.createElement(QuizPanel, { key: state.activeQuiz.planetId + "-" + state.activeQuiz.qIdx, onClose: () => { state.activeQuiz = null; rerender(); } }),

        // 通关画面
        state.finished && React.createElement(FinishPanel, { onRestart: () => { state.score = 0; state.answered = {}; state.activeQuiz = null; state.finished = false; rerender(); } })
    );
}

function QuizPanel({ onClose }) {
    const { planetId, qIdx } = state.activeQuiz;
    const planet = PLANETS.find((p) => p.id === planetId);
    const q = QUIZ[planetId][qIdx];
    const [picked, setPicked] = useState(null);

    const pick = (i) => {
        if (picked !== null) return;
        setPicked(i);
        if (i === q.a) state.score += 100; else state.score -= 30;
        if (!state.answered[planetId]) state.answered[planetId] = { used: [] };
        state.answered[planetId].used.push(qIdx);
        window.__rerender && window.__rerender();

        setTimeout(() => {
            onClose();
            // 检查是否所有行星 3 题都答完
            const allDone = PLANETS.every((p) => (state.answered[p.id]?.used.length || 0) >= 3);
            if (allDone) state.finished = true;
            window.__rerender && window.__rerender();
        }, 1100);
    };

    return React.createElement("div", { className: "hud", style:{ left: "50%", bottom: 60, transform: "translateX(-50%)", width: "min(640px, 92vw)" }},
        React.createElement("div", { className: "panel" },
            React.createElement("div", { className:"text-xs text-white/60 mb-1" }, `${planet.name} · 第 ${qIdx + 1} / 3 题`),
            React.createElement("div", { className:"text-lg font-heading italic mb-4" }, q.q),
            React.createElement("div", { className:"grid grid-cols-1 sm:grid-cols-2 gap-2" },
                q.choices.map((c, i) => {
                    const isPicked = picked !== null;
                    const correct = isPicked && i === q.a;
                    const wrong = isPicked && i === picked && i !== q.a;
                    return React.createElement("button", {
                        key: i,
                        onClick: () => pick(i),
                        className: "choice-btn panel text-left text-sm py-3 px-4 rounded-2xl " +
                            (correct ? "ring-2 ring-emerald-400" : wrong ? "ring-2 ring-rose-400" : ""),
                    }, c);
                })
            ),
            React.createElement("div", { className:"text-xs text-white/60 mt-3" }, planet.fact)
        )
    );
}

function FinishPanel({ onRestart }) {
    return React.createElement("div", { className: "hud", style:{ inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)" }},
        React.createElement("div", { className: "panel text-center", style:{ maxWidth: 420 }},
            React.createElement("div", { className:"text-sm text-white/60" }, "已完成所有行星"),
            React.createElement("div", { className:"font-heading italic text-5xl mt-2 mb-4" }, String(state.score)),
            React.createElement("button", { onClick: onRestart, className: "choice-btn panel px-5 py-2 rounded-full" }, "再来一次"),
            React.createElement("a", { href: "./index.html", className: "block mt-3 text-white/70 text-sm" }, "返回首页")
        )
    );
}

createRoot(document.getElementById("hud-root")).render(React.createElement(Hud));

/* ---------- 飞船移动 + 碰撞触发 quiz ---------- */
// 进入判定：飞船距离行星表面 ≤ SURFACE_RANGE 才算"进入"
const SURFACE_RANGE = 2;

function update(dt) {
    if (!window.__introDone) return; // intro: gate ship movement until overlay is dismissed

    if (state.activeQuiz) return; // quiz 中暂停移动

    const speed = (keys.shift ? 14 : 6) * dt;
    // WASD 按当前视角方向移动
    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right   = new THREE.Vector3( Math.cos(yaw), 0, -Math.sin(yaw));
    ship.rotation.y = yaw;
    ship.rotation.x = pitch * 0.4;
    flame.material.opacity = (keys.w || keys.shift) ? 0.9 : 0.0;
    if (keys.w) ship.position.addScaledVector(forward, speed);
    if (keys.s) ship.position.addScaledVector(forward, -speed);
    if (keys.a) ship.position.addScaledVector(right,   -speed);
    if (keys.d) ship.position.addScaledVector(right,    speed);
    if (keys.q) ship.position.y -= speed;
    if (keys.e) ship.position.y += speed;

    // 相机：第三人称，斜后上方，看向飞船前方
    const back = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), -Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
    const camOffset = back.clone().multiplyScalar(camDist);
    camOffset.y += 2.6;
    const lookTarget = ship.position.clone().add(back.clone().multiplyScalar(-camDist * 0.4));
    camera.position.lerp(ship.position.clone().add(camOffset), 0.18);
    camera.lookAt(lookTarget);

    // 行星公转 + 自转
    const t = performance.now() * 0.0001;
    PLANETS.forEach((p, i) => {
        const m = planetMeshes[p.id];
        const angle = t * (0.4 + i * 0.05);
        m.position.set(Math.cos(angle) * p.distance, 0, Math.sin(angle) * p.distance);
        m.rotation.y += dt * 0.5;
    });

    // 检测最近的行星距离
    let nearest = null, nearestDist = Infinity;
    for (const p of PLANETS) {
        const d = ship.position.distanceTo(planetMeshes[p.id].position);
        if (d < nearestDist) { nearestDist = d; nearest = p; }
    }
    // 飞船中心点到行星中心：必须真"进入"行星表面附近 (surface..surface+2)，而不是远距离靠近
    if (nearest && nearestDist > nearest.radius && nearestDist < nearest.radius + SURFACE_RANGE) {
        const used = state.answered[nearest.id]?.used || [];
        if (used.length < 3) {
            const remaining = [0,1,2].filter((i) => !used.includes(i));
            const qIdx = remaining[Math.floor(Math.random() * remaining.length)];
            state.activeQuiz = { planetId: nearest.id, qIdx };
            window.__rerender && window.__rerender();
        }
    }
}

let last = performance.now();
function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
