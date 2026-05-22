"use client";

import { useEffect, useRef } from "react";

const CHAOS_ICONS = [
  {
    name: "Notion",
    color: "#ffffff",
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 4h11l3 3v13H5z" opacity=".15"/><path d="M6 5v14h12V8.6L14.4 5H6zm8 0v4h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 11l4 4M9 14h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`
  },
  {
    name: "GitHub",
    color: "#e6e6e6",
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.12-1.47-1.12-1.47-.92-.63.07-.62.07-.62 1.02.07 1.55 1.05 1.55 1.05.9 1.55 2.37 1.1 2.95.84.09-.65.35-1.1.64-1.35-2.22-.25-4.55-1.11-4.55-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.9-1.29 2.74-1.02 2.74-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.85-2.34 4.7-4.57 4.94.36.31.68.92.68 1.86v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2z"/></svg>`
  },
  {
    name: "Slack",
    color: "#e01e5a",
    svg: `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="9" width="6" height="2" rx="1" fill="#e01e5a"/><rect x="9" y="3" width="2" height="6" rx="1" fill="#36c5f0"/><rect x="15" y="13" width="6" height="2" rx="1" fill="#2eb67d"/><rect x="13" y="15" width="2" height="6" rx="1" fill="#ecb22e"/><rect x="9" y="13" width="2" height="2" rx="1" fill="#e01e5a"/><rect x="13" y="9" width="2" height="2" rx="1" fill="#36c5f0"/></svg>`
  },
  {
    name: "VS Code",
    color: "#0098ff",
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 2 9 10l-4-3-2 1v8l2 1 4-3 8 8 4-2V4l-4-2zm-2 6v8L9 12l6-4z"/></svg>`
  },
  {
    name: "Browser",
    color: "#a78bfa",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><circle cx="6" cy="7" r=".7" fill="currentColor"/><circle cx="8.5" cy="7" r=".7" fill="currentColor"/><circle cx="11" cy="7" r=".7" fill="currentColor"/></svg>`
  },
  {
    name: "Terminal",
    color: "#22c55e",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 7 9 12 5 17"/><line x1="12" y1="17" x2="18" y2="17"/></svg>`
  },
  {
    name: "Text file",
    color: "#cbd5e1",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="14 3 14 9 20 9"/><line x1="8" y1="13" x2="16" y2="13" stroke-linecap="round"/><line x1="8" y1="17" x2="13" y2="17" stroke-linecap="round"/></svg>`
  },
  {
    name: "Bookmark",
    color: "#f59e0b",
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg>`
  }
];

const ICON_SIZE = 40;

class ChaosIcon {
  el: HTMLElement;
  size = ICON_SIZE;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  rotSpeed: number;
  phase: number;

  constructor(el: HTMLElement, stage: HTMLElement) {
    this.el = el;
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    this.x = Math.random() * Math.max(1, w - ICON_SIZE);
    this.y = Math.random() * Math.max(1, h - ICON_SIZE);
    this.vx = (Math.random() - 0.5) * 1.6;
    this.vy = (Math.random() - 0.5) * 1.6;
    this.rot = Math.random() * 360;
    this.rotSpeed = (Math.random() - 0.5) * 0.6;
    this.phase = Math.random() * Math.PI * 2;
  }

  update(
    t: number,
    mouse: { x: number; y: number; active: boolean },
    bounds: { w: number; h: number }
  ) {
    if (mouse.active) {
      const cx = this.x + this.size / 2;
      const cy = this.y + this.size / 2;
      const dx = cx - mouse.x;
      const dy = cy - mouse.y;
      const dist = Math.hypot(dx, dy);
      const radius = 110;
      if (dist > 0 && dist < radius) {
        const force = ((radius - dist) / radius) * 2.4;
        this.vx += (dx / dist) * force;
        this.vy += (dy / dist) * force;
      }
    }

    this.vx *= 0.985;
    this.vy *= 0.985;

    const speed = Math.hypot(this.vx, this.vy);
    if (speed < 0.25) {
      this.vx += (Math.random() - 0.5) * 0.4;
      this.vy += (Math.random() - 0.5) * 0.4;
    }
    const cap = 4.5;
    if (speed > cap) {
      this.vx = (this.vx / speed) * cap;
      this.vy = (this.vy / speed) * cap;
    }

    this.x += this.vx;
    this.y += this.vy;
    this.rot += this.rotSpeed;

    const maxX = bounds.w - this.size;
    const maxY = bounds.h - this.size;
    if (this.x < 0) {
      this.x = 0;
      this.vx *= -1;
    } else if (this.x > maxX) {
      this.x = maxX;
      this.vx *= -1;
    }
    if (this.y < 0) {
      this.y = 0;
      this.vy *= -1;
    } else if (this.y > maxY) {
      this.y = maxY;
      this.vy *= -1;
    }

    const pulse = 1 + Math.sin(t / 700 + this.phase) * 0.08;
    this.el.style.transform = `translate(${this.x.toFixed(2)}px, ${this.y.toFixed(2)}px) rotate(${this.rot.toFixed(2)}deg) scale(${pulse.toFixed(3)})`;
  }
}

export function ChaosStage() {
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const created: HTMLElement[] = [];
    const icons: ChaosIcon[] = [];

    for (const spec of CHAOS_ICONS) {
      const el = document.createElement("span");
      el.className =
        "absolute inset-0 inline-flex size-10 items-center justify-center rounded-[10px] border border-[#34343f] bg-[#1c1c22] shadow-[0_1px_2px_rgba(0,0,0,0.4)] select-none pointer-events-none [&_svg]:size-[22px]";
      el.style.color = spec.color;
      el.style.transformOrigin = "50% 50%";
      el.setAttribute("title", spec.name);
      el.setAttribute("aria-hidden", "true");
      el.innerHTML = spec.svg;
      stage.appendChild(el);
      created.push(el);
      icons.push(new ChaosIcon(el, stage));
    }

    if (reduce) {
      for (const icon of icons) {
        icon.el.style.transform = `translate(${icon.x}px, ${icon.y}px) rotate(${icon.rot}deg)`;
      }
      return () => {
        for (const el of created) el.remove();
      };
    }

    const mouse = { x: 0, y: 0, active: false };
    const onPointerMove = (e: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };
    const onPointerLeave = () => {
      mouse.active = false;
    };
    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerleave", onPointerLeave);

    let bounds = { w: stage.clientWidth, h: stage.clientHeight };
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        bounds = { w: stage.clientWidth, h: stage.clientHeight };
        for (const icon of icons) {
          icon.x = Math.min(icon.x, bounds.w - icon.size);
          icon.y = Math.min(icon.y, bounds.h - icon.size);
        }
      });
      ro.observe(stage);
    }

    let running = true;
    let rafId = 0;
    const onVisibility = () => {
      running = !document.hidden;
      if (running) rafId = requestAnimationFrame(tick);
    };
    document.addEventListener("visibilitychange", onVisibility);

    function tick(t: number) {
      for (const icon of icons) icon.update(t, mouse, bounds);
      if (running) rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      ro?.disconnect();
      for (const el of created) el.remove();
    };
  }, []);

  return (
    <div
      ref={stageRef}
      role="img"
      aria-label="Scattered developer knowledge sources"
      className="relative min-h-[280px] flex-1 cursor-crosshair overflow-hidden rounded-2xl border border-dashed border-[#26262e] bg-[#0f0f12] sm:min-h-[360px]"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 20%, rgba(239, 68, 68, 0.10), transparent 50%), radial-gradient(circle at 80% 70%, rgba(168, 85, 247, 0.08), transparent 55%)"
      }}
    />
  );
}

export default ChaosStage;
