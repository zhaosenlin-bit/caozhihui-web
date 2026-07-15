"use strict";
(() => {
  // shim/react-jsx-runtime.js
  function jsx(type, props, key) {
    var p = Object.assign({}, props || {});
    if (key !== void 0) p.key = key;
    return React.createElement(type, p);
  }
  var jsxs = jsx;

  // space-travel/public/app.jsx
  var _origError = console.error;
  console.error = function(...args) {
    var _a;
    const msg = String((_a = args[0]) != null ? _a : "");
    if (msg.includes("Each child in a list") || msg.includes('unique "key" prop')) return;
    _origError.apply(console, args);
  };
  var { useEffect, useRef, useState } = React;
  var { motion, AnimatePresence } = Motion;
  function LightfallCanvas() {
    const ref = useRef(null);
    const apiRef = useRef(null);
    useEffect(() => {
      if (!ref.current || !window.Lightfall || typeof window.Lightfall.mount !== "function") return;
      apiRef.current = window.Lightfall.mount(ref.current, {
        colors: ["#A6C8FF", "#5227FF", "#FF9FFC"],
        backgroundColor: "#0A29FF",
        speed: 1,
        streakCount: 8,
        streakWidth: 1,
        streakLength: 1,
        glow: 1,
        density: 1,
        twinkle: 1,
        zoom: 2,
        backgroundGlow: 1,
        opacity: 1,
        mouseInteraction: true,
        mouseStrength: 1,
        mouseRadius: 0.6
      });
      return () => {
        if (apiRef.current) apiRef.current.unmount();
      };
    }, []);
    return /* @__PURE__ */ jsx(
      "div",
      {
        ref,
        "aria-hidden": "true",
        className: "z-0",
        style: { position: "absolute", inset: 0, width: "100%", height: "100%" }
      }
    );
  }
  function BlurText({ text, className = "" }) {
    const ref = useRef(null);
    const [shown, setShown] = useState(false);
    const words = text.match(/[\u4e00-\u9fff]|[^ ]+/g) || [];
    useEffect(() => {
      const el = ref.current;
      if (!el || shown) return;
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting && e.intersectionRatio >= 0.1) {
              setShown(true);
              io.disconnect();
              break;
            }
          }
        },
        { threshold: [0, 0.1, 0.5] }
      );
      io.observe(el);
      return () => io.disconnect();
    }, [shown]);
    return /* @__PURE__ */ jsx(
      "p",
      {
        ref,
        className,
        style: { display: "flex", flexWrap: "wrap", justifyContent: "center", rowGap: "0.1em", letterSpacing: "-4px" },
        children: words.map((w, i) => /* @__PURE__ */ jsx(
          motion.span,
          {
            initial: { filter: "blur(10px)", opacity: 0, y: 50 },
            animate: shown ? { filter: ["blur(5px)", "blur(0px)"], opacity: [0.5, 1], y: [-5, 0] } : { filter: "blur(10px)", opacity: 0, y: 50 },
            transition: {
              duration: 0.7,
              times: [0, 1],
              delay: i * 100 / 1e3,
              ease: "easeOut"
            },
            style: { display: "inline-block", marginRight: "0.28em" },
            children: w
          },
          i
        ))
      }
    );
  }
  function ArrowUpRight({ className = "h-5 w-5" }) {
    return /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className, "aria-hidden": "true", children: [
      /* @__PURE__ */ jsx("path", { d: "M7 17L17 7" }),
      /* @__PURE__ */ jsx("path", { d: "M7 7h10v10" })
    ] });
  }
  function Play({ className = "h-4 w-4" }) {
    return /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "currentColor", className, "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M6 4 L20 12 L6 20 Z" }) });
  }
  function ClockIcon() {
    return /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: "1.6", className: "h-7 w-7", "aria-hidden": "true", children: [
      /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "9" }),
      /* @__PURE__ */ jsx("path", { d: "M12 7v5l3 2" })
    ] });
  }
  function GlobeIcon() {
    return /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: "1.6", className: "h-7 w-7", "aria-hidden": "true", children: [
      /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "9" }),
      /* @__PURE__ */ jsx("path", { d: "M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" })
    ] });
  }
  function Navbar() {
    const links = ["\u9996\u9875", "\u592A\u9633\u7CFB", "\u5B87\u5B99", "\u661F\u7CFB", "\u4EFB\u52A1", "3D \u63A2\u7D22", "\u5B87\u5B99\u8FF7\u5BAB"];
    return /* @__PURE__ */ jsxs(
      motion.nav,
      {
        initial: { filter: "blur(10px)", opacity: 0, y: 20 },
        animate: { filter: "blur(0px)", opacity: 1, y: 0 },
        transition: { duration: 0.7, ease: "easeOut" },
        className: "fixed top-4 left-0 right-0 z-50 flex items-center justify-between px-8 lg:px-16",
        children: [
          /* @__PURE__ */ jsx("div", { className: "liquid-glass h-12 w-12 flex items-center justify-center text-white", children: /* @__PURE__ */ jsx("span", { className: "font-heading italic text-2xl leading-none", children: "a" }) }),
          /* @__PURE__ */ jsx("div", { className: "hidden md:flex items-center", children: /* @__PURE__ */ jsxs("div", { className: "liquid-glass px-1.5 py-1.5 flex items-center gap-1", children: [
            links.map((l) => /* @__PURE__ */ jsx("a", { href: l === "3D \u63A2\u7D22" ? "./page2.html" : l === "\u5B87\u5B99\u8FF7\u5BAB" ? "./play.html" : `#${l.toLowerCase().replace(/\s+/g, "-")}`, className: "px-3 py-2 text-sm font-medium text-white/90 font-body hover:text-white transition", children: l }, l)),
            /* @__PURE__ */ jsxs("a", { href: "https://science.nasa.gov/", target: "_blank", rel: "noreferrer", className: "ml-1 inline-flex items-center gap-1.5 bg-white text-black px-3 py-2 text-sm font-medium font-body whitespace-nowrap hover:bg-white/90 transition", children: [
              "\u63A2\u7D22 NASA ",
              /* @__PURE__ */ jsx(ArrowUpRight, { className: "h-4 w-4" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "h-12 w-12", "aria-hidden": "true" })
        ]
      }
    );
  }
  function Hero() {
return /* @__PURE__ */ jsxs("section", { className: "relative w-full h-screen overflow-hidden", children: [
      /* @__PURE__ */ jsx(LightfallCanvas, {}),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex flex-col h-full pt-24 px-4", children: [
        /* @__PURE__ */ jsx(Navbar, {}),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col items-center justify-center text-center", children: [
          /* @__PURE__ */ jsxs(
            motion.div,
            {
              initial: { filter: "blur(10px)", opacity: 0, y: 20 },
              animate: { filter: "blur(0px)", opacity: 1, y: 0 },
              transition: { duration: 0.7, ease: "easeOut", delay: 0.4 },
              className: "liquid-glass rounded-full inline-flex items-center gap-2 pr-1.5",
              children: [
                /* @__PURE__ */ jsx("span", { className: "bg-white text-black px-3 py-1 text-xs font-semibold font-body rounded-full", children: "\u65B0" }),
                /* @__PURE__ */ jsx(
                  "a",
                  {
                    href: "https://science.nasa.gov/solar-system/",
                    target: "_blank",
                    rel: "noreferrer",
                    className: "text-sm text-white/90 font-body pr-3 hover:text-white underline-offset-2 hover:underline",
                    children: "NASA \u79D1\u5B66:8 \u9897\u884C\u661F\u30015 \u9897\u77EE\u884C\u661F\u3001\u7EA6 140 \u4E07\u9897\u5C0F\u884C\u661F\u548C\u7EA6 4000 \u9897\u5F57\u661F"
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            motion.div,
            {
              initial: { filter: "blur(10px)", opacity: 0, y: 20 },
              animate: { filter: "blur(0px)", opacity: 1, y: 0 },
              transition: { duration: 0.7, ease: "easeOut", delay: 0.7 },
              className: "mt-8 w-full",
              children: /* @__PURE__ */ jsx(
                BlurText,
                {
                  text: "\u98DE\u884C\u7684\u5B87\u5B99",
                  className: "font-heading italic text-white text-5xl md:text-7xl lg:text-[7rem] leading-[0.95] tracking-[-3px]"
                }
              )
            }
          ),
          /* @__PURE__ */ jsxs(
            motion.div,
            {
              initial: { filter: "blur(10px)", opacity: 0, y: 20 },
              animate: { filter: "blur(0px)", opacity: 1, y: 0 },
              transition: { duration: 0.7, ease: "easeOut", delay: 1.1 },
              className: "flex items-center gap-4 mt-6 flex-wrap justify-center",
              children: [
                /* @__PURE__ */ jsxs("a", { href: "./game.html", className: "liquid-glass-strong rounded-full px-5 py-2.5 text-sm font-medium text-white inline-flex items-center gap-2", children: [
                  "\u5F00\u59CB 3D ",
                  /* @__PURE__ */ jsx(ArrowUpRight, { className: "h-5 w-5" })
                ] }),
                /* @__PURE__ */ jsxs("a", { href: "./game2.html", className: "liquid-glass-strong rounded-full px-5 py-2.5 text-sm font-medium text-white inline-flex items-center gap-2", children: [
                  "\u5F00\u542F\u63A2\u7D22 ",
                  /* @__PURE__ */ jsx(ArrowUpRight, { className: "h-5 w-5" })
                ] }),
                /* @__PURE__ */ jsxs("a", { href: "https://science.nasa.gov/solar-system/", target: "_blank", rel: "noreferrer", className: "inline-flex items-center gap-2 text-white/90 font-body text-sm", children: [
                  "\u9605\u8BFB NASA \u539F\u6587 ",
                  /* @__PURE__ */ jsx(Play, { className: "h-4 w-4 fill-white" })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            motion.div,
            {
              initial: { filter: "blur(10px)", opacity: 0, y: 20 },
              animate: { filter: "blur(0px)", opacity: 1, y: 0 },
              transition: { duration: 0.7, ease: "easeOut", delay: 1.3 },
              className: "flex items-stretch gap-4 mt-8 flex-wrap justify-center",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "liquid-glass p-5 w-[220px] rounded-[1.25rem] text-left", children: [
                  /* @__PURE__ */ jsx(ClockIcon, {}),
                  /* @__PURE__ */ jsx("div", { className: "font-heading italic text-white text-4xl tracking-[-1px] leading-none mt-3", children: "4.6 Billion" }),
                  /* @__PURE__ */ jsx("div", { className: "text-xs text-white font-body font-light mt-2", children: "\u5E74\u2014\u2014\u592A\u9633\u7CFB\u7684\u5E74\u9F84" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "liquid-glass p-5 w-[220px] rounded-[1.25rem] text-left", children: [
                  /* @__PURE__ */ jsx(GlobeIcon, {}),
                  /* @__PURE__ */ jsx("div", { className: "font-heading italic text-white text-4xl tracking-[-1px] leading-none mt-3", children: "100 Billion" }),
                  /* @__PURE__ */ jsx("div", { className: "text-xs text-white font-body font-light mt-2", children: "\u94F6\u6CB3\u7CFB\u4E2D\u7684\u6052\u661F\u6570" })
                ] })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { filter: "blur(10px)", opacity: 0, y: 20 },
            animate: { filter: "blur(0px)", opacity: 1, y: 0 },
            transition: { duration: 0.7, ease: "easeOut", delay: 1.4 },
            className: "flex flex-col items-center gap-4 pb-8",
            children: [
              /* @__PURE__ */ jsx("div", { className: "liquid-glass rounded-full px-3.5 py-1 text-xs font-medium text-white font-body", children: "\u6570\u636E\u6765\u6E90:NASA \u79D1\u5B66\u4EFB\u52A1\u7406\u4E8B\u4F1A" }),
              /* @__PURE__ */ jsx("div", { className: "flex items-center gap-12 md:gap-16 flex-wrap justify-center", children: ["\u592A\u9633", "\u94F6\u6CB3", "\u4ED9\u5973", "\u4E09\u89D2", "\u5927\u9EA6\u54F2\u4F26"].map((n) => /* @__PURE__ */ jsx("span", { className: "font-heading italic text-white text-2xl md:text-3xl tracking-tight", children: n }, n)) })
            ]
          }
        )
      ] })
    ] });
  }
  var CARDS = [
    {
      title: "\u592A\u9633\u7CFB",
      video: "./astro-loop.mp4",
      tags: ["8 \u9897\u884C\u661F", "5 \u9897\u77EE\u884C\u661F", "\u67EF\u4F0A\u4F2F\u5E26", "\u5965\u5C14\u7279\u4E91"],
      icon: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "currentColor", className: "h-6 w-6 text-white", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21H5Zm1-4h12l-3.75-5-3 4L9 13l-3 4Z" }) }),
      body: "\u6211\u4EEC\u7684\u592A\u9633\u7CFB\u6709 8 \u9897\u884C\u661F\u30015 \u9897\u77EE\u884C\u661F\u3001\u7EA6 140 \u4E07\u9897\u5C0F\u884C\u661F\u548C\u7EA6 4000 \u9897\u5F57\u661F\u2014\u2014\u5B83\u4EEC\u90FD\u5728\u592A\u9633\u5F15\u529B\u7684\u7275\u5F15\u4E0B\u8FD0\u884C\u3002",
      link: "https://science.nasa.gov/solar-system/"
    },
    {
      title: "\u5B87\u5B99",
      video: "./astro-loop.mp4",
      tags: ["\u5B87\u5B99\u53F2", "\u57FA\u672C\u6784\u4EF6", "\u56DB\u79CD\u529B", "\u81A8\u80C0\u4E2D"],
      icon: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "currentColor", className: "h-6 w-6 text-white", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M4 6.47 5.76 10H20v8H4V6.47M22 4h-4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.89-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4Z" }) }),
      body: "\u4E86\u89E3\u5B87\u5B99\u7684\u5386\u53F2\u3001\u5B83\u7531\u4EC0\u4E48\u6784\u6210,\u4EE5\u53CA\u56DB\u79CD\u57FA\u672C\u529B\u5982\u4F55\u5851\u9020\u4ECE\u539F\u5B50\u5230\u661F\u7CFB\u7684\u4E07\u4E8B\u4E07\u7269\u3002",
      link: "https://science.nasa.gov/universe/"
    },
    {
      title: "\u661F\u7CFB",
      video: "./capabilities.mp4",
      tags: ["\u87BA\u65CB", "\u692D\u5706", "\u4E0D\u89C4\u5219", "\u77EE\u661F\u7CFB"],
      icon: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "currentColor", className: "h-6 w-6 text-white", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1Zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7Z" }) }),
      body: "\u661F\u7CFB\u7531\u6052\u661F\u3001\u884C\u661F\u4EE5\u53CA\u5DE8\u5927\u7684\u6C14\u4F53\u548C\u5C18\u57C3\u4E91\u7EC4\u6210,\u5B83\u4EEC\u5728\u5F15\u529B\u7684\u4F5C\u7528\u4E0B\u805A\u96C6\u5728\u4E00\u8D77\u3002\u6211\u4EEC\u7684\u94F6\u6CB3\u7CFB\u662F\u53EF\u89C2\u6D4B\u5B87\u5B99\u4E2D\u7EA6 1000 \u4EBF\u4E2A\u661F\u7CFB\u4E4B\u4E00\u3002",
      link: "https://science.nasa.gov/universe/galaxies/"
    }
  ];
  function Card({ card, onWatch }) {
    return /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { filter: "blur(10px)", opacity: 0, y: 30 },
        whileInView: { filter: "blur(0px)", opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.7, ease: "easeOut" },
        className: "liquid-glass rounded-[1.25rem] p-6 min-h-[360px] flex flex-col",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "liquid-glass rounded-[0.75rem] h-11 w-11 flex items-center justify-center", children: card.icon }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-wrap justify-end gap-1.5 max-w-[70%]", children: card.tags.map((t) => /* @__PURE__ */ jsx("span", { className: "liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 font-body whitespace-nowrap", children: t }, t)) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1" }),
          /* @__PURE__ */ jsx("h3", { className: "font-heading italic text-white text-3xl md:text-4xl tracking-[-1px] leading-none", children: card.title }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-white/90 font-body font-light leading-snug max-w-[32ch]", children: card.body }),
          card.link && /* @__PURE__ */ jsxs(
            "a",
            {
              href: card.link,
              target: "_blank",
              rel: "noreferrer",
              className: "liquid-glass mt-5 self-start inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest text-white/90 font-body hover:text-white",
              children: [
                "\u4E86\u89E3\u66F4\u591A \xB7 NASA",
                /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", className: "h-3.5 w-3.5", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M7 17 17 7 M9 7 H17 V15" }) })
              ]
            }
          ),
          card.video && /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => onWatch(card),
              className: "liquid-glass mt-5 self-start inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest text-white/90 font-body hover:text-white",
              children: [
                "\u89C2\u770B\u89C6\u9891",
                /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "currentColor", className: "h-3.5 w-3.5", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M6 4 L20 12 L6 20 Z" }) })
              ]
            }
          )
        ]
      }
    );
  }
  function Missions() {
    const items = [
      { name: "NASA \u4EFB\u52A1\u603B\u89C8", desc: "\u6240\u6709\u4EFB\u52A1\u7684\u4E00\u7AD9\u5F0F\u5165\u53E3", href: "https://science.nasa.gov/nasa-missions/", icon: "\u{1F680}" },
      { name: "\u592A\u9633\u7CFB\u63A2\u7D22", desc: "\u884C\u661F\u3001\u536B\u661F\u3001\u77EE\u884C\u661F\u4E0E\u5C0F\u884C\u661F", href: "https://science.nasa.gov/solar-system/", icon: "\u2604\uFE0F" },
      { name: "\u5B87\u5B99\u89C2\u6D4B", desc: "\u54C8\u52C3\u3001\u8A79\u59C6\u65AF\xB7\u97E6\u4F2F\u3001\u6697\u7269\u8D28\u4E0E\u6697\u80FD\u91CF", href: "https://science.nasa.gov/universe/", icon: "\u{1F30C}" },
      { name: "\u7CFB\u5916\u884C\u661F", desc: "\u5BFB\u627E\u7B2C\u4E8C\u4E2A\u5730\u7403", href: "https://science.nasa.gov/exoplanets/", icon: "\u2B50" }
    ];
    return /* @__PURE__ */ jsx("section", { id: "\u4EFB\u52A1", className: "relative w-full py-20 px-8 md:px-16 lg:px-20 bg-black/40", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto", children: [
      /* @__PURE__ */ jsx("div", { className: "text-sm font-body text-white/80 mb-6", children: "// \u4EFB\u52A1" }),
      /* @__PURE__ */ jsxs("h2", { className: "font-heading italic text-white text-5xl md:text-6xl leading-[0.9] tracking-[-3px] mb-10", children: [
        "NASA",
        /* @__PURE__ */ jsx("br", {}),
        "\u5728\u592A\u7A7A"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5", children: items.map((it) => /* @__PURE__ */ jsxs(
        "a",
        {
          href: it.href,
          target: "_blank",
          rel: "noreferrer",
          className: "liquid-glass rounded-[1.25rem] p-6 flex flex-col gap-3 hover:bg-white/[0.04] transition",
          children: [
            /* @__PURE__ */ jsx("div", { className: "text-3xl", "aria-hidden": "true", children: it.icon }),
            /* @__PURE__ */ jsx("div", { className: "font-heading italic text-white text-2xl tracking-[-1px]", children: it.name }),
            /* @__PURE__ */ jsx("div", { className: "text-sm text-white/80 font-body font-light leading-snug", children: it.desc }),
            /* @__PURE__ */ jsx("div", { className: "mt-auto text-xs uppercase tracking-widest text-white/60 font-body pt-3", children: "\u8DF3\u8F6C \u2197" })
          ]
        },
        it.name
      )) })
    ] }) });
  }
  function Capabilities({ onWatch }) {
    return /* @__PURE__ */ jsx("section", { id: "capabilities", className: "relative w-full min-h-screen bg-black/40 overflow-hidden", children: /* @__PURE__ */ jsxs("div", { className: "relative z-10 px-8 md:px-16 lg:px-20 pt-24 pb-10 flex flex-col min-h-screen", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-auto", children: [
        /* @__PURE__ */ jsx("div", { className: "text-sm font-body text-white/80 mb-6", children: "// \u5B87\u5B99\u4E13\u9898" }),
        /* @__PURE__ */ jsxs("h2", { className: "font-heading italic text-white text-6xl md:text-7xl lg:text-[6rem] leading-[0.9] tracking-[-3px]", children: [
          "\u5B87\u5B99",
          /* @__PURE__ */ jsx("br", {}),
          "\u524D\u6CBF"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mt-16", children: CARDS.map((c) => /* @__PURE__ */ jsx("div", { id: c.title, className: "scroll-mt-24", children: /* @__PURE__ */ jsx(Card, { card: c, onWatch }) }, c.title)) })
    ] }) });
  }
  function VideoModal({ card, onClose }) {
    useEffect(() => {
      const onKey = (e) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);
    if (!card) return null;
    return /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-6",
        onClick: onClose,
        children: /* @__PURE__ */ jsxs(
          "div",
          {
            className: "liquid-glass-strong relative w-full max-w-4xl rounded-[1.25rem] p-4 md:p-6",
            onClick: (e) => e.stopPropagation(),
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
                /* @__PURE__ */ jsx("h3", { className: "font-heading italic text-white text-2xl md:text-3xl tracking-[-1px]", children: card.title }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    "aria-label": "\u5173\u95ED",
                    onClick: onClose,
                    className: "liquid-glass h-9 w-9 flex items-center justify-center text-white/80 hover:text-white",
                    children: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", className: "h-4 w-4", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M6 6l12 12M18 6L6 18" }) })
                  }
                )
              ] }),
              /* @__PURE__ */ jsx(
                "video",
                {
                  src: card.video,
                  controls: true,
                  autoPlay: true,
                  preload: "metadata",
                  playsInline: true,
                  className: "w-full max-h-[70vh] rounded-[0.75rem] bg-black"
                }
              ),
              /* @__PURE__ */ jsx("p", { className: "mt-4 text-xs text-white/60 font-body", children: "\u6765\u6E90:NASA Science Mission Directorate" })
            ]
          }
        )
      }
    );
  }
  function LatestGames() {
  var items = [
    { name: "\u8d2a\u5403\u86c7", desc: "\u4e00\u6761\u4f1a\u5403\u661f\u661f\u7684\u5b87\u5b99\u86c7\u3002", href: "./game3.html", tag: "\u73a9" },
    { name: "Stellar Strike 3D", desc: "\u5f00\u8239\u51fb\u788e\u9668\u77f3\uff0c\u575a\u6301 60 \u79d2\u3002", href: "./game4.html", tag: "\u65b0" },
    { name: "\u5b87\u5b99\u5b88\u62a4\u8005", desc: "\u51fb\u843d\u5c0f\u884c\u661f\uff0c\u575a\u6301 60 \u79d2\u3002", href: "./game2.html", tag: "\u73a9" },
    { name: "\u592a\u9633\u7cfb 3D", desc: "\u63a2\u7d22\u884c\u661f\uff0c\u56de\u7b54\u95ee\u9898\u3002", href: "./game.html", tag: "\u63a2\u7d22" }
  ];
  return /* @__PURE__ */ jsx("section", {
    id: "latest-games",
    className: "relative w-full py-20 px-8 md:px-16 lg:px-20",
    children: /* @__PURE__ */ jsxs("div", {
      className: "max-w-7xl mx-auto",
      children: [
        /* @__PURE__ */ jsx("div", { className: "text-sm font-body text-white/80 mb-6", children: "// \u6700\u65b0" }),
        /* @__PURE__ */ jsxs("h2", { className: "font-heading italic text-white text-5xl md:text-6xl leading-[0.9] tracking-[-3px] mb-10", children: ["\u6700\u65b0", /* @__PURE__ */ jsx("br", {}), "\u6e38\u620f"] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5", children: items.map(function (it) {
          return /* @__PURE__ */ jsxs("a", {
            href: it.href,
            className: "liquid-glass rounded-[1.25rem] p-6 flex flex-col gap-3 hover:bg-white/[0.04] transition group",
            children: [
              it.tag === "NEW" && /* @__PURE__ */ jsx("div", { className: "self-start text-[10px] tracking-[0.25em] px-2 py-1 rounded-full bg-amber-300/20 text-amber-200 font-body", children: it.tag }),
              it.tag !== "NEW" && /* @__PURE__ */ jsx("div", { className: "self-start text-[10px] tracking-[0.25em] px-2 py-1 rounded-full bg-white/10 text-white/80 font-body", children: it.tag }),
              /* @__PURE__ */ jsx("div", { className: "font-heading italic text-white text-2xl tracking-[-1px] mt-1", children: it.name }),
              /* @__PURE__ */ jsx("div", { className: "text-sm text-white/80 font-body font-light leading-snug", children: it.desc }),
              /* @__PURE__ */ jsx("div", { className: "mt-auto text-xs uppercase tracking-widest text-white/60 font-body pt-3 group-hover:text-white", children: "\u5f00\u59cb \u2197" })
            ]
          }, it.name);
        }) })
      ]
    })
  });
}
function App() {
    const [activeCard, setActiveCard] = useState(null);
    return /* @__PURE__ */ jsxs("main", { className: "text-white", children: [
      /* @__PURE__ */ jsx(Hero, {}),
      /* @__PURE__ */ jsx(Missions, {}),
      /* @__PURE__ */ jsx(Capabilities, { onWatch: setActiveCard }),
      /* @__PURE__ */ jsx(LatestGames, {}),
      /* @__PURE__ */ jsx(AnimatePresence, { children: activeCard && /* @__PURE__ */ jsx(VideoModal, { card: activeCard, onClose: () => setActiveCard(null) }) })
    ] });
  }
  var root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(/* @__PURE__ */ jsx(App, {}));
})();
