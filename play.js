const PROJECTS = {
  KLIO: {
    title: "Activity Log",
    year: "2026",
    description:
      "Various data visualization posters rendered via p5.js for Katelyn Lee is Online."
  },
  riso: {
    title: "Riso Animation + Flipbooks",
    year: "2025",
    description:
      "Blender animation rendered into a series of risograph-printed flipbooks."
  },
  wienerschnitzel: {
    title: "The Wiener Dog Hall of Fame by Wienerschnitzel",
    year: "2023",
    description: `
      Entered in the <em>Social Good Campaign</em> category of the
      16th Annual Shorty Awards.
      <a href="https://shortyawards.com/16th/the-wiener-dog-hall-of-fame"
         target="_blank" rel="noopener noreferrer">Read about it here.</a>`
  },
  hyundai: {
    title: "Hyundai E-bike",
    year: "2023",
    description:
      "3D renders and designs for a Hyundai E-bike which were part of a proposed OOH campaign and brand strategy."
  },
  touchdesigner: {
    title: "TouchDesigner Experiment",
    year: "2025",
    description:
      "An interactive visual experiment exploring feedback, distortion, motion, and responsive image-making."
  }
};

const ASSETS = [
  { src: "../assets/play/forgottoreply.mp4", group: "type" },
  { src: "../assets/play/ifyourereadingthis.mp4", group: "type" },
  { src: "../assets/play/mantra_finalcopy.mp4", group: "type" },
  { src: "../assets/play/0001-0060.mp4"},
  { src: "../assets/play/wishfulthinking.jpg"},

  { src: "../assets/play/poster_final.jpg", project: "KLIO", alt: "Activity log poster" },
  { src: "../assets/play/example_2.png", project: "KLIO", alt: "Activity log poster" },
  { src: "../assets/play/example_3.jpg", project: "KLIO", alt: "Activity log poster" },
  { src: "../assets/play/example_4.jpg", project: "KLIO", alt: "Activity log poster" },
  { src: "../assets/play/example_5.png", project: "KLIO", alt: "Activity log poster" },
  { src: "../assets/play/COVERS2.png", project: "KLIO", alt: "Activity log poster" },
  { src: "../assets/play/COVERS.png", project: "KLIO", alt: "Activity log poster" },

  { src: "../assets/play/princesssmoochygucci.jpg", project: "wienerschnitzel", alt: "Wiener Dog Hall of Fame portrait" },
  { src: "../assets/play/finn.jpg", project: "wienerschnitzel", alt: "Wiener Dog Hall of Fame portrait" },
  { src: "../assets/play/pennylane.jpg", project: "wienerschnitzel", alt: "Wiener Dog Hall of Fame portrait" },
  { src: "../assets/play/buddyblack.jpg", project: "wienerschnitzel", alt: "Wiener Dog Hall of Fame portrait" },
  { src: "../assets/play/WS_hof.jpg", project: "wienerschnitzel", alt: "Wiener Dog Hall of Fame portrait" },

  { src: "../assets/play/nopinkcopy.mp4", project: "riso", alt: "Animated risograph flipbook artwork" },
  { src: "../assets/play/flipbookscan2.jpg", project: "riso", alt: "Scan of the risograph-printed flipbook" },

  { src: "../assets/play/touchdesigner.mp4", project: "touchdesigner", alt: "TouchDesigner experiment" },
  { src: "../assets/play/04_leekatelyn.mp4"},

  { src: "../assets/play/hyundaiebike.mp4", project: "hyundai", alt: "Animated render of the Hyundai E-bike" },

  { comingSoon: true },
  { comingSoon: true }
];

function columnsFor(width) {
  if (width <= 480) return 2;
  if (width <= 768) return 3;
  if (width <= 1024) return 4;
  if (width <= 1600) return 5;
  return 6;
}

const ITEM_WIDTH = 0.62;
const STAGGER = 0.6;

const FRICTION = 0.9;     // 0–1, lower = stops sooner after a drag/flick
const OPEN_THRESHOLD = 6; // px of movement before a press counts as a drag, not a click

const WORLD_COLUMNS = 13;
const NEIGHBOUR_MARGIN = 0.6;
const REPEAT_MARGIN = 2.5;

const SEED = (Math.random() * 2 ** 32) >>> 0;

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(list, rand) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Deterministic 0–1 value for any (a, b) — same input, same output.
function hash2(a, b) {
  let h = SEED ^ Math.imul(a, 374761393) ^ Math.imul(b, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function groupOf(asset) {
  if (asset._group) return asset._group;
  if (asset.comingSoon) return (asset._group = "coming-soon");
  return (asset._group = asset.group || asset.project || asset.src);
}

let world = null; // one entry per unique column: { order, stagger }

function buildWorld() {
  const rand = mulberry32(SEED);
  const N = WORLD_COLUMNS;

  // Work in "column widths" so the mix doesn't depend on screen size
  const gapU = 1 - ITEM_WIDTH;
  const heightU = (a) => ITEM_WIDTH / (a.ratio || 1);
  let cycle = 0;
  for (const a of ASSETS) cycle += heightU(a) + gapU;

  const cols = new Array(N).fill(null);
  let tallest = 0;
  for (const a of ASSETS) tallest = Math.max(tallest, heightU(a));

  // A column plus two lookups that make neighbour checks fast:
  // where each asset sits, and the tiles' top edges in order
  function makeCol(items) {
    const pos = new Map();
    const tops = new Float64Array(items.length);
    for (let i = 0; i < items.length; i++) {
      pos.set(items[i].asset, items[i]);
      tops[i] = items[i].y0;
    }
    return { items, pos, tops };
  }

  // First index whose top edge is >= y
  function firstFrom(tops, y) {
    let lo = 0;
    let hi = tops.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tops[mid] < y) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  // Distance between two vertical ranges on a column that loops (negative = overlap)
  function distance(a0, a1, b0, b1) {
    const d0 = Math.max(b0 - a1, a0 - b1);
    const d1 = Math.max(b0 + cycle - a1, a0 - b1 - cycle);
    const d2 = Math.max(b0 - cycle - a1, a0 - b1 + cycle);
    return Math.min(d0, d1, d2);
  }

  const NEIGHBOURS = [
    // [column offset, same-asset penalty, same-group penalty]
    [-1, 1000, 150],
    [1, 1000, 150],
    [-2, 300, 10],
    [2, 300, 10],
    [-3, 80, 0],
    [3, 80, 0]
  ];

  // `placed` = tiles already in this column; only the first `count` are used
  function penalty(col, cand, y0, y1, placed, count = placed.length) {
    const g = groupOf(cand);
    let p = 0;

    // Same column: the few tiles right above
    for (let k = 1; k <= 3; k++) {
      const prev = placed[count - k];
      if (prev && groupOf(prev.asset) === g) p += 60 / k;
    }

    // Same column: the top of the column, which this one loops back to
    for (let k = 0; k < Math.min(3, count); k++) {
      const first = placed[k];
      if (groupOf(first.asset) === g && distance(y0, y1, first.y0, first.y1) < 1) p += 40;
    }

    // Nearby columns at about the same height
    for (const [dc, sameAsset, sameGroup] of NEIGHBOURS) {
      const other = cols[(((col + dc) % N) + N) % N];
      if (!other || other === cols[col]) continue;

      // Each asset appears once per column, so look it up directly
      const twin = other.pos.get(cand);
      if (twin) {
        // the closer a repeat is, the worse it scores
        const d = distance(y0, y1, twin.y0, twin.y1);
        if (d < REPEAT_MARGIN) p += sameAsset * (1 - Math.max(0, d) / REPEAT_MARGIN) + 20;
      }

      // Only look at the few tiles near this height (the column loops, so check
      // one loop above and below as well)
      if (!sameGroup) continue;
      for (let k = -1; k <= 1; k++) {
        const shift = k * cycle;
        const from = y0 - NEIGHBOUR_MARGIN - tallest - shift;
        const to = y1 + NEIGHBOUR_MARGIN - shift;
        for (let i = firstFrom(other.tops, from); i < other.items.length && other.tops[i] <= to; i++) {
          const it = other.items[i];
          if (it.asset === cand || groupOf(it.asset) !== g) continue;
          if (distance(y0, y1, it.y0, it.y1) < NEIGHBOUR_MARGIN) p += sameGroup;
        }
      }
    }

    return p;
  }

  function buildColumn(col) {
    const stagger = hash2(col, 7) * STAGGER;
    let best = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      const pool = shuffle(ASSETS, rand);
      const items = [];
      let y = stagger;
      let total = 0;

      while (pool.length) {
        let lowest = Infinity;
        let choices = [];

        for (let i = 0; i < pool.length; i++) {
          const h = heightU(pool[i]);
          const p = penalty(col, pool[i], y, y + h, items);
          if (p < lowest) {
            lowest = p;
            choices = [i];
          } else if (p === lowest) {
            choices.push(i);
          }
        }

        const asset = pool.splice(choices[Math.floor(rand() * choices.length)], 1)[0];
        const h = heightU(asset);
        items.push({ asset, y0: y, y1: y + h });
        y += h + gapU;
        total += lowest;
      }

      if (!best || total < best.total) best = { items, total, stagger };
      if (total === 0) break;
    }

    return improve(col, best);
  }

  // Lay out an order from the column's top, returning positioned items
  function place(order, stagger) {
    const items = [];
    let y = stagger;
    for (const asset of order) {
      const h = heightU(asset);
      items.push({ asset, y0: y, y1: y + h });
      y += h + gapU;
    }
    return items;
  }

  // The column loops: its last tiles sit right above its first ones
  function wrapPenalty(items) {
    const n = items.length;
    let p = 0;
    for (let k = 1; k <= 2; k++) {
      if (groupOf(items[n - k].asset) === groupOf(items[0].asset)) p += 60 / k;
    }
    return p;
  }

  // Second pass: keep swapping tiles while it makes the mix better.
  // A swap only moves the tiles between the two swapped spots, so only
  // those (and the few just below) are re-scored.
  function improve(col, best) {
    const stagger = best.stagger;
    const n = best.items.length;
    let order = best.items.map((it) => it.asset);
    let items = place(order, stagger);
    let pen = items.map((it, m) => penalty(col, it.asset, it.y0, it.y1, items, m));
    let current = pen.reduce((s, v) => s + v, 0) + wrapPenalty(items);
    let stall = 0;

    for (let step = 0; step < 2500 && current > 0 && stall < 400; step++) {
      const i = Math.floor(rand() * n);
      // mostly swap nearby tiles (small change), sometimes anywhere
      const j = rand() < 0.6 ? (i + 1 + Math.floor(rand() * 4)) % n : Math.floor(rand() * n);
      if (i === j) continue;

      const next = order.slice();
      [next[i], next[j]] = [next[j], next[i]];
      const nextItems = place(next, stagger);
      const nextPen = pen.slice();

      const lo = Math.min(i, j) < 3 ? 0 : Math.min(i, j);
      const hi = Math.min(n - 1, Math.max(i, j) + 3);
      for (let m = lo; m <= hi; m++) {
        const it = nextItems[m];
        nextPen[m] = penalty(col, it.asset, it.y0, it.y1, nextItems, m);
      }

      const s = nextPen.reduce((sum, v) => sum + v, 0) + wrapPenalty(nextItems);
      if (s < current) stall = 0;
      else stall++;

      if (s <= current) {
        order = next;
        items = nextItems;
        pen = nextPen;
        current = s;
      }
    }

    const result = makeCol(items);
    result.stagger = stagger;
    return result;
  }

  for (let c = 0; c < N; c++) cols[c] = buildColumn(c);

  world = cols.map((c) => ({ order: c.items.map((it) => it.asset), stagger: c.stagger }));
}

const wrapCol = (col) => ((col % WORLD_COLUMNS) + WORLD_COLUMNS) % WORLD_COLUMNS;

function orderFor(col) {
  return world[wrapCol(col)].order;
}

/* =========================================================
   HELPERS
   ========================================================= */

const isVideo = (src) => /\.(mp4|webm|mov)$/i.test(src || "");

function fileName(src) {
  try {
    return decodeURIComponent(src.split("/").pop());
  } catch {
    return src.split("/").pop();
  }
}

function infoFor(asset) {
  const project = PROJECTS[asset.project] || {};
  return {
    title: asset.projectTitle || project.title || "",
    year: asset.year || project.year || "",
    description:
      asset.description !== undefined ? asset.description : project.description || ""
  };
}

// Only videos actually on screen play; the rest pause so they don't decode
const videoWatcher = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) e.target.play().catch(() => {});
        else e.target.pause();
      }
    })
  : null;

function createMedia(asset, w, h) {
  let el;

  if (isVideo(asset.src)) {
    el = document.createElement("video");
    el.src = asset.src;
    el.muted = true;
    el.autoplay = true;
    el.loop = true;
    el.playsInline = true;
    el.setAttribute("muted", "");
    el.setAttribute("playsinline", "");
    el.setAttribute("aria-label", asset.alt || "");
  } else {
    el = document.createElement("img");
    el.src = asset.src;
    el.alt = asset.alt || "";
    el.decoding = "async";
  }

  el.draggable = false;
  el.className = "pg-media";
  if (w) el.style.width = `${w}px`;
  if (h) el.style.height = `${h}px`;

  // Grid tiles (which get a size) play only while visible
  if (w && videoWatcher && el.tagName === "VIDEO") {
    el.autoplay = false;
    videoWatcher.observe(el);
  }
  return el;
}

/* Measure every asset's aspect ratio once, before the first render.
   You can skip the measuring for an asset by giving it `ratio: width / height`.
   Measured ratios are remembered in the visitor's browser, so repeat visits
   don't have to wait for any files before the grid appears. */
const RATIO_CACHE_KEY = "play-ratios-v1";
let ratioCache = {};
try {
  ratioCache = JSON.parse(localStorage.getItem(RATIO_CACHE_KEY) || "{}") || {};
} catch {
  ratioCache = {};
}

function saveRatios() {
  try {
    localStorage.setItem(RATIO_CACHE_KEY, JSON.stringify(ratioCache));
  } catch {
    /* private mode etc. — just measure again next time */
  }
}

function measure(asset) {
  if (asset.comingSoon) return Promise.resolve((asset.ratio = asset.ratio || 1));
  if (asset.ratio) return Promise.resolve(asset.ratio);
  if (ratioCache[asset.src]) return Promise.resolve((asset.ratio = ratioCache[asset.src]));

  return new Promise((resolve) => {
    let done = false;
    const finish = (w, h) => {
      if (done) return;
      done = true;
      asset.ratio = w && h ? w / h : 1;
      if (w && h) ratioCache[asset.src] = +asset.ratio.toFixed(4);
      resolve(asset.ratio);
    };

    if (isVideo(asset.src)) {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.muted = true;
      v.onloadedmetadata = () => finish(v.videoWidth, v.videoHeight);
      v.onerror = () => finish(0, 0);
      v.src = asset.src;
    } else {
      const img = new Image();
      img.onload = () => finish(img.naturalWidth, img.naturalHeight);
      img.onerror = () => finish(0, 0);
      img.src = asset.src;

      // Big GIFs: grab the size as soon as the header is in, don't wait for every frame
      const poll = setInterval(() => {
        if (done) return clearInterval(poll);
        if (img.naturalWidth) {
          clearInterval(poll);
          finish(img.naturalWidth, img.naturalHeight);
        }
      }, 50);
    }

    setTimeout(() => finish(0, 0), 6000); // give up → square
  });
}

/* =========================================================
   GRID RENDERING (only what's on screen exists in the DOM)
   ========================================================= */

const viewport = document.getElementById("pg-viewport");
const stage = document.getElementById("pg-stage");

const live = new Map(); // "col,repeat,index" → element
let layout = null;
let offX = 0;
let offY = 0;
let velX = 0;
let velY = 0;
let frame = null;
let dragging = false;

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function computeLayout() {
  const W = window.innerWidth;
  const pitch = W / columnsFor(W);            // column width incl. gap
  const itemW = Math.round(pitch * ITEM_WIDTH);
  const gap = pitch - itemW;                   // same gap vertically

  // Heights are the same for every column, only the order differs
  const heights = new Map(ASSETS.map((a) => [a, Math.round(itemW / (a.ratio || 1))]));
  let cycle = 0;
  for (const h of heights.values()) cycle += h + gap;

  return { pitch, itemW, gap, heights, cycle, prefix: new Map() };
}

// Running y offsets for one column's order (cached per unique column)
function prefixFor(col) {
  const wc = wrapCol(col);
  let p = layout.prefix.get(wc);
  if (!p) {
    p = [];
    let y = 0;
    for (const asset of orderFor(wc)) {
      p.push(y);
      y += layout.heights.get(asset) + layout.gap;
    }
    layout.prefix.set(wc, p);
  }
  return p;
}

function makeTile(asset, w, h) {
  const item = document.createElement("div");
  item.className = "pg-item";
  item.style.width = `${w}px`;
  item.style.height = `${h}px`;
  item._asset = asset;

  const figure = document.createElement("figure");
  figure.className = "pg-frame";

  if (asset.comingSoon) {
    item.classList.add("is-soon");
    const soon = document.createElement("div");
    soon.className = "pg-soon";
    soon.style.width = `${w}px`;
    soon.style.height = `${h}px`;
    soon.style.fontSize = `${Math.min(w, h) * 0.72}px`;
    soon.textContent = "?";
    soon.setAttribute("aria-hidden", "true");
    figure.append(soon);
  } else {
    figure.append(createMedia(asset, w, h));
  }

  const label = document.createElement("span");
  label.className = "pg-label";
  label.textContent = asset.comingSoon
    ? asset.title || "Coming soon"
    : asset.title || fileName(asset.src);
  figure.append(label);

  item.append(figure);
  return item;
}

function render() {
  if (!layout) return;

  const W = window.innerWidth;
  const H = window.innerHeight;
  const { pitch, itemW, gap, heights, cycle } = layout;
  // Tiles are created a little before they scroll into view, and kept a while
  // after they leave, so they aren't rebuilt every time they cross the edge
  const pad = 250;
  const keep = 700;
  const seen = new Set();

  const c0 = Math.floor((-offX - keep) / pitch);
  const c1 = Math.floor((-offX + W + keep) / pitch);

  // The whole stage moves in one go; tiles keep fixed spots inside it
  stage.style.transform = `translate3d(${offX}px, ${offY}px, 0)`;

  for (let col = c0; col <= c1; col++) {
    const x = col * pitch + gap / 2;          // position inside the stage
    const colY = world[wrapCol(col)].stagger * pitch;
    const colTop = colY + offY;
    const order = orderFor(col);
    const prefix = prefixFor(col);

    const colLeft = x + offX;
    const colNear = colLeft + itemW > -pad && colLeft < W + pad;

    const r0 = Math.floor((-keep - colTop) / cycle) - 1;
    const r1 = Math.floor((H + keep - colTop) / cycle);

    for (let r = r0; r <= r1; r++) {
      for (let i = 0; i < order.length; i++) {
        const asset = order[i];
        const h = heights.get(asset);
        const top = colTop + r * cycle + prefix[i];

        if (top > H + keep || top + h < -keep) continue;

        const key = `${col},${r},${i}`;
        const exists = live.has(key);
        const near = colNear && top < H + pad && top + h > -pad;
        if (!exists && !near) continue;
        seen.add(key);

        if (!exists) {
          const el = makeTile(asset, itemW, h);
          el.style.transform = `translate(${x}px, ${top - offY}px)`;
          stage.append(el);
          live.set(key, el);
        }
      }
    }
  }

  for (const [key, el] of live) {
    if (!seen.has(key)) {
      const v = el.querySelector("video");
      if (v && videoWatcher) videoWatcher.unobserve(v);
      el.remove();
      live.delete(key);
    }
  }
}

function loop() {
  frame = null;

  if (!dragging && (Math.abs(velX) > 0.1 || Math.abs(velY) > 0.1)) {
    offX += velX;
    offY += velY;
    velX *= FRICTION;
    velY *= FRICTION;
    frame = requestAnimationFrame(loop);
  } else if (!dragging) {
    velX = 0;
    velY = 0;
  }

  render();
}

function requestRender() {
  if (!frame) frame = requestAnimationFrame(loop);
}

function rebuild() {
  if (!layout) return;
  const oldPitch = layout.pitch;
  layout = computeLayout();

  // Keep roughly the same spot in view after a resize
  offX *= layout.pitch / oldPitch;
  offY *= layout.pitch / oldPitch;

  for (const el of live.values()) {
    const v = el.querySelector("video");
    if (v && videoWatcher) videoWatcher.unobserve(v);
    el.remove();
  }
  live.clear();
  render();
}

/* =========================================================
   INPUT — wheel / trackpad, drag, touch, keyboard
   Movement always settles to a stop; nothing drifts on its own.
   ========================================================= */

viewport.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    if (isOpen()) return;

    let dx = event.deltaX;
    let dy = event.deltaY;

    if (event.deltaMode === 1) {
      dx *= 16;
      dy *= 16;
    }

    // Shift + mouse wheel scrolls sideways
    if (event.shiftKey && !dx) {
      dx = dy;
      dy = 0;
    }

    velX = 0;
    velY = 0;
    offX -= dx;
    offY -= dy;
    requestRender();
  },
  { passive: false }
);

let press = null;

viewport.addEventListener("pointerdown", (event) => {
  if (event.button !== 0 || isOpen()) return;

  press = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    lastX: event.clientX,
    lastY: event.clientY,
    lastT: performance.now(),
    moved: 0,
    item: event.target.closest(".pg-item")
  };

  dragging = true;
  velX = 0;
  velY = 0;
  viewport.setPointerCapture(event.pointerId);
});

viewport.addEventListener("pointermove", (event) => {
  if (!press || event.pointerId !== press.id) return;

  const now = performance.now();
  const dx = event.clientX - press.lastX;
  const dy = event.clientY - press.lastY;
  const dt = Math.max(1, now - press.lastT);

  press.moved += Math.abs(dx) + Math.abs(dy);
  if (press.moved > OPEN_THRESHOLD) viewport.classList.add("is-dragging");

  offX += dx;
  offY += dy;

  // Smoothed velocity in px per frame (~16ms) for the release flick
  velX = velX * 0.6 + (dx / dt) * 16 * 0.4;
  velY = velY * 0.6 + (dy / dt) * 16 * 0.4;

  press.lastX = event.clientX;
  press.lastY = event.clientY;
  press.lastT = now;

  requestRender();
});

function endPress(event) {
  if (!press || event.pointerId !== press.id) return;

  const { moved, item, lastT } = press;
  press = null;
  dragging = false;
  viewport.classList.remove("is-dragging");

  if (moved <= OPEN_THRESHOLD) {
    velX = 0;
    velY = 0;
    if (item && event.type === "pointerup") openAsset(item._asset);
    return;
  }

  // If the pointer paused before release, don't flick
  if (reduceMotion || performance.now() - lastT > 80) {
    velX = 0;
    velY = 0;
  }

  requestRender();
}

viewport.addEventListener("pointerup", endPress);
viewport.addEventListener("pointercancel", endPress);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAsset();
    return;
  }

  if (isOpen()) return;

  const push = 22;
  if (event.key === "ArrowLeft") velX = push;
  else if (event.key === "ArrowRight") velX = -push;
  else if (event.key === "ArrowUp") velY = push;
  else if (event.key === "ArrowDown") velY = -push;
  else return;

  event.preventDefault();
  requestRender();
});

let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(rebuild, 120);
});

/* =========================================================
   OVERLAY
   With description → info panel on the left + centered media (Frame 5)
   Without          → centered media only (Frame 6)
   Same project, more than one asset → carousel: click the left/right
   half (or use the arrows / arrow keys) to step through the project
   Coming soon      → not clickable
   ========================================================= */

const overlay = document.getElementById("pg-overlay");
const panelYear = document.getElementById("pg-panel-year");
const panelTitle = document.getElementById("pg-panel-title");
const panelDesc = document.getElementById("pg-panel-desc");
const lightboxFrame = document.getElementById("pg-lightbox-frame");
const countEl = document.getElementById("pg-count");
const prevZone = document.getElementById("pg-prev-zone");
const nextZone = document.getElementById("pg-next-zone");
const prevBtn = document.getElementById("pg-prev");
const nextBtn = document.getElementById("pg-next");
const carouselCursor = document.getElementById("pg-carousel-cursor");

let slides = [];
let slideIndex = 0;
let slideTimer = null;

function isOpen() {
  return !overlay.hidden;
}

// Every asset in the same project, in the order they're listed in ASSETS
function slidesFor(asset) {
  if (!asset.project) return [asset];
  const list = ASSETS.filter((a) => a.project === asset.project && !a.comingSoon);
  return list.length ? list : [asset];
}

function showPanel(asset) {
  const info = infoFor(asset);
  const hasInfo = Boolean(info.description && info.description.trim());

  overlay.classList.toggle("has-info", hasInfo);
  panelYear.textContent = hasInfo ? info.year : "";
  panelTitle.textContent = hasInfo ? info.title : "";
  panelDesc.innerHTML = hasInfo ? info.description : "";
}

function showSlide(index, fade = true) {
  slideIndex = (index + slides.length) % slides.length;
  const asset = slides[slideIndex];

  const swap = () => {
    lightboxFrame.querySelector(".pg-media")?.remove();
    lightboxFrame.prepend(createMedia(asset));
    countEl.textContent = `${slideIndex + 1} / ${slides.length}`;
    showPanel(asset);
    requestAnimationFrame(() => lightboxFrame.classList.remove("is-loading"));
  };

  clearTimeout(slideTimer);
  if (!fade) return swap();

  lightboxFrame.classList.add("is-loading");
  slideTimer = setTimeout(swap, 120);

  // Warm up the one after, so stepping through feels instant
  const upcoming = slides[(slideIndex + 1) % slides.length];
  if (upcoming && !isVideo(upcoming.src)) new Image().src = upcoming.src;
}

const nextSlide = () => slides.length > 1 && showSlide(slideIndex + 1);
const prevSlide = () => slides.length > 1 && showSlide(slideIndex - 1);

function openAsset(asset) {
  if (!asset || asset.comingSoon) return;

  slides = slidesFor(asset);
  overlay.classList.toggle("is-carousel", slides.length > 1);
  showSlide(Math.max(0, slides.indexOf(asset)), false);

  overlay.hidden = false;
  document.body.classList.add("pg-is-open");
  requestAnimationFrame(() => overlay.classList.add("is-visible"));

  if (asset.project) history.replaceState(null, "", `#${asset.project}`);
}

function closeAsset() {
  if (!isOpen()) return;

  hideCursor();
  overlay.classList.remove("is-visible");
  document.body.classList.remove("pg-is-open");
  history.replaceState(null, "", window.location.pathname);

  setTimeout(() => {
    overlay.hidden = true;
    lightboxFrame.querySelector(".pg-media")?.remove();
  }, 150);
}

/* ---------- carousel controls ---------- */

prevZone.addEventListener("click", prevSlide);
nextZone.addEventListener("click", nextSlide);
prevBtn.addEventListener("click", prevSlide);
nextBtn.addEventListener("click", nextSlide);

// The pointing-hand cursor that follows the mouse over each half
function moveCursor(event) {
  carouselCursor.style.left = `${event.clientX}px`;
  carouselCursor.style.top = `${event.clientY}px`;
}

function showCursor(direction, event) {
  if (window.innerWidth <= 768) return;
  carouselCursor.textContent = direction === "left" ? "☜" : "☞";
  moveCursor(event);
  carouselCursor.classList.add("is-visible");
}

function hideCursor() {
  carouselCursor.classList.remove("is-visible");
}

prevZone.addEventListener("mouseenter", (e) => showCursor("left", e));
nextZone.addEventListener("mouseenter", (e) => showCursor("right", e));
prevZone.addEventListener("mousemove", moveCursor);
nextZone.addEventListener("mousemove", moveCursor);
prevZone.addEventListener("mouseleave", hideCursor);
nextZone.addEventListener("mouseleave", hideCursor);

document.addEventListener("keydown", (event) => {
  if (!isOpen()) return;
  if (event.key === "ArrowRight") nextSlide();
  else if (event.key === "ArrowLeft") prevSlide();
});

overlay.addEventListener("click", (event) => {
  if (event.target.closest(".pg-close")) {
    closeAsset();
    return;
  }

  // Carousel clicks are handled above
  if (event.target.closest(".pg-zone, .pg-carousel-footer")) return;

  // Click on the dimmed background (not the media or the panel) closes
  if (!event.target.closest(".pg-media, .pg-panel")) closeAsset();
});

/* =========================================================
   START
   ========================================================= */

// Measure every asset's proportions, then lay out the grid
Promise.all(ASSETS.map(measure)).then(() => {
  saveRatios();
  buildWorld();
  layout = computeLayout();

  // Start a little inset so the first column isn't flush with the edge
  offX = -layout.pitch * 0.25;
  offY = layout.gap;

  render();
  viewport.classList.add("is-ready");
});

// Old links like /play/#KLIO open that project's first asset
const requested = window.location.hash.slice(1);
if (PROJECTS[requested]) {
  openAsset(ASSETS.find((a) => a.project === requested));
}