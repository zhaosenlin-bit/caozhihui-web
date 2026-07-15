/* global React, ReactDOM, Motion */
const { useEffect, useState } = React;
const { motion } = Motion;
const TARGETS = [
    {
        id: "juno",
        title: "朱诺号与木星",
        category: "太阳系",
        src: "./models/juno.glb",
        alt: "Juno spacecraft 3D model",
        cameraOrbit: "45deg 75deg 4m",
        summary: "朱诺号围绕木星飞行，帮助我们理解这颗巨行星的大气、磁场、内部结构与极光活动。木星是太阳系中体积最大的行星，也是研究行星形成的重要样本。",
    },
    {
        id: "curiosity",
        title: "好奇号与火星",
        category: "太阳系",
        src: "./models/curiosity-static.glb",
        alt: "Curiosity Mars rover 3D model",
        cameraOrbit: "0deg 70deg 3m",
        summary: "好奇号火星车在火星盖尔撞击坑工作，持续寻找古代水环境与宜居线索。它让我们更清楚地看到火星的地质、气候历史，以及人类未来探测火星的可能性。",
    },
    {
        id: "mark-iii",
        title: "Mark III 太空服",
        category: "NASA",
        src: "./models/mark-iii.glb",
        alt: "NASA Mark III spacesuit 3D model",
        cameraOrbit: "0deg 75deg 2.2m",
        summary: "Mark III 是 NASA 开发的开放式太空服，用于地外任务评估与下一代探索准备。",
    }
];
const SOLAR_SYSTEM_FACTS = [
    { label: "8 颗行星", body: "水星、金星、地球、火星、木星、土星、天王星和海王星共同组成我们熟悉的行星家族。" },
    { label: "1 颗恒星", body: "太阳提供了光和热，也用引力把行星、卫星、小行星和彗星束缚在一起。" },
    { label: "漫长历史", body: "太阳系大约形成于 46 亿年前，来自一团旋转塌缩的气体和尘埃云。" },
];
function Navbar() {
    return (React.createElement("nav", { className: "relative z-10 flex items-center justify-between px-8 lg:px-16 py-7" },
        React.createElement("a", { href: "./index.html", className: "liquid-glass h-12 w-12 flex items-center justify-center text-white" },
            React.createElement("span", { className: "font-heading italic text-2xl leading-none" }, "a")),
        React.createElement("div", { className: "hidden md:flex items-center gap-2" },
            React.createElement("div", { className: "liquid-glass px-1.5 py-1.5 flex items-center gap-1" },
                React.createElement("a", { href: "./index.html", className: "px-3 py-2 text-sm font-medium text-white/90 font-body hover:text-white transition" }, "\u9996\u9875"),
                React.createElement("span", { className: "px-3 py-2 text-sm font-medium text-white font-body" }, "\u592A\u9633\u7CFB 3D"))),
        React.createElement("div", { className: "h-12 w-12", "aria-hidden": "true" })));
}
function TargetSwitcher({ activeId, onPick }) {
    return (React.createElement("div", { className: "liquid-glass rounded-full p-1.5 flex items-center gap-1" }, TARGETS.map((target) => (React.createElement("button", { key: target.id, type: "button", onClick: () => onPick(target.id), className: "px-4 py-2 text-sm font-medium font-body rounded-full transition " +
            (activeId === target.id ? "bg-white text-black" : "text-white/80 hover:text-white") }, target.title)))));
}
function Calibration({ onDone }) {
    const [hidden, setHidden] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => {
            setHidden(true);
            setTimeout(onDone, 700);
        }, 1300);
        return () => clearTimeout(timer);
    }, [onDone]);
    return (React.createElement("div", { className: "calibration-overlay" + (hidden ? " hidden" : ""), "aria-hidden": hidden },
        React.createElement("div", { className: "calibration-sphere" }),
        React.createElement("div", { className: "calibration-text" }, "\u6B63\u5728\u8FDB\u5165\u592A\u9633\u7CFB\u2026\u2026")));
}
function ExplorePage() {
    const [activeId, setActiveId] = useState(TARGETS[0].id);
    const [calibrating, setCalibrating] = useState(true);
    const target = TARGETS.find((item) => item.id === activeId);
    return (React.createElement(React.Fragment, null,
        calibrating && React.createElement(Calibration, { onDone: () => setCalibrating(false) }),
        React.createElement("main", { className: "relative min-h-screen w-screen overflow-hidden text-white" },
            React.createElement("div", { className: "absolute inset-0 bg-stars opacity-30 pointer-events-none", "aria-hidden": "true" }),
            React.createElement("div", { className: "absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none" }),
            React.createElement("div", { className: "relative z-10" },
                React.createElement(Navbar, null)),
            React.createElement("section", { className: "relative z-10 px-6 sm:px-10 lg:px-16 pt-8 pb-12" },
                React.createElement("div", { className: "max-w-7xl mx-auto" },
                    React.createElement("div", { className: "text-sm font-body text-white/70 mb-3" }, "// \u592A\u9633\u7CFB 3D"),
                    React.createElement("h1", { className: "font-heading italic text-white text-5xl md:text-7xl leading-[0.95] tracking-[-3px] mb-2" },
                        "\u8FDB\u5165\u592A\u9633\u7CFB",
                        React.createElement("br", null),
                        "\u8FD1\u8DDD\u79BB\u89C2\u5BDF"),
                    React.createElement("p", { className: "mt-3 max-w-2xl text-white/70 font-body text-sm sm:text-base leading-relaxed" }, "\u70B9\u51FB\u4E0D\u540C\u76EE\u6807\uFF0C\u67E5\u770B NASA \u771F\u5B9E\u7684 3D \u6A21\u578B\uFF0C\u5E76\u914D\u5408\u4E0B\u65B9\u7684\u7B80\u660E\u79D1\u666E\u4E0E\u89C6\u9891\uFF0C\u5FEB\u901F\u7406\u89E3\u592A\u9633\u7CFB\u7684\u7ED3\u6784\u548C\u63A2\u7D22\u4EFB\u52A1\u3002"),
                    React.createElement("div", { className: "mt-6 flex flex-wrap items-center gap-4" },
                        React.createElement(TargetSwitcher, { activeId: activeId, onPick: setActiveId }),
                        React.createElement("span", { className: "text-white/50 text-xs font-body uppercase tracking-widest" }, "\u6570\u636E\u6765\u6E90: NASA Science")))),
            React.createElement("section", { className: "relative z-10 px-6 sm:px-10 lg:px-16 pb-14" },
                React.createElement("div", { className: "max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6" },
                    React.createElement(motion.div, { key: target.id, initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, ease: "easeOut" }, className: "liquid-glass-strong rounded-[1.25rem] aspect-[4/3] w-full overflow-hidden" },
                        React.createElement("model-viewer", { src: target.src, alt: target.alt, "camera-controls": true, "auto-rotate": true, "rotation-per-second": "12deg", "camera-orbit": target.cameraOrbit, "shadow-intensity": "1", exposure: "1.2", "interaction-prompt": "auto" })),
                    React.createElement(motion.div, { key: target.id + "-info", initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, ease: "easeOut", delay: 0.1 }, className: "liquid-glass rounded-[1.25rem] p-8 flex flex-col" },
                        React.createElement("div", { className: "text-xs uppercase tracking-widest text-white/60 font-body mb-2" }, target.category),
                        React.createElement("h2", { className: "font-heading italic text-white text-4xl md:text-5xl tracking-[-1px] leading-none" }, target.title),
                        React.createElement("p", { className: "mt-6 text-white/85 font-body leading-relaxed" }, target.summary),
                        React.createElement("div", { className: "mt-8 grid gap-3" },
                            React.createElement("div", { className: "liquid-glass rounded-[1rem] px-4 py-3 text-sm text-white/90 font-body" }, "\u62D6\u52A8\u65CB\u8F6C\u6A21\u578B\uFF0C\u6EDA\u8F6E\u7F29\u653E\uFF0C\u89C2\u5BDF\u63A2\u6D4B\u5668\u6216\u706B\u661F\u8F66\u7684\u7ED3\u6784\u7EC6\u8282\u3002"),
                            React.createElement("div", { className: "liquid-glass rounded-[1rem] px-4 py-3 text-sm text-white/90 font-body" }, "\u8FD9\u4E9B\u4EFB\u52A1\u5E2E\u52A9\u6211\u4EEC\u7406\u89E3\u592A\u9633\u7CFB\u7684\u5F62\u6210\u3001\u884C\u661F\u6F14\u5316\uFF0C\u4EE5\u53CA\u4EBA\u7C7B\u672A\u6765\u6DF1\u7A7A\u63A2\u7D22\u7684\u65B9\u5411\u3002")),
                        React.createElement("div", { className: "flex-1" }),
                        React.createElement("div", { className: "mt-8 flex flex-wrap gap-2" },
                            React.createElement("span", { className: "liquid-glass rounded-full px-3 py-1 text-xs text-white/90 font-body" }, "3D \u6A21\u578B"),
                            React.createElement("span", { className: "liquid-glass rounded-full px-3 py-1 text-xs text-white/90 font-body" }, "\u592A\u9633\u7CFB\u4EFB\u52A1"),
                            React.createElement("span", { className: "liquid-glass rounded-full px-3 py-1 text-xs text-white/90 font-body" }, "NASA \u5B98\u65B9")),
                        React.createElement("div", { className: "mt-6 flex items-center gap-4" },
                            React.createElement("a", { href: "./index.html", className: "liquid-glass-strong rounded-full px-5 py-2.5 text-sm font-medium text-white inline-flex items-center gap-2" },
                                "\u8FD4\u56DE\u9996\u9875",
                                React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", className: "h-4 w-4", "aria-hidden": "true" },
                                    React.createElement("path", { d: "M19 12H5M12 19l-7-7 7-7" }))),
                            React.createElement("a", { href: "https://science.nasa.gov/solar-system/", target: "_blank", rel: "noreferrer", className: "text-white/80 font-body text-sm hover:text-white" }, "NASA \u592A\u9633\u7CFB\u539F\u6587"))))),
            React.createElement("section", { className: "relative z-10 px-6 sm:px-10 lg:px-16 pb-14" },
                React.createElement("div", { className: "max-w-7xl mx-auto" },
                    React.createElement("div", { className: "text-sm font-body text-white/70 mb-4" }, "// \u592A\u9633\u7CFB\u901F\u89C8"),
                    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-5" }, SOLAR_SYSTEM_FACTS.map((fact) => (React.createElement("div", { key: fact.label, className: "liquid-glass rounded-[1.25rem] p-6" },
                        React.createElement("div", { className: "font-heading italic text-white text-3xl tracking-[-1px]" }, fact.label),
                        React.createElement("p", { className: "mt-3 text-sm text-white/80 font-body leading-relaxed" }, fact.body))))))),
            React.createElement("section", { className: "relative z-10 px-6 sm:px-10 lg:px-16 pb-20" },
                React.createElement("div", { className: "max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6 items-stretch" },
                    React.createElement("div", { className: "liquid-glass rounded-[1.25rem] p-8 flex flex-col" },
                        React.createElement("div", { className: "text-sm font-body text-white/70 mb-3" }, "// \u79D1\u666E\u89C6\u9891"),
                        React.createElement("h2", { className: "font-heading italic text-white text-4xl md:text-5xl tracking-[-1px] leading-none" },
                            "\u7528\u89C6\u9891\u8BA4\u8BC6",
                            React.createElement("br", null),
                            "\u592A\u9633\u7CFB"),
                        React.createElement("p", { className: "mt-5 text-white/80 font-body leading-relaxed" }, "\u4E0B\u9762\u8FD9\u6BB5\u79D1\u666E\u89C6\u9891\u9002\u5408\u4F5C\u4E3A\u8FDB\u5165 3D \u6A21\u578B\u540E\u7684\u8865\u5145\u5185\u5BB9\u3002\u5148\u901A\u8FC7\u52A8\u753B\u5EFA\u7ACB\u6574\u4F53\u5370\u8C61\uFF0C\u518D\u56DE\u5230\u6A21\u578B\u53BB\u89C2\u5BDF\u4EFB\u52A1\u7EC6\u8282\uFF0C\u4F1A\u66F4\u5BB9\u6613\u7406\u89E3\u592A\u9633\u7CFB\u7684\u5C42\u7EA7\u548C\u63A2\u7D22\u610F\u4E49\u3002"),
                        React.createElement("div", { className: "mt-8 flex flex-wrap gap-2" },
                            React.createElement("span", { className: "liquid-glass rounded-full px-3 py-1 text-xs text-white/90 font-body" }, "\u592A\u9633\u7CFB\u7ED3\u6784"),
                            React.createElement("span", { className: "liquid-glass rounded-full px-3 py-1 text-xs text-white/90 font-body" }, "\u8F68\u9053\u5173\u7CFB"),
                            React.createElement("span", { className: "liquid-glass rounded-full px-3 py-1 text-xs text-white/90 font-body" }, "\u4EFB\u52A1\u80CC\u666F"))),
                    React.createElement("div", { className: "liquid-glass-strong rounded-[1.25rem] overflow-hidden aspect-video" },
                        React.createElement("video", { src: "./astro-loop.mp4", controls: true, autoPlay: true, muted: true, loop: true, playsInline: true, preload: "metadata", className: "w-full h-full object-cover bg-black" })))))));
}
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(ExplorePage, null));
