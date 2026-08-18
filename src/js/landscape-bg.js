(() => {
  const canvas = document.getElementById("landscape-bg");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: false });
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const GRID = 96;
  const SPAN = 3.4;

  let width = 0;
  let height = 0;
  let heights = [];
  let zRange = { min: -1, max: 2 };
  let start = performance.now();
  let running = false;

  const HEIGHT_SCALE = 0.72;

  const BUMPS = [
    { x: 1.05, y: 0.35, a: 1.55, s: 0.11, px: 0.2, py: 1.1, dx: 0.9, dy: 1.3 },
    { x: -0.95, y: 0.75, a: 1.35, s: 0.13, px: 1.4, py: 0.4, dx: 1.1, dy: 0.8 },
    { x: 0.15, y: -0.95, a: 1.25, s: 0.12, px: 2.1, py: 1.8, dx: 0.7, dy: 1.0 },
    { x: -0.45, y: -0.35, a: 1.15, s: 0.14, px: 0.8, py: 2.3, dx: 1.2, dy: 0.6 },
    { x: 0.75, y: 1.05, a: 1.05, s: 0.1, px: 1.9, py: 0.9, dx: 0.85, dy: 1.15 },
    { x: -1.15, y: -0.85, a: 0.95, s: 0.11, px: 2.6, py: 1.5, dx: 1.05, dy: 0.95 },
    { x: 0.55, y: 0.05, a: 0.85, s: 0.09, px: 0.5, py: 2.0, dx: 0.75, dy: 1.25 },
    { x: -0.15, y: 0.55, a: 0.8, s: 0.1, px: 1.2, py: 0.6, dx: 1.0, dy: 0.7 },
    { x: 0.35, y: 0.85, a: -0.95, s: 0.28, px: 0.3, py: 1.4, dx: 0.6, dy: 0.9 },
    { x: -0.85, y: 0.05, a: -0.85, s: 0.32, px: 1.7, py: 2.2, dx: 0.8, dy: 1.1 },
    { x: 0.05, y: -0.45, a: -0.8, s: 0.26, px: 2.4, py: 0.5, dx: 0.95, dy: 0.75 },
    { x: 0.95, y: -0.15, a: -0.75, s: 0.24, px: 0.9, py: 1.6, dx: 1.15, dy: 0.85 },
    { x: -0.35, y: -0.95, a: -0.7, s: 0.3, px: 1.1, py: 2.8, dx: 0.7, dy: 1.05 },
    { x: -1.05, y: 0.45, a: -0.65, s: 0.27, px: 2.0, py: 1.0, dx: 0.9, dy: 0.65 },
    { x: 0.65, y: 0.45, a: -0.6, s: 0.22, px: 1.5, py: 0.2, dx: 1.0, dy: 0.8 },
  ];

  const BLEND_MS = 8500;
  const HOLD_MS = 11000;

  const CAMERA_TOUR = [
    { azimuth: 0.75, elevation: 0.55, zoomMul: 1.08 },
    { azimuth: 1.1, elevation: 0.48, zoomMul: 1.1 },
    { azimuth: 1.45, elevation: 0.38, zoomMul: 1.12 },
    { azimuth: 1.8, elevation: 0.3, zoomMul: 1.14 },
    { azimuth: 2.15, elevation: 0.24, zoomMul: 1.16 },
    { azimuth: 2.5, elevation: 0.16, zoomMul: 1.15 },
    { azimuth: 2.85, elevation: 0.06, zoomMul: 1.13 },
    { azimuth: 3.15, elevation: -0.1, zoomMul: 1.11 },
    { azimuth: 3.45, elevation: 0.02, zoomMul: 1.12 },
    { azimuth: 3.75, elevation: 0.18, zoomMul: 1.1 },
    { azimuth: 4.05, elevation: 0.32, zoomMul: 1.09 },
    { azimuth: 4.35, elevation: 0.44, zoomMul: 1.08 },
    { azimuth: 4.65, elevation: 0.52, zoomMul: 1.08 },
  ];

  let tourIndex = 0;

  const view = {
    azimuth: CAMERA_TOUR[0].azimuth,
    elevation: CAMERA_TOUR[0].elevation,
    zoomMul: CAMERA_TOUR[0].zoomMul,
    azimuthStart: CAMERA_TOUR[0].azimuth,
    elevationStart: CAMERA_TOUR[0].elevation,
    zoomMulStart: CAMERA_TOUR[0].zoomMul,
    azimuthTarget: CAMERA_TOUR[0].azimuth,
    elevationTarget: CAMERA_TOUR[0].elevation,
    zoomMulTarget: CAMERA_TOUR[0].zoomMul,
    holdUntil: 0,
    blendStart: 0,
    blending: false,
  };

  function easeInOutQuint(t) {
    return t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2;
  }

  function beginTransition(now) {
    view.azimuthStart = view.azimuth;
    view.elevationStart = view.elevation;
    view.zoomMulStart = view.zoomMul;

    tourIndex = (tourIndex + 1) % CAMERA_TOUR.length;
    const next = CAMERA_TOUR[tourIndex];

    if (tourIndex === 0) {
      view.azimuthTarget = CAMERA_TOUR[0].azimuth + Math.PI * 2;
    } else {
      view.azimuthTarget = next.azimuth;
    }
    view.elevationTarget = next.elevation;
    view.zoomMulTarget = next.zoomMul;
    view.blendStart = now;
    view.blending = true;
    view.holdUntil = now + BLEND_MS + HOLD_MS;
  }

  function updateViewSchedule(now) {
    if (reduceMotion) return;

    if (view.blending && now - view.blendStart >= BLEND_MS) {
      view.azimuth = view.azimuthTarget;
      view.elevation = view.elevationTarget;
      view.zoomMul = view.zoomMulTarget;
      if (tourIndex === 0) {
        view.azimuth = CAMERA_TOUR[0].azimuth;
      }
      view.blending = false;
    }

    if (now >= view.holdUntil) {
      beginTransition(now);
    }
  }

  function currentView(now) {
    if (reduceMotion) {
      return {
        azimuth: CAMERA_TOUR[0].azimuth,
        elevation: CAMERA_TOUR[0].elevation,
        zoomMul: CAMERA_TOUR[0].zoomMul,
      };
    }

    if (!view.blending) {
      return {
        azimuth: view.azimuth,
        elevation: view.elevation,
        zoomMul: view.zoomMul,
      };
    }

    const u = easeInOutQuint(Math.min(1, (now - view.blendStart) / BLEND_MS));
    return {
      azimuth: view.azimuthStart + (view.azimuthTarget - view.azimuthStart) * u,
      elevation: view.elevationStart + (view.elevationTarget - view.elevationStart) * u,
      zoomMul: view.zoomMulStart + (view.zoomMulTarget - view.zoomMulStart) * u,
    };
  }

  function toView(gx, gy, gz, azimuth, elevation) {
    const z = gz * HEIGHT_SCALE;
    const ca = Math.cos(azimuth);
    const sa = Math.sin(azimuth);
    const xr = gx * ca - gy * sa;
    const yr = gx * sa + gy * ca;
    const ce = Math.cos(elevation);
    const se = Math.sin(elevation);
    return [xr, z * ce + yr * se, yr * ce - z * se];
  }

  function fitScaleCap() {
    return Math.min(width, height) * 0.118;
  }

  function project(viewX, viewY, depth, zoomMul) {
    const scale = fitScaleCap() * zoomMul;
    return [width * 0.5 + viewX * scale, height * 0.54 - viewY * scale, depth];
  }

  function fractalNoise(x, y, phase) {
    let value = 0;
    let amp = 1;
    let freq = 1;
    let norm = 0;
    for (let o = 0; o < 6; o += 1) {
      value +=
        amp *
        Math.sin(x * freq * 1.73 + y * freq * 1.19 + phase) *
        Math.cos(y * freq * 2.07 - x * freq * 0.83 + phase * 0.7 + o);
      norm += amp;
      amp *= 0.48;
      freq *= 2.08;
    }
    return value / norm;
  }

  function ridgedNoise(x, y, phase) {
    let value = 0;
    let amp = 0.7;
    let freq = 1.35;
    for (let o = 0; o < 5; o += 1) {
      const n =
        Math.sin(x * freq + y * freq * 0.61 + phase * 0.5) *
        Math.cos(y * freq * 1.27 - x * freq * 0.94 + phase * 0.4 + o * 0.7);
      value += amp * (1 - Math.abs(n));
      amp *= 0.46;
      freq *= 2.15;
    }
    return value;
  }

  function microStructure(x, y, phase) {
    let sum = 0;
    for (let i = 0; i < 24; i += 1) {
      const px = -2.8 + (i % 6) * 1.05 + Math.sin(i * 1.7 + phase * 0.3) * 0.35;
      const py = -2.5 + Math.floor(i / 6) * 1.05 + Math.cos(i * 2.1 + phase * 0.25) * 0.35;
      const sign = i % 3 === 0 ? -1 : 1;
      const amp = sign * (0.22 + (i % 5) * 0.04);
      const s = 0.06 + (i % 4) * 0.015;
      const d2 = (x - px) ** 2 + (y - py) ** 2;
      sum += amp * Math.exp(-d2 / (2 * s * s));
    }
    return sum;
  }

  function surfaceHeight(x, y, time) {
    const phase = time * 0.0001;
    let z = 0;
    for (const b of BUMPS) {
      const bx = b.x + Math.sin(phase * b.dx + b.px) * 0.42;
      const by = b.y + Math.cos(phase * b.dy + b.py) * 0.42;
      const d2 = (x - bx) ** 2 + (y - by) ** 2;
      z += b.a * Math.exp(-d2 / (2 * b.s * b.s));
    }
    z += 0.42 * fractalNoise(x * 1.15 + phase * 0.55, y * 1.15 - phase * 0.4, phase);
    z += 0.38 * ridgedNoise(x * 1.05, y * 1.05, phase * 1.2);
    z += microStructure(x, y, phase);
    z += 0.18 * Math.tanh(fractalNoise(x * 2.2 + phase, y * 2.2 - phase * 0.6, phase * 1.4) * 3.4);
    return -z;
  }

  function heat(z) {
    const span = Math.max(zRange.max - zRange.min, 0.001);
    const t = Math.max(0, Math.min(1, (z - zRange.min) / span));
    const stops = [
      [0.0, [24, 36, 74]],
      [0.22, [30, 64, 175]],
      [0.42, [14, 165, 233]],
      [0.58, [52, 211, 153]],
      [0.72, [250, 204, 21]],
      [0.86, [249, 115, 22]],
      [1.0, [220, 38, 38]],
    ];
    for (let i = 0; i < stops.length - 1; i += 1) {
      const [a, ca] = stops[i];
      const [b, cb] = stops[i + 1];
      if (t >= a && t <= b) {
        const u = (t - a) / (b - a);
        return `rgb(${Math.round(ca[0] + (cb[0] - ca[0]) * u)}, ${Math.round(ca[1] + (cb[1] - ca[1]) * u)}, ${Math.round(ca[2] + (cb[2] - ca[2]) * u)})`;
      }
    }
    return "rgb(220, 38, 38)";
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
        const z = surfaceHeight(x, y, time);
        row.push(z);
        zRange.min = Math.min(zRange.min, z);
        zRange.max = Math.max(zRange.max, z);
      }
      heights.push(row);
    }
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
    updateHeights(0);
  }

  function drawBackdrop() {
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, "#070b16");
    g.addColorStop(0.55, "#0f172a");
    g.addColorStop(1, "#111827");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(width * 0.55, height * 0.18, 0, width * 0.55, height * 0.18, width * 0.45);
    glow.addColorStop(0, "rgba(56, 189, 248, 0.12)");
    glow.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  function drawSurface(time) {
    if (view.holdUntil === 0) view.holdUntil = time + HOLD_MS;
    updateViewSchedule(time);
    const { azimuth, elevation, zoomMul } = currentView(time);
    if (!reduceMotion) updateHeights(time);

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
            const [vx, vy, depth] = toView(x, y, z, azimuth, elevation);
            return project(vx, vy, depth, zoomMul);
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

  function drawLegend() {
    const x = width - 26;
    const top = height * 0.22;
    const h = height * 0.34;
    for (let i = 0; i < h; i += 1) {
      const z = zRange.max - (i / h) * (zRange.max - zRange.min);
      ctx.strokeStyle = heat(z);
      ctx.beginPath();
      ctx.moveTo(x, top + i);
      ctx.lineTo(x + 10, top + i);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(148, 163, 184, 0.75)";
    ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    ctx.fillText("high", x - 2, top + 10);
    ctx.fillText("loss", x - 2, top + 22);
    ctx.fillText("low", x + 1, top + h - 4);
  }

  function vignette() {
    const v = ctx.createRadialGradient(width * 0.5, height * 0.45, width * 0.1, width * 0.5, height * 0.5, Math.max(width, height) * 0.72);
    v.addColorStop(0, "rgba(7, 11, 22, 0)");
    v.addColorStop(1, "rgba(7, 11, 22, 0.55)");
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
    drawBackdrop();
    drawSurface(t);
    drawLegend();
    vignette();
    if (!reduceMotion) requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !reduceMotion && !running) {
      requestAnimationFrame(frame);
    }
  });

  resize();
  requestAnimationFrame(frame);
})();
