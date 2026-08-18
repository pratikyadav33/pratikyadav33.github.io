(() => {
  const canvas = document.getElementById("rick-bg");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: false });
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const PORTAL = "#6ee7a0";
  const CYAN = "#67e8f9";
  const VOID = "#0a0618";

  const GRID = 120;
  const SPAN = 14;
  const HEIGHT_SCALE = 0.68;
  const AZIMUTH = 0.82;
  const ELEVATION = 0.34;
  const ZOOM = 1.14;

  let width = 0;
  let height = 0;
  let start = performance.now();
  let running = false;
  let stars = [];
  let agents = [];
  let nodes = [];
  let portals = [];
  let agentCount = 18;
  let heights = [];
  let zRange = { min: -1, max: 1 };

  const rand = (a, b) => a + Math.random() * (b - a);

  function makeAgent() {
    return {
      x: rand(-SPAN * 0.35, SPAN * 0.35),
      y: rand(-SPAN * 0.35, SPAN * 0.35),
      vx: 0,
      vy: 0,
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
    updateHeights(0);
  }

  function lossField(x, y, t) {
    const phase = reduceMotion ? 0 : t * 0.00005;
    const drift = reduceMotion ? 0 : Math.sin(phase) * 0.35;
    const s = 1 / SPAN;

    const u = (x * s + y * s + 1) * 0.707;
    const v = (x * s - y * s) * 0.707;
    const doubleWell = 0.38 * (u * u - 0.82) ** 2 + 0.22 * v * v;

    const mx = SPAN * (0.24 + drift * 0.015);
    const my = SPAN * (-0.22 - drift * 0.012);
    const deepMin = -0.62 * Math.exp(-((x - mx) ** 2 + (y - my) ** 2) / (SPAN * 0.22));

    const sx = SPAN * (-0.22 - drift * 0.01);
    const sy = SPAN * (0.22 + drift * 0.014);
    const shallowMin = -0.28 * Math.exp(-((x - sx) ** 2 + (y - sy) ** 2) / (SPAN * 0.42));

    const ridge = 0.18 * Math.exp(-((x ** 2 + y ** 2)) / (SPAN * SPAN * 0.55));

    const rip =
      0.04 * Math.sin(x * 0.55 + phase) * Math.cos(y * 0.48 - phase * 0.7) +
      0.025 * Math.sin(x * 1.1 - y * 0.9 + phase * 0.5);

    return -(doubleWell + deepMin + shallowMin + ridge + rip + 0.28);
  }

  function updateHeights(time) {
    heights = [];
    zRange = { min: Infinity, max: -Infinity };
    const step = (SPAN * 2) / (GRID - 1);
    for (let j = 0; j < GRID; j += 1) {
      const row = [];
      for (let i = 0; i < GRID; i += 1) {
        const x = -SPAN + i * step;
        const y = -SPAN + j * step;
        const z = lossField(x, y, time);
        row.push(z);
        zRange.min = Math.min(zRange.min, z);
        zRange.max = Math.max(zRange.max, z);
      }
      heights.push(row);
    }
  }

  function toView(gx, gy, gz) {
    const z = gz * HEIGHT_SCALE;
    const ca = Math.cos(AZIMUTH);
    const sa = Math.sin(AZIMUTH);
    const xr = gx * ca - gy * sa;
    const yr = gx * sa + gy * ca;
    const ce = Math.cos(ELEVATION);
    const se = Math.sin(ELEVATION);
    return [xr, z * ce + yr * se, yr * ce - z * se];
  }

  function fitScale() {
    return Math.min(width, height) * 0.118 * ZOOM;
  }

  function project(viewX, viewY, depth) {
    const scale = fitScale();
    return [width * 0.5 + viewX * scale, height * 0.56 - viewY * scale, depth];
  }

  function projectWorld(x, y, t) {
    const z = lossField(x, y, t);
    const [vx, vy, depth] = toView(x, y, z);
    const [sx, sy] = project(vx, vy, depth);
    return { x: sx, y: sy, depth };
  }

  function heat(z) {
    const span = Math.max(zRange.max - zRange.min, 0.001);
    const t = Math.max(0, Math.min(1, (z - zRange.min) / span));
    const stops = [
      [0.0, [24, 36, 74]],
      [0.22, [30, 64, 175]],
      [0.42, [14, 165, 233]],
      [0.58, [52, 211, 153]],
      [0.72, [110, 231, 160]],
      [0.86, [192, 132, 252]],
      [1.0, [168, 85, 247]],
    ];
    for (let i = 0; i < stops.length - 1; i += 1) {
      const [a, ca] = stops[i];
      const [b, cb] = stops[i + 1];
      if (t >= a && t <= b) {
        const u = (t - a) / (b - a);
        return `rgb(${Math.round(ca[0] + (cb[0] - ca[0]) * u)}, ${Math.round(ca[1] + (cb[1] - ca[1]) * u)}, ${Math.round(ca[2] + (cb[2] - ca[2]) * u)})`;
      }
    }
    return "rgb(168, 85, 247)";
  }

  function seedScene() {
    stars = Array.from({ length: 80 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.42,
      r: rand(0.4, 1.4),
      tw: rand(0, Math.PI * 2),
    }));

    seedAgents(agentCount);

    nodes = Array.from({ length: 14 }, () => ({
      x: rand(0.05, 0.95),
      y: rand(0.05, 0.28),
      links: [],
    }));
    for (const node of nodes) {
      const count = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i += 1) {
        node.links.push(nodes[Math.floor(Math.random() * nodes.length)]);
      }
    }

    portals = [
      { x: 0.78, y: 0.14, r: 0.06, spin: 0 },
      { x: 0.16, y: 0.2, r: 0.04, spin: 1.2 },
    ];
  }

  function drawVoid(t) {
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, "#15122a");
    g.addColorStop(0.55, "#0e0b1a");
    g.addColorStop(1, VOID);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    for (const s of stars) {
      const tw = reduceMotion ? 0.5 : 0.25 + Math.sin(t * 0.003 + s.tw) * 0.45;
      ctx.fillStyle = `rgba(255,255,255,${tw * 0.55})`;
      ctx.beginPath();
      ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawLossSurface(t) {
    if (!reduceMotion) updateHeights(t);

    const step = (SPAN * 2) / (GRID - 1);
    const faces = [];

    for (let j = 0; j < GRID - 1; j += 1) {
      for (let i = 0; i < GRID - 1; i += 1) {
        const x0 = -SPAN + i * step;
        const y0 = -SPAN + j * step;
        const x1 = x0 + step;
        const y1 = y0 + step;
        const z00 = heights[j][i];
        const z10 = heights[j][i + 1];
        const z01 = heights[j + 1][i];
        const z11 = heights[j + 1][i + 1];

        const tris = [
          { pts: [[x0, y0, z00], [x1, y0, z10], [x1, y1, z11]], avg: (z00 + z10 + z11) / 3 },
          { pts: [[x0, y0, z00], [x1, y1, z11], [x0, y1, z01]], avg: (z00 + z11 + z01) / 3 },
        ];

        for (const tri of tris) {
          const projected = tri.pts.map(([x, y, z]) => {
            const [vx, vy, depth] = toView(x, y, z);
            return project(vx, vy, depth);
          });
          const depth = projected.reduce((sum, p) => sum + p[2], 0) / 3;
          faces.push({ projected, depth, avg: tri.avg });
        }
      }
    }

    faces.sort((a, b) => a.depth - b.depth);

    for (const face of faces) {
      const [p0, p1, p2] = face.projected;
      ctx.beginPath();
      ctx.moveTo(p0[0], p0[1]);
      ctx.lineTo(p1[0], p1[1]);
      ctx.lineTo(p2[0], p2[1]);
      ctx.closePath();
      ctx.fillStyle = heat(face.avg);
      ctx.fill();
    }
  }

  function gradStep(agent, t) {
    const eps = 0.08;
    const h = lossField(agent.x, agent.y, t);
    const hx = lossField(agent.x + eps, agent.y, t);
    const hy = lossField(agent.x, agent.y + eps, t);
    const gx = (hx - h) / eps;
    const gy = (hy - h) / eps;
    const lr = 0.06;
    agent.vx = agent.vx * 0.84 - gx * lr;
    agent.vy = agent.vy * 0.84 - gy * lr;
    agent.x = Math.min(SPAN * 0.85, Math.max(-SPAN * 0.85, agent.x + agent.vx));
    agent.y = Math.min(SPAN * 0.85, Math.max(-SPAN * 0.85, agent.y + agent.vy));
    const p = projectWorld(agent.x, agent.y, t);
    agent.trail.push(p);
    if (agent.trail.length > 24) agent.trail.shift();
  }

  function drawAgents(t) {
    for (const agent of agents) {
      if (!reduceMotion) gradStep(agent, t);

      if (agent.trail.length > 1) {
        ctx.strokeStyle = agent.hue === PORTAL ? "rgba(110,231,160,0.28)" : "rgba(103,232,249,0.28)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(agent.trail[0].x, agent.trail[0].y);
        for (let i = 1; i < agent.trail.length; i += 1) {
          ctx.lineTo(agent.trail[i].x, agent.trail[i].y);
        }
        ctx.stroke();
      }

      const p = projectWorld(agent.x, agent.y, t);
      ctx.fillStyle = agent.hue;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawNeuralNet(t) {
    const ox = width * 0.06;
    const oy = height * 0.06;
    const flicker = reduceMotion ? 1 : 0.65 + Math.sin(t * 0.004) * 0.25;

    for (const node of nodes) {
      const nx = ox + node.x * width * 0.28;
      const ny = oy + node.y * height * 0.18;
      for (const link of node.links) {
        const lx = ox + link.x * width * 0.28;
        const ly = oy + link.y * height * 0.18;
        ctx.strokeStyle = `rgba(110, 231, 160, ${0.06 * flicker})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(lx, ly);
        ctx.stroke();
      }
    }

    for (const node of nodes) {
      const nx = ox + node.x * width * 0.28;
      const ny = oy + node.y * height * 0.18;
      ctx.fillStyle = `rgba(103, 232, 249, ${0.4 * flicker})`;
      ctx.beginPath();
      ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPortalRing(cx, cy, r, spin, time) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(spin + (reduceMotion ? 0 : time * 0.0002));
    ctx.strokeStyle = "rgba(110, 231, 160, 0.18)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.34, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawPortals(t) {
    for (const p of portals) {
      drawPortalRing(p.x * width, p.y * height, p.r * Math.min(width, height), p.spin, t);
    }
  }

  function vignette() {
    const v = ctx.createRadialGradient(
      width * 0.5,
      height * 0.5,
      width * 0.12,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.74
    );
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(5, 3, 12, 0.58)");
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
    drawLossSurface(t);
    drawAgents(t);
    drawNeuralNet(t);
    drawPortals(t);
    vignette();
    if (!reduceMotion) requestAnimationFrame(frame);
  }

  window.RickLab = {
    setAgentCount(count) {
      seedAgents(Number(count) || 18);
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
