/* ===========================================================
   Interactive project visuals. Vanilla JS + canvas, no deps.
   Each canvas reacts to hover / click. 195x138 white tiles.
   =========================================================== */
(function () {
  "use strict";
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var items = [];

  // White-background palette (all chosen for contrast on #fff)
  var BLU = "#2b7fff", GRN = "#0ea36b", AMB = "#e08a00",
      PNK = "#e0447a", PUR = "#8a4dff";
  var INK = "rgba(30,41,59,.75)";       // labels
  var FAINT = "rgba(100,116,139,.35)";  // structural lines
  var DIMNODE = "#94a3b8";

  function setup(c) {
    var r = c.getBoundingClientRect();
    var w = Math.round(r.width) || 195;
    var h = Math.round(r.height) || 138;
    c.width = w * DPR;
    c.height = h * DPR;
    var ctx = c.getContext("2d");
    ctx.scale(DPR, DPR);
    return { ctx: ctx, w: w, h: h };
  }

  function track(c) {
    var m = { x: -999, y: -999, over: false, clicks: 0 };
    c.addEventListener("mousemove", function (e) {
      var r = c.getBoundingClientRect();
      m.x = e.clientX - r.left;
      m.y = e.clientY - r.top;
    });
    c.addEventListener("mouseenter", function () { m.over = true; });
    c.addEventListener("mouseleave", function () { m.over = false; m.x = -999; m.y = -999; });
    c.addEventListener("click", function () { m.clicks++; });
    return m;
  }

  function reg(id, draw, init) {
    var c = document.getElementById(id);
    if (!c) return;
    var s = setup(c);
    var m = track(c);
    var st = init ? init(s.w, s.h) : {};
    items.push({ ctx: s.ctx, w: s.w, h: s.h, m: m, st: st, draw: draw });
  }

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ---------- 1. DNA BERT: rotating double helix + masked base ---------- */
  function dna(ctx, w, h, t, m) {
    ctx.clearRect(0, 0, w, h);
    var cy = h / 2, amp = h * 0.30, N = 13;
    var mL = 12, step = (w - 2 * mL) / (N - 1);
    var speed = m.over ? 2.2 : 1.0;
    var ph = t * speed;
    var cols = [BLU, PNK, GRN, AMB];
    var bases = ["A", "T", "C", "G"]; // pretrained vocabulary = nucleotides, not English
    var hoverI = m.over ? Math.round((m.x - mL) / step) : -1;
    var maskI = Math.floor(t * 1.1) % N;

    // strands
    for (var s = 0; s < 2; s++) {
      ctx.beginPath();
      for (var x = 0; x <= w; x += 3) {
        var a = ph + (x - mL) * 0.09 + (s ? Math.PI : 0);
        var y = cy + amp * Math.sin(a);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = s ? "rgba(138,77,255,.5)" : "rgba(43,127,255,.5)";
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
    // rungs + nodes
    for (var i = 0; i < N; i++) {
      var xi = mL + i * step;
      var ai = ph + (xi - mL) * 0.09;
      var y1 = cy + amp * Math.sin(ai), y2 = cy - amp * Math.sin(ai);
      var depth = (Math.cos(ai) + 1) / 2;
      ctx.globalAlpha = 0.4 + depth * 0.6;
      if (i === maskI) {
        ctx.setLineDash([2, 2]);
        ctx.strokeStyle = "#1f2a44";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(xi, y1); ctx.lineTo(xi, y2); ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = cols[i % 4];
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(xi, y1); ctx.lineTo(xi, y2); ctx.stroke();
      }
      var r = i === hoverI ? 3.2 : 2;
      ctx.fillStyle = i === maskI ? "#1f2a44" : cols[i % 4];
      ctx.beginPath(); ctx.arc(xi, y1, r, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(xi, y2, r, 0, 7); ctx.fill();
      // nucleotide letter on the top strand (ATCG token, "?" when masked)
      ctx.globalAlpha = 1;
      ctx.font = "bold 7px monospace";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = i === maskI ? "#1f2a44" : cols[i % 4];
      ctx.fillText(i === maskI ? "?" : bases[i % 4], xi, y1 + (y1 <= cy ? -7 : 9));
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = INK;
    ctx.font = "8px monospace";
    ctx.fillText(m.over ? "[MASK] → " + bases[maskI % 4] : "vocab: A T C G", mL, h - 6);
  }

  /* ---------- 2. Memory Cycle: knowledge-graph retrieval ---------- */
  function graphInit(w, h) {
    var P = [
      [0.20, 0.30], [0.45, 0.20], [0.72, 0.28], [0.85, 0.55],
      [0.62, 0.55], [0.35, 0.55], [0.18, 0.72], [0.50, 0.80], [0.80, 0.80]
    ];
    var E = [[0, 1], [1, 2], [2, 3], [1, 4], [4, 5], [5, 0], [5, 6], [4, 7], [7, 6], [7, 8], [8, 3], [4, 8]];
    var nodes = P.map(function (p, i) { return { x: p[0] * w, y: p[1] * h, s: i * 1.7 }; });
    return { nodes: nodes, E: E };
  }
  function graph(ctx, w, h, t, m, st) {
    ctx.clearRect(0, 0, w, h);
    var nodes = st.nodes, E = st.E;
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].dx = nodes[i].x + Math.sin(t * 0.9 + nodes[i].s) * 2.2;
      nodes[i].dy = nodes[i].y + Math.cos(t * 0.8 + nodes[i].s) * 2.2;
    }
    // nearest node to cursor = "query"
    var sel = -1, best = 1e9;
    if (m.over) for (var j = 0; j < nodes.length; j++) {
      var d = Math.hypot(nodes[j].dx - m.x, nodes[j].dy - m.y);
      if (d < best) { best = d; sel = j; }
    }
    if (sel < 0) sel = Math.floor(t * 0.6) % nodes.length; // auto-pulse
    var nb = {};
    E.forEach(function (e) { if (e[0] === sel) nb[e[1]] = 1; if (e[1] === sel) nb[e[0]] = 1; });

    E.forEach(function (e) {
      var a = nodes[e[0]], b = nodes[e[1]];
      var hot = e[0] === sel || e[1] === sel;
      ctx.strokeStyle = hot ? "rgba(14,163,107,.85)" : "rgba(100,116,139,.3)";
      ctx.lineWidth = hot ? 1.6 : 0.9;
      ctx.beginPath(); ctx.moveTo(a.dx, a.dy); ctx.lineTo(b.dx, b.dy); ctx.stroke();
    });
    nodes.forEach(function (n, i) {
      var hot = i === sel, near = nb[i];
      ctx.fillStyle = hot ? GRN : near ? "#7fb3ff" : DIMNODE;
      ctx.beginPath(); ctx.arc(n.dx, n.dy, hot ? 5 : near ? 3.6 : 2.6, 0, 7); ctx.fill();
      if (hot) {
        ctx.strokeStyle = "rgba(14,163,107,.5)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(n.dx, n.dy, 7 + Math.sin(t * 4) * 1.5, 0, 7); ctx.stroke();
      }
    });
    ctx.fillStyle = INK; ctx.font = "8px monospace";
    ctx.fillText(m.over ? "retrieve" : "knowledge graph", 8, h - 6);
  }

  /* ---------- 3. FAMNet: Mixture-of-Experts routing ---------- */
  function moeInit(w, h) {
    var ex = [];
    for (var i = 0; i < 4; i++) ex.push({ x: w - 30, y: 14 + i * 19, wt: 0.25 });
    return { ex: ex, sel: 0, cyc: 0 };
  }
  function moe(ctx, w, h, t, m, st) {
    ctx.clearRect(0, 0, w, h);
    var inx = 12, iny = h / 2, rx = w * 0.44, ry = h / 2;
    var cyc = Math.floor(t / 1.5);
    if (cyc !== st.cyc) { // new gating each cycle
      st.cyc = cyc;
      var ws = st.ex.map(function () { return Math.random(); });
      var sum = ws.reduce(function (a, b) { return a + b; }, 0);
      st.ex.forEach(function (e, i) { e.wt = ws[i] / sum; });
      st.sel = ws.indexOf(Math.max.apply(null, ws));
    }
    // hover overrides routing
    var hovE = -1;
    st.ex.forEach(function (e, i) { if (m.over && m.x > e.x - 4 && Math.abs(m.y - (e.y + 6)) < 9) hovE = i; });
    var target = hovE >= 0 ? hovE : st.sel;
    var prog = (t / 1.5) % 1; // 0..1 within cycle

    // input node
    ctx.fillStyle = BLU;
    ctx.beginPath(); ctx.arc(inx, iny, 4, 0, 7); ctx.fill();
    // router
    ctx.strokeStyle = "rgba(30,41,59,.3)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(inx, iny); ctx.lineTo(rx, ry); ctx.stroke();
    ctx.fillStyle = AMB;
    rr(ctx, rx - 6, ry - 6, 12, 12, 3); ctx.fill();
    // experts + gating bars + routed lines
    st.ex.forEach(function (e, i) {
      var on = i === target;
      ctx.strokeStyle = on ? "rgba(14,163,107,.85)" : "rgba(100,116,139,.28)";
      ctx.lineWidth = on ? 1.6 : 0.8;
      ctx.beginPath(); ctx.moveTo(rx + 6, ry); ctx.lineTo(e.x, e.y + 6); ctx.stroke();
      ctx.fillStyle = on ? GRN : "#cbd5e1";
      rr(ctx, e.x, e.y, 20, 12, 3); ctx.fill();
      ctx.fillStyle = "rgba(30,41,59,.55)";
      ctx.fillRect(e.x + 2, e.y + 9, 16 * e.wt, 2); // gating weight
    });
    // travelling token
    var px, py;
    if (prog < 0.5) { var k = prog / 0.5; px = lerp(inx, rx, k); py = lerp(iny, ry, k); }
    else { var k2 = (prog - 0.5) / 0.5; var e2 = st.ex[target]; px = lerp(rx, e2.x, k2); py = lerp(ry, e2.y + 6, k2); }
    ctx.fillStyle = "#1f2a44";
    ctx.beginPath(); ctx.arc(px, py, 2.5, 0, 7); ctx.fill();
    ctx.fillStyle = INK; ctx.font = "8px monospace";
    ctx.fillText(m.over ? "route" : "MoE gating", 8, h - 5);
  }

  /* ---------- 4. Sign Language Translation ----------
     Hand signs emit content words (blue, "pop" in); an LLM then fills the
     grammar/function words (purple italic, "fade-rise" in) to form a sentence. */
  var SIGN_COL = BLU, LLM_COL = PUR;
  var SIGN_FONT = "bold 9px monospace", LLM_FONT = "italic 9px monospace";
  function handInit() {
    var poses = [   // curl per [thumb, index, middle, ring, pinky]
      [0.05, 0.0, 0.0, 0.0, 0.0], // open
      [0.6, 1.0, 1.0, 1.0, 1.0],  // fist
      [0.8, 0.0, 0.0, 1.0, 1.0],  // peace
      [0.8, 0.0, 1.0, 1.0, 1.0],  // point
      [0.0, 1.0, 1.0, 1.0, 1.0]   // thumbs-up-ish
    ];
    var rest = [0.05, 0, 0, 0, 0];
    // Final sentence: sign tokens carry a hand pose; llm tokens are grammar fill.
    var final = [
      { w: "Hello,", src: "sign", pose: 0 },
      { w: "it's", src: "llm" },
      { w: "nice", src: "sign", pose: 2 },
      { w: "to", src: "llm" },
      { w: "meet", src: "sign", pose: 3 },
      { w: "you", src: "sign", pose: 4 },
      { w: "today.", src: "sign", pose: 1 }
    ];
    var signIdx = [], llmIdx = [];
    final.forEach(function (tk, i) { (tk.src === "sign" ? signIdx : llmIdx).push(i); });
    return {
      poses: poses, rest: rest, final: final,
      numSign: signIdx.length,
      order: signIdx.concat(llmIdx), // reveal signs first, then grammar
      cur: rest.slice(), poseTgt: rest, gen: 0, at: {}, stepT: 0, lastClick: 0
    };
  }
  function finger(ctx, bx, by, ang, segs, curl, col) {
    var x = bx, y = by, a = ang, pts = [[x, y]];
    for (var k = 0; k < segs.length; k++) {
      a += curl * 0.6; // curl bends inward
      x += segs[k] * Math.cos(a);
      y += segs[k] * Math.sin(a);
      pts.push([x, y]);
    }
    ctx.strokeStyle = "rgba(100,116,139,.6)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (var p = 1; p < pts.length; p++) ctx.lineTo(pts[p][0], pts[p][1]);
    ctx.stroke();
    ctx.fillStyle = col;
    for (var q = 0; q < pts.length; q++) { ctx.beginPath(); ctx.arc(pts[q][0], pts[q][1], 2, 0, 7); ctx.fill(); }
    return pts;
  }
  // Lay out the whole sentence (centered, wrapped); returns {index: {x,y}}.
  function layoutTokens(ctx, final, cx, bottomY, maxW) {
    ctx.font = "9px monospace";
    var space = ctx.measureText(" ").width;
    var lines = [[]], lineW = [0];
    final.forEach(function (tk, i) {
      ctx.font = tk.src === "sign" ? SIGN_FONT : LLM_FONT;
      var wWidth = ctx.measureText(tk.w).width;
      var li = lines.length - 1;
      var add = (lines[li].length ? space : 0) + wWidth;
      if (lineW[li] + add > maxW && lines[li].length) { lines.push([]); lineW.push(0); li++; add = wWidth; }
      lines[li].push({ i: i, w: wWidth }); lineW[li] += add;
    });
    var lh = 12, startY = bottomY - (lines.length - 1) * lh, pos = {};
    lines.forEach(function (line, li) {
      var x = cx - lineW[li] / 2, y = startY + li * lh;
      line.forEach(function (it, ti) {
        if (ti > 0) x += space;
        pos[it.i] = { x: x, y: y };
        x += it.w;
      });
    });
    return pos;
  }
  function easeOut(p) { p = p < 0 ? 0 : p > 1 ? 1 : p; return 1 - Math.pow(1 - p, 3); }
  function hand(ctx, w, h, t, m, st) {
    ctx.clearRect(0, 0, w, h);
    var nSteps = st.order.length, interval = m.over ? 0.9 : 1.6, holdTime = 2.4;

    function step() {
      var ti = st.order[st.gen];
      st.at[ti] = t;
      var tk = st.final[ti];
      st.poseTgt = tk.src === "sign" ? st.poses[tk.pose] : st.rest; // hand rests during grammar fill
      st.gen++; st.stepT = t;
    }
    if (m.clicks !== st.lastClick) { st.lastClick = m.clicks; if (st.gen < nSteps) step(); st.stepT = t; }
    if (st.gen < nSteps) { if (t - st.stepT > interval) step(); }
    else if (t - st.stepT > holdTime) { st.gen = 0; st.at = {}; st.poseTgt = st.rest; st.stepT = t; } // reset loop

    for (var i = 0; i < 5; i++) st.cur[i] = lerp(st.cur[i], st.poseTgt[i], 0.14);

    // ----- centered articulated hand -----
    var wx = w / 2, wy = h - 44;
    ctx.fillStyle = BLU;
    ctx.beginPath(); ctx.arc(wx, wy, 3, 0, 7); ctx.fill();
    var bases = [
      [wx - 17, wy - 26, -Math.PI / 2 - 0.32, [13, 10, 8], st.cur[1]],
      [wx - 6, wy - 30, -Math.PI / 2 - 0.10, [15, 11, 9], st.cur[2]],
      [wx + 5, wy - 29, -Math.PI / 2 + 0.12, [14, 10, 8], st.cur[3]],
      [wx + 15, wy - 24, -Math.PI / 2 + 0.34, [11, 8, 7], st.cur[4]]
    ];
    var cols = [GRN, BLU, AMB, PNK];
    ctx.strokeStyle = FAINT; ctx.lineWidth = 1.4;
    bases.forEach(function (b) { ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(b[0], b[1]); ctx.stroke(); });
    bases.forEach(function (b, i) { finger(ctx, b[0], b[1], b[2], b[3], b[4], cols[i]); });
    finger(ctx, wx - 16, wy - 8, Math.PI + 0.55, [12, 9, 7], st.cur[0], PUR); // thumb

    // ----- phase caption -----
    ctx.globalAlpha = 1; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.font = "7px monospace"; ctx.fillStyle = INK;
    ctx.fillText(st.gen > st.numSign ? "LLM adds grammar" : "hand signs → words", 6, 11);

    // ----- bottom: sentence, two token styles + entrance animations -----
    var pos = layoutTokens(ctx, st.final, w / 2, h - 7, w - 12);
    st.final.forEach(function (tk, i) {
      if (st.at[i] === undefined) return;
      var p = pos[i], age = t - st.at[i];
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      if (tk.src === "sign") {                 // pop in
        var e = easeOut(age / 0.28), s = 0.65 + 0.35 * e;
        ctx.save();
        ctx.globalAlpha = e;
        ctx.translate(p.x, p.y); ctx.scale(s, s);
        ctx.fillStyle = SIGN_COL; ctx.font = SIGN_FONT;
        ctx.fillText(tk.w, 0, 0);
        ctx.restore();
      } else {                                 // fade + rise in
        var e2 = easeOut(age / 0.42);
        ctx.save();
        ctx.globalAlpha = e2;
        ctx.fillStyle = LLM_COL; ctx.font = LLM_FONT;
        ctx.fillText(tk.w, p.x, p.y - (1 - e2) * 4);
        ctx.restore();
      }
    });
    ctx.globalAlpha = 1;
  }

  /* ---------- 5. Emotional AI: classify + expressive face ---------- */
  function emoInit() {
    return {
      list: [
        { n: "joy", c: "#e0a000", mouth: 1.0, brow: -0.1 },
        { n: "sad", c: "#3b82f6", mouth: -0.9, brow: 0.5 },
        { n: "anger", c: "#ef4444", mouth: -0.4, brow: -0.6 },
        { n: "fear", c: "#8b5cf6", mouth: -0.2, brow: 0.6 },
        { n: "surprise", c: "#0fb5a0", mouth: 0.1, brow: 0.7 }
      ],
      idx: 0, mouth: 1, brow: -0.1, vals: [0.7, 0.1, 0.05, 0.05, 0.1],
      lastClick: 0, hold: 0
    };
  }
  function emo(ctx, w, h, t, m, st) {
    ctx.clearRect(0, 0, w, h);
    if (m.clicks !== st.lastClick) { st.lastClick = m.clicks; st.idx = (st.idx + 1) % st.list.length; st.hold = t; }
    if (t - st.hold > 2.6) { st.idx = (st.idx + 1) % st.list.length; st.hold = t; }
    var e = st.list[st.idx];
    st.mouth = lerp(st.mouth, e.mouth, 0.1);
    st.brow = lerp(st.brow, e.brow, 0.1);
    // distribution
    for (var i = 0; i < st.list.length; i++) {
      var target = i === st.idx ? 0.72 : 0.07 + 0.05 * Math.abs(Math.sin(t + i));
      st.vals[i] = lerp(st.vals[i], target, 0.1);
    }
    // face
    var fx = 34, fy = h / 2 - 4, R = 22;
    ctx.strokeStyle = e.c; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(fx, fy, R, 0, 7); ctx.stroke();
    // eyes
    ctx.fillStyle = e.c;
    ctx.beginPath(); ctx.arc(fx - 8, fy - 4, 2.4, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(fx + 8, fy - 4, 2.4, 0, 7); ctx.fill();
    // brows (tilt by brow)
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(fx - 13, fy - 11 + st.brow * 3); ctx.lineTo(fx - 4, fy - 11 - st.brow * 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(fx + 4, fy - 11 - st.brow * 3); ctx.lineTo(fx + 13, fy - 11 + st.brow * 3); ctx.stroke();
    // mouth (quadratic curve, curvature = st.mouth)
    ctx.beginPath();
    ctx.moveTo(fx - 9, fy + 9);
    ctx.quadraticCurveTo(fx, fy + 9 + st.mouth * 9, fx + 9, fy + 9);
    ctx.stroke();
    // bars
    var bx = w - 34, bw = 26;
    st.list.forEach(function (em, i) {
      var y = 12 + i * 14;
      ctx.fillStyle = "rgba(100,116,139,.2)";
      rr(ctx, bx, y, bw, 5, 2); ctx.fill();
      ctx.fillStyle = em.c;
      rr(ctx, bx, y, Math.max(2, bw * st.vals[i]), 5, 2); ctx.fill();
    });
    ctx.fillStyle = INK; ctx.font = "8px monospace";
    ctx.fillText(e.n, fx - 12, h - 4);
  }

  /* ---------- 6. LSTM: recurrent net emitting character-level code ----------
     Left: a small recurrent network with self-loops (the LSTM). A pulse cycles
     input -> hidden -> output once per timestep. Right: generated C-style code
     types out one character at a time with a blinking caret, then loops. */
  function lstmInit() {
    return { code: ["for(i=0;i<n;i++)", "  s += a[i];", "return s;"], start: 0 };
  }
  function lstm(ctx, w, h, t, m, st) {
    ctx.clearRect(0, 0, w, h);

    // ----- left: recurrent (LSTM) network -----
    var ix = 16, hx = 44, ox = 70;
    var inY = [h * 0.30, h * 0.50, h * 0.70];
    var hidY = [h * 0.36, h * 0.64];
    var outY = h * 0.50;
    ctx.strokeStyle = FAINT; ctx.lineWidth = 1;
    inY.forEach(function (iy) {
      hidY.forEach(function (hy) { ctx.beginPath(); ctx.moveTo(ix, iy); ctx.lineTo(hx, hy); ctx.stroke(); });
    });
    hidY.forEach(function (hy) { ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(ox, outY); ctx.stroke(); });
    // recurrent self-loops (amber) with a small arrowhead
    hidY.forEach(function (hy) {
      ctx.strokeStyle = "rgba(224,138,0,.75)"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(hx, hy - 9, 5.5, Math.PI * 0.15, Math.PI * 1.7); ctx.stroke();
      var aa = Math.PI * 1.7, ax = hx + 5.5 * Math.cos(aa), ay = hy - 9 + 5.5 * Math.sin(aa);
      ctx.fillStyle = "rgba(224,138,0,.75)";
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax - 3, ay - 1); ctx.lineTo(ax - 1, ay + 3); ctx.fill();
    });
    // traveling pulse: input -> hidden -> output (one timestep)
    var speed = m.over ? 1.8 : 1.0;
    var ph = (t * speed * 0.7) % 1, px, py;
    if (ph < 0.5) { var k = ph / 0.5; px = lerp(ix, hx, k); py = lerp(inY[1], hidY[0], k); }
    else { var k2 = (ph - 0.5) / 0.5; px = lerp(hx, ox, k2); py = lerp(hidY[0], outY, k2); }
    ctx.fillStyle = PNK; ctx.beginPath(); ctx.arc(px, py, 2.4, 0, 7); ctx.fill();
    // nodes
    ctx.fillStyle = BLU; inY.forEach(function (iy) { ctx.beginPath(); ctx.arc(ix, iy, 3, 0, 7); ctx.fill(); });
    ctx.fillStyle = AMB; hidY.forEach(function (hy) { rr(ctx, hx - 5, hy - 5, 10, 10, 3); ctx.fill(); });
    ctx.fillStyle = GRN; ctx.beginPath(); ctx.arc(ox, outY, 3, 0, 7); ctx.fill();
    ctx.fillStyle = INK; ctx.font = "7px monospace";
    ctx.textAlign = "center"; ctx.fillText("LSTM", hx, h - 5); ctx.textAlign = "left";

    // ----- output -> code connector -----
    var codeX = 90, y0 = 24, lh = 12;
    ctx.strokeStyle = "rgba(14,163,107,.35)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ox + 4, outY); ctx.lineTo(codeX - 4, y0 - 5); ctx.stroke();

    // ----- right: character-by-character code generation -----
    var cps = m.over ? 32 : 16;
    if (st.start === 0) st.start = t;
    var total = st.code.reduce(function (a, l) { return a + l.length + 1; }, 0);
    var revealed = Math.floor((t - st.start) * cps);
    if (revealed > total + cps * 1.3) { st.start = t; revealed = 0; } // pause, then loop
    ctx.font = "8px monospace"; ctx.textBaseline = "alphabetic";
    var idx = 0, yy = y0;
    for (var li = 0; li < st.code.length; li++) {
      var line = st.code[li];
      var take = Math.max(0, Math.min(line.length, revealed - idx));
      ctx.fillStyle = "#334155";
      ctx.fillText(line.slice(0, take), codeX, yy);
      if (revealed >= idx && revealed <= idx + line.length && Math.floor(t * 2.5) % 2 === 0) {
        var cw = ctx.measureText(line.slice(0, take)).width;
        ctx.fillStyle = GRN; ctx.fillRect(codeX + cw + 1, yy - 7, 4, 8); // blinking caret
      }
      idx += line.length + 1;
      yy += lh;
      if (idx > revealed) break;
    }
    ctx.fillStyle = INK; ctx.font = "7px monospace";
    ctx.fillText("char-level gen", codeX, h - 5);
  }

  /* ---------- 7. Short Vectorization: rolling active-learning interpolation ----------
     Acquired samples are drawn as vectors (stems) that scroll right-to-left. A line
     interpolates new points between their tips, and an amber marker pulses over the
     segment where interpolation deviates most from the signal: the next point that
     active learning would query. */
  function svaInit() { return { seed: 1.7 }; }
  function sva(ctx, w, h, t, m, st) {
    ctx.clearRect(0, 0, w, h);
    var plotX = 12, plotW = w - 24, midY = h * 0.52, A = h * 0.30, span = 6, seed = st.seed;
    var speed = m.over ? 1.5 : 0.7;
    var u0 = t * speed * 0.6;
    function yOf(u) { return midY - A * Math.sin(u * 0.8 + seed) - (A * 0.35) * Math.sin(u * 1.9 + seed * 1.3); }
    function xOf(u) { return plotX + (u - u0) / span * plotW; }

    // baseline
    ctx.strokeStyle = FAINT; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(plotX, midY); ctx.lineTo(plotX + plotW, midY); ctx.stroke();

    // true signal (faint continuous reference)
    ctx.strokeStyle = "rgba(100,116,139,.25)"; ctx.lineWidth = 1;
    ctx.beginPath();
    for (var uu = u0; uu <= u0 + span; uu += 0.08) {
      var xx = xOf(uu), yy = yOf(uu);
      if (uu === u0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();

    // acquired anchors (integer u in view)
    var anchors = [];
    for (var u = Math.ceil(u0); u <= Math.floor(u0 + span); u++) anchors.push({ u: u, x: xOf(u), y: yOf(u) });

    // interpolation line through anchor tips
    ctx.strokeStyle = "rgba(43,127,255,.9)"; ctx.lineWidth = 1.6;
    ctx.beginPath();
    anchors.forEach(function (p, i) { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
    ctx.stroke();

    // interpolated new points between anchors (hollow green dots)
    for (var i = 0; i < anchors.length - 1; i++) {
      var a = anchors[i], b = anchors[i + 1];
      for (var s = 1; s <= 2; s++) {
        var f = s / 3, ix = a.x + (b.x - a.x) * f, iy = a.y + (b.y - a.y) * f;
        ctx.fillStyle = "#fff"; ctx.strokeStyle = GRN; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(ix, iy, 1.8, 0, 7); ctx.fill(); ctx.stroke();
      }
    }

    // anchors as vectors: stem from baseline + solid tip
    anchors.forEach(function (p) {
      ctx.strokeStyle = "rgba(43,127,255,.4)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p.x, midY); ctx.lineTo(p.x, p.y); ctx.stroke();
      ctx.fillStyle = BLU; ctx.beginPath(); ctx.arc(p.x, p.y, 2.6, 0, 7); ctx.fill();
    });

    // active learning: segment of max interpolation error -> next query
    var qErr = -1, qu = 0;
    for (var j = 0; j < anchors.length - 1; j++) {
      var mu = (anchors[j].u + anchors[j + 1].u) / 2;
      var err = Math.abs((anchors[j].y + anchors[j + 1].y) / 2 - yOf(mu));
      if (err > qErr) { qErr = err; qu = mu; }
    }
    if (qErr > 3) {
      ctx.strokeStyle = AMB; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(xOf(qu), yOf(qu), 6 + Math.sin(t * 5) * 2, 0, 7); ctx.stroke();
      ctx.fillStyle = AMB; ctx.beginPath(); ctx.arc(xOf(qu), yOf(qu), 2, 0, 7); ctx.fill();
    }

    ctx.fillStyle = INK; ctx.font = "8px monospace"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText(m.over ? "query max-uncertainty" : "rolling interpolation", plotX, h - 5);
  }

  /* ---------- boot ---------- */
  function boot() {
    reg("viz-dna", dna);
    reg("viz-graph", graph, graphInit);
    reg("viz-moe", moe, moeInit);
    reg("viz-hand", hand, handInit);
    reg("viz-emotion", emo, emoInit);
    reg("viz-lstm", lstm, lstmInit);
    reg("viz-sva", sva, svaInit);
    var t0 = performance.now();
    function renderAll() {
      var t = (performance.now() - t0) / 1000;
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        it.draw(it.ctx, it.w, it.h, t, it.m, it.st);
      }
    }
    renderAll(); // immediate first frame (never blank)

    var rafOk = false;
    function loop() { rafOk = true; renderAll(); requestAnimationFrame(loop); }
    requestAnimationFrame(loop);

    // Fallback for environments where rAF is throttled/paused.
    setTimeout(function () {
      if (!rafOk) setInterval(renderAll, 33);
    }, 500);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
