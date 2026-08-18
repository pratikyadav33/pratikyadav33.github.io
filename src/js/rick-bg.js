(() => {
  const canvas = document.getElementById("rick-bg");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: false });
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const OUTLINE = "#111";
  const PORTAL = "#97ce4c";
  const CYAN = "#22d3ee";
  const MAGENTA = "#d946ef";
  const VOID = "#0a0618";

  let width = 0;
  let height = 0;
  let start = performance.now();
  let running = false;
  let stars = [];
  let agents = [];
  let nodes = [];
  let portals = [];
  let agentCount = 18;
  let pickleMode = false;
  let pickleHop = 0;

  const rand = (a, b) => a + Math.random() * (b - a);

  function makeAgent() {
    return {
      x: rand(0.15, 0.85),
      z: rand(0.15, 0.85),
      vx: 0,
      vz: 0,
      trail: [],
      hue: Math.random() > 0.5 ? PORTAL : CYAN,
    };
  }

  function seedAgents(count = agentCount) {
    agentCount = Math.max(3, Math.min(48, count));
    agents = Array.from({ length: agentCount }, makeAgent);
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedScene();
  }

  function lossField(x, z, t) {
    const phase = reduceMotion ? 0 : t * 0.00008;
    const r = Math.hypot(x - 0.5, z - 0.5);
    const bump = Math.exp(-((r - 0.18) ** 2) / 0.012) * 0.9;
    const bump2 = Math.exp(-((r - 0.42) ** 2) / 0.04) * 0.45;
    const rip = Math.sin(x * 11 + phase) * Math.cos(z * 9 - phase) * 0.08;
    return bump + bump2 + rip + 0.12;
  }

  function seedScene() {
    stars = Array.from({ length: 120 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: rand(0.5, 2),
      tw: rand(0, Math.PI * 2),
    }));

    seedAgents(agentCount);

    nodes = Array.from({ length: 24 }, () => ({
      x: rand(0.05, 0.95),
      y: rand(0.05, 0.45),
      links: [],
    }));
    for (const node of nodes) {
      const count = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i += 1) {
        node.links.push(nodes[Math.floor(Math.random() * nodes.length)]);
      }
    }

    portals = [
      { x: 0.82, y: 0.18, r: 0.09, spin: 0 },
      { x: 0.14, y: 0.28, r: 0.06, spin: 1.2 },
      { x: 0.52, y: 0.1, r: 0.045, spin: 2.4 },
    ];
  }

  function project(ix, iz, h, t) {
    const cx = width * 0.5;
    const cy = height * 0.62;
    const scale = Math.min(width, height) * 0.92;
    const angle = reduceMotion ? 0.55 : 0.55 + Math.sin(t * 0.00005) * 0.04;
    const rx = (ix - 0.5) * Math.cos(angle) - (iz - 0.5) * Math.sin(angle);
    const rz = (ix - 0.5) * Math.sin(angle) + (iz - 0.5) * Math.cos(angle);
    return {
      x: cx + rx * scale,
      y: cy + rz * scale * 0.52 - h * scale * 0.38,
      depth: rz,
    };
  }

  function drawVoid(t) {
    const g = ctx.createRadialGradient(width * 0.5, height * 0.35, 0, width * 0.5, height * 0.5, Math.max(width, height) * 0.75);
    g.addColorStop(0, "#1a0f33");
    g.addColorStop(0.45, "#120a24");
    g.addColorStop(1, VOID);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    for (const s of stars) {
      const tw = reduceMotion ? 0.7 : 0.35 + Math.sin(t * 0.003 + s.tw) * 0.65;
      ctx.fillStyle = `rgba(255,255,255,${tw * 0.9})`;
      ctx.beginPath();
      ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawLossMesh(t) {
    const grid = 28;
    const pts = [];
    for (let i = 0; i <= grid; i += 1) {
      pts[i] = [];
      for (let j = 0; j <= grid; j += 1) {
        const x = i / grid;
        const z = j / grid;
        const h = lossField(x, z, t);
        pts[i][j] = { ...project(x, z, h, t), h };
      }
    }

    for (let i = 0; i < grid; i += 1) {
      for (let j = 0; j < grid; j += 1) {
        const p = pts[i][j];
        const q = pts[i + 1][j];
        const r = pts[i][j + 1];
        const avg = (p.h + q.h + r.h) / 3;
        const col = avg > 0.55 ? MAGENTA : avg > 0.35 ? PORTAL : "#4338ca";
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.lineTo(r.x, r.y);
        ctx.closePath();
        ctx.fillStyle = col;
        ctx.globalAlpha = 0.55 + avg * 0.35;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    const contours = [0.25, 0.4, 0.55, 0.7];
    ctx.setLineDash([5, 7]);
    for (const level of contours) {
      ctx.strokeStyle = `rgba(151, 206, 76, ${0.35 + level * 0.3})`;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < grid; i += 1) {
        for (let j = 0; j < grid; j += 1) {
          const a = pts[i][j].h;
          const b = pts[i + 1][j].h;
          const c = pts[i][j + 1].h;
          if ((a - level) * (b - level) < 0) {
            const tL = (level - a) / (b - a);
            ctx.beginPath();
            ctx.moveTo(pts[i][j].x + (pts[i + 1][j].x - pts[i][j].x) * tL, pts[i][j].y + (pts[i + 1][j].y - pts[i][j].y) * tL);
            ctx.lineTo(pts[i][j].x + (pts[i + 1][j].x - pts[i][j].x) * tL + 2, pts[i][j].y + (pts[i + 1][j].y - pts[i][j].y) * tL);
            ctx.stroke();
          }
          if ((a - level) * (c - level) < 0) {
            const tL = (level - a) / (c - a);
            ctx.beginPath();
            ctx.moveTo(pts[i][j].x + (pts[i][j + 1].x - pts[i][j].x) * tL, pts[i][j].y + (pts[i][j + 1].y - pts[i][j].y) * tL);
            ctx.lineTo(pts[i][j].x + (pts[i][j + 1].x - pts[i][j].x) * tL + 2, pts[i][j].y + (pts[i][j + 1].y - pts[i][j].y) * tL);
            ctx.stroke();
          }
        }
      }
    }
    ctx.setLineDash([]);
  }

  function gradStep(agent, t) {
    const eps = 0.008;
    const h = lossField(agent.x, agent.z, t);
    const hx = lossField(agent.x + eps, agent.z, t);
    const hz = lossField(agent.x, agent.z + eps, t);
    const gx = (hx - h) / eps;
    const gz = (hz - h) / eps;
    const lr = 0.012;
    agent.vx = agent.vx * 0.82 - gx * lr;
    agent.vz = agent.vz * 0.82 - gz * lr;
    agent.x = Math.min(0.92, Math.max(0.08, agent.x + agent.vx));
    agent.z = Math.min(0.92, Math.max(0.08, agent.z + agent.vz));
    const p = project(agent.x, agent.z, lossField(agent.x, agent.z, t), t);
    agent.trail.push(p);
    if (agent.trail.length > 28) agent.trail.shift();
  }

  function drawAgents(t) {
    for (const agent of agents) {
      if (!reduceMotion) gradStep(agent, t);

      if (agent.trail.length > 1) {
        ctx.strokeStyle = agent.hue === PORTAL ? "rgba(151,206,76,0.35)" : "rgba(34,211,238,0.35)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(agent.trail[0].x, agent.trail[0].y);
        for (let i = 1; i < agent.trail.length; i += 1) {
          ctx.lineTo(agent.trail[i].x, agent.trail[i].y);
        }
        ctx.stroke();
      }

      const p = project(agent.x, agent.z, lossField(agent.x, agent.z, t), t);
      ctx.fillStyle = agent.hue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawNeuralNet(t) {
    const ox = width * 0.08;
    const oy = height * 0.08;
    const flicker = reduceMotion ? 1 : 0.6 + Math.sin(t * 0.005) * 0.4;

    for (const node of nodes) {
      const nx = ox + node.x * width * 0.34;
      const ny = oy + node.y * height * 0.22;
      for (const link of node.links) {
        const lx = ox + link.x * width * 0.34;
        const ly = oy + link.y * height * 0.22;
        ctx.strokeStyle = `rgba(151, 206, 76, ${0.15 * flicker})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(lx, ly);
        ctx.stroke();
      }
    }

    for (const node of nodes) {
      const nx = ox + node.x * width * 0.34;
      const ny = oy + node.y * height * 0.22;
      ctx.fillStyle = CYAN;
      ctx.beginPath();
      ctx.arc(nx, ny, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.font = `bold ${Math.max(10, width * 0.009)}px "Comic Sans MS", cursive`;
    ctx.fillStyle = PORTAL;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.5;
    ctx.strokeText("DEEP NET C-137", ox, oy - 8);
    ctx.fillText("DEEP NET C-137", ox, oy - 8);
  }

  function drawPortalRing(cx, cy, r, spin, t) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(spin + (reduceMotion ? 0 : t * 0.00035));
    ctx.fillStyle = PORTAL;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = VOID;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.68, r * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawPortals(t) {
    for (const p of portals) {
      drawPortalRing(p.x * width, p.y * height, p.r * Math.min(width, height), p.spin, t);
    }
  }

  function drawPickleRick(t) {
    if (!pickleMode) return;

    pickleHop = reduceMotion ? 0 : Math.sin(t * 0.003) * 0.04;
    const px = 0.5 + Math.sin(t * 0.0004) * 0.12;
    const pz = 0.5 + pickleHop;
    const ph = lossField(px, pz, t);
    const p = project(px, pz, ph + 0.08, t);

    ctx.save();
    ctx.translate(p.x, p.y - 28);
    ctx.rotate(Math.sin(t * 0.002) * 0.15);

    ctx.fillStyle = "#84cc16";
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-5, -10, 4, 0, Math.PI * 2);
    ctx.arc(5, -10, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = OUTLINE;
    ctx.beginPath();
    ctx.arc(-4, -9, 1.5, 0, Math.PI * 2);
    ctx.arc(6, -9, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `bold ${Math.max(9, width * 0.008)}px "Comic Sans MS", cursive`;
    ctx.fillStyle = "#84cc16";
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.strokeText("PICKLE RICK", -28, 44);
    ctx.fillText("PICKLE RICK", -28, 44);
    ctx.restore();
  }

  function drawLabels(t) {
    const pulse = reduceMotion ? 0 : Math.sin(t * 0.001) * 3;
    ctx.font = `bold ${Math.max(12, width * 0.013)}px "Comic Sans MS", cursive`;
    const labels = [
      { text: "LOSS MANIFOLD", x: 0.52, y: 0.88 },
      { text: "AUTONOMOUS AGENTS", x: 0.08, y: 0.42 },
      { text: "∂L/∂θ → 0 (maybe)", x: 0.58, y: 0.14 },
      { text: "PhD THESIS FIELD", x: 0.22, y: 0.72 },
    ];
    for (const lb of labels) {
      const x = lb.x * width;
      const y = lb.y * height + pulse;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3;
      ctx.strokeText(lb.text, x, y);
      ctx.fillStyle = lb.text.includes("PhD") ? MAGENTA : PORTAL;
      ctx.fillText(lb.text, x, y);
    }
  }

  function vignette() {
    const v = ctx.createRadialGradient(width * 0.5, height * 0.5, width * 0.1, width * 0.5, height * 0.5, Math.max(width, height) * 0.72);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(5, 3, 12, 0.55)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, width, height);
  }

  function frame(now) {
    if (document.hidden) {
      running = false;
      return;
    }
    running = true;
    const t = now - start;
    drawVoid(t);
    drawLossMesh(t);
    drawAgents(t);
    drawPickleRick(t);
    drawNeuralNet(t);
    drawPortals(t);
    drawLabels(t);
    vignette();
    if (!reduceMotion) requestAnimationFrame(frame);
  }

  window.RickLab = {
    setAgentCount(count) {
      seedAgents(Number(count) || 18);
    },
    setPickleMode(on) {
      pickleMode = Boolean(on);
    },
    getAgentCount() {
      return agentCount;
    },
  };

  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !reduceMotion && !running) {
      requestAnimationFrame(frame);
    }
  });

  resize();
  requestAnimationFrame(frame);
})();
