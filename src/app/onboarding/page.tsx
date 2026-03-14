'use client';

import { useEffect, useRef } from 'react';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const CW = 220, CH = 280;
    cv.width  = CW;
    cv.height = CH;
    const cx = CW * 0.58;
    const cy = CH * 0.42;
    const G1 = '#00FF87';
    const G2 = '#00C467';

    const N = 14;
    let nodes: any[] = [];
    let edges: [number, number][] = [];
    let beams: any[] = [];
    let ripples: any[] = [];
    let lastFire = 0;
    let coreRot = 0, coreHit = 0, corePulse = 0;
    let rafId: number;

    function scatter() {
      nodes = [];
      const minD = 20, minC = 18, margin = 8;
      for (let i = 0; i < N; i++) {
        let x = 0, y = 0, tries = 0;
        do {
          const a = Math.random() * Math.PI * 2;
          const r = minC + Math.pow(Math.random(), 0.5) * (88 - minC);
          x = cx + Math.cos(a) * r;
          y = cy + Math.sin(a) * r;
          tries++;
        } while (
          tries < 80 && (
            nodes.some((n: any) => Math.hypot(n.ax - x, n.ay - y) < minD) ||
            x < margin || x > CW - margin || y < margin || y > CH - margin
          )
        );
        nodes.push({
          ax: x, ay: y, x, y,
          dA: Math.random() * Math.PI * 2,
          dSpd: 0.0004 + Math.random() * 0.0005,
          dAmp: 4 + Math.random() * 6,
          dPh: Math.random() * Math.PI * 2,
          nr: 4.5 + Math.random() * 2.5,
          flash: 0,
          ph: Math.random() * Math.PI * 2,
        });
      }
      buildEdges();
    }

    function buildEdges() {
      edges = [];
      const seen = new Set<string>();
      nodes.forEach((_: any, i: number) => {
        const deg = 2 + Math.floor(Math.random() * 2);
        let att = 0, conn = 0;
        while (conn < deg && att < 30) {
          att++;
          const j = Math.floor(Math.random() * N);
          if (j === i) continue;
          const k = i < j ? `${i}-${j}` : `${j}-${i}`;
          if (seen.has(k)) continue;
          seen.add(k);
          edges.push([i, j]);
          conn++;
        }
        if (Math.random() < 0.4) edges.push([i, -1]);
      });
    }

    function tryFire(ts: number) {
      if (ts - lastFire < 1200 + Math.random() * 900) return;
      lastFire = ts;
      const busy = new Set(beams.map((b: any) => b.ni));
      const pool = nodes.map((_: any, i: number) => i).filter((i: number) => !busy.has(i));
      if (!pool.length) return;
      const ni = pool[Math.floor(Math.random() * pool.length)];
      beams.push({ ni, t: 0, done: false, ox: (Math.random() - 0.5) * 36, oy: (Math.random() - 0.5) * 36 });
    }

    function bez(t: number, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number) {
      const m = 1 - t;
      return { x: m*m*x0 + 2*m*t*x1 + t*t*x2, y: m*m*y0 + 2*m*t*y1 + t*t*y2 };
    }

    function addRipple() {
      ripples.push({ r: 4, a: 0.6, spd: 2.4 });
      ripples.push({ r: 10, a: 0.3, spd: 3.6 });
    }

    function drawYou() {
      corePulse += 0.04;
      coreHit = Math.max(0, coreHit - 0.045);
      const ps = 1 + Math.sin(corePulse) * 0.07 + coreHit * 0.2;
      const S = 8 * ps;

      const mg = ctx.createRadialGradient(cx, cy, S * 0.3, cx, cy, S * 5);
      mg.addColorStop(0, `rgba(0,255,135,${0.18 + coreHit * 0.15})`);
      mg.addColorStop(0.5, `rgba(0,196,103,${0.06 + coreHit * 0.04})`);
      mg.addColorStop(1, 'rgba(0,196,103,0)');
      ctx.beginPath(); ctx.arc(cx, cy, S * 5, 0, Math.PI * 2);
      ctx.fillStyle = mg; ctx.fill();

      ctx.save(); ctx.translate(cx, cy);
      ctx.rotate(coreRot);
      const so = S + 5;
      ctx.strokeStyle = `rgba(0,255,135,${0.28 + coreHit * 0.32})`;
      ctx.lineWidth = 0.5; ctx.setLineDash([2, 3]);
      ctx.strokeRect(-so, -so, so * 2, so * 2); ctx.setLineDash([]);

      ctx.rotate(-coreRot * 1.7);
      const so2 = S + 10;
      ctx.strokeStyle = `rgba(0,196,103,${0.15 + coreHit * 0.18})`;
      ctx.lineWidth = 0.4; ctx.setLineDash([1, 5]);
      ctx.strokeRect(-so2, -so2, so2 * 2, so2 * 2); ctx.setLineDash([]);

      ctx.rotate(coreRot * 0.8);
      const sb = S + 15, bl = 3;
      ctx.strokeStyle = `rgba(0,255,135,${0.45 + coreHit * 0.3})`; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(-sb, -sb + bl); ctx.lineTo(-sb, -sb); ctx.lineTo(-sb + bl, -sb); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sb - bl, -sb); ctx.lineTo(sb, -sb); ctx.lineTo(sb, -sb + bl); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sb, sb - bl); ctx.lineTo(sb, sb); ctx.lineTo(sb - bl, sb); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-sb + bl, sb); ctx.lineTo(-sb, sb); ctx.lineTo(-sb, sb - bl); ctx.stroke();
      ctx.restore();

      const cg = ctx.createLinearGradient(cx - S, cy - S, cx + S, cy + S);
      cg.addColorStop(0, 'rgba(0,32,14,0.96)');
      cg.addColorStop(1, 'rgba(0,14,6,0.96)');
      ctx.fillStyle = cg; ctx.fillRect(cx - S, cy - S, S * 2, S * 2);
      ctx.strokeStyle = `rgba(0,255,135,${0.65 + coreHit * 0.3})`;
      ctx.lineWidth = 0.8 + coreHit * 0.5;
      ctx.strokeRect(cx - S, cy - S, S * 2, S * 2);

      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `400 4.5px monospace`;
      ctx.shadowColor = G1; ctx.shadowBlur = 3 + coreHit * 4;
      ctx.fillStyle = `rgba(0,255,135,${0.9 + coreHit * 0.1})`;
      ctx.fillText('YOU', cx, cy);
      ctx.shadowBlur = 0;
      coreRot += 0.005;
    }

    function drawWeb() {
      edges.forEach(([i, j]) => {
        const a = nodes[i];
        const bx = j === -1 ? cx : nodes[j].x;
        const by = j === -1 ? cy : nodes[j].y;
        const dist = Math.hypot(a.x - bx, a.y - by);
        const al = Math.max(0, (1 - dist / 110) * 0.18 + 0.02);
        const gr = ctx.createLinearGradient(a.x, a.y, bx, by);
        if (j === -1) {
          gr.addColorStop(0, `rgba(0,255,135,${al * 1.4})`);
          gr.addColorStop(1, 'rgba(0,196,103,0)');
        } else {
          gr.addColorStop(0, `rgba(0,196,103,${al})`);
          gr.addColorStop(0.5, `rgba(0,90,45,${al * 0.4})`);
          gr.addColorStop(1, `rgba(0,196,103,${al})`);
        }
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(bx, by);
        ctx.strokeStyle = gr; ctx.lineWidth = 0.4; ctx.stroke();
      });
    }

    function drawNodes() {
      nodes.forEach((nd: any) => {
        nd.ph += 0.018;
        nd.dPh += nd.dSpd * 16;
        nd.x = nd.ax + Math.cos(nd.dA + nd.dPh) * nd.dAmp;
        nd.y = nd.ay + Math.sin(nd.dA * 1.3 + nd.dPh) * nd.dAmp * 0.7;
        const ps = 1 + Math.sin(nd.ph) * 0.04;
        const r = nd.nr * ps;
        const { x, y } = nd;
        if (nd.flash > 0) {
          const fg = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
          fg.addColorStop(0, `rgba(0,255,135,${0.35 * nd.flash})`);
          fg.addColorStop(1, 'rgba(0,255,135,0)');
          ctx.beginPath(); ctx.arc(x, y, r * 4, 0, Math.PI * 2);
          ctx.fillStyle = fg; ctx.fill();
          nd.flash = Math.max(0, nd.flash - 0.07);
        }
        const gg = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 2);
        gg.addColorStop(0, 'rgba(0,196,103,0.10)');
        gg.addColorStop(1, 'rgba(0,196,103,0)');
        ctx.beginPath(); ctx.arc(x, y, r * 2, 0, Math.PI * 2);
        ctx.fillStyle = gg; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.88)'; ctx.fill();
        ctx.strokeStyle = nd.flash > 0.2 ? G1 : 'rgba(0,196,103,0.5)';
        ctx.lineWidth = 0.6; ctx.stroke();
      });
    }

    function drawBeams() {
      beams = beams.filter((b: any) => !b.done);
      beams.forEach((b: any) => {
        b.t = Math.min(1, b.t + 0.036);
        const nd = nodes[b.ni];
        const sx = nd.x, sy = nd.y;
        const cpx = sx * 0.4 + cx * 0.6 + b.ox;
        const cpy = sy * 0.4 + cy * 0.6 + b.oy;
        const tip = bez(b.t, sx, sy, cpx, cpy, cx, cy);
        const tailT = Math.max(0, b.t - 0.3);
        const tail = bez(tailT, sx, sy, cpx, cpy, cx, cy);
        const STEPS = 22;
        ctx.beginPath(); let first = true;
        for (let k = 0; k <= STEPS; k++) {
          const st = tailT + (b.t - tailT) * (k / STEPS);
          const p = bez(st, sx, sy, cpx, cpy, cx, cy);
          first ? (ctx.moveTo(p.x, p.y), first = false) : ctx.lineTo(p.x, p.y);
        }
        const lg = ctx.createLinearGradient(tail.x, tail.y, tip.x, tip.y);
        lg.addColorStop(0, 'rgba(0,196,103,0)');
        lg.addColorStop(0.5, 'rgba(0,196,103,0.4)');
        lg.addColorStop(1, G1);
        ctx.strokeStyle = lg; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
        ctx.shadowColor = G1; ctx.shadowBlur = 5;
        ctx.stroke(); ctx.shadowBlur = 0;
        const tg = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 5);
        tg.addColorStop(0, '#fff'); tg.addColorStop(0.4, G1); tg.addColorStop(1, 'rgba(0,255,135,0)');
        ctx.beginPath(); ctx.arc(tip.x, tip.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = tg; ctx.fill();
        if (b.t >= 1) { coreHit = 1; nd.flash = 1; addRipple(); b.done = true; }
      });
    }

    function drawRipples() {
      ripples = ripples.filter((r: any) => r.a > 0.01);
      ripples.forEach((r: any) => {
        ctx.strokeStyle = `rgba(0,255,135,${r.a})`; ctx.lineWidth = 0.6;
        ctx.strokeRect(cx - r.r, cy - r.r, r.r * 2, r.r * 2);
        r.r += r.spd; r.a *= 0.90;
      });
    }

    function drawVignette() {
      const gl = ctx.createLinearGradient(0, 0, CW * 0.35, 0);
      gl.addColorStop(0, 'rgba(5,8,16,1)'); gl.addColorStop(1, 'rgba(5,8,16,0)');
      ctx.fillStyle = gl; ctx.fillRect(0, 0, CW * 0.35, CH);
      const gb = ctx.createLinearGradient(0, CH * 0.72, 0, CH);
      gb.addColorStop(0, 'rgba(5,8,16,0)'); gb.addColorStop(1, 'rgba(5,8,16,1)');
      ctx.fillStyle = gb; ctx.fillRect(0, CH * 0.72, CW, CH * 0.28);
      const gt = ctx.createLinearGradient(0, 0, 0, CH * 0.08);
      gt.addColorStop(0, 'rgba(5,8,16,1)'); gt.addColorStop(1, 'rgba(5,8,16,0)');
      ctx.fillStyle = gt; ctx.fillRect(0, 0, CW, CH * 0.08);
      const gr2 = ctx.createLinearGradient(CW * 0.75, 0, CW, 0);
      gr2.addColorStop(0, 'rgba(5,8,16,0)'); gr2.addColorStop(1, 'rgba(5,8,16,1)');
      ctx.fillStyle = gr2; ctx.fillRect(CW * 0.75, 0, CW * 0.25, CH);
    }

    scatter();

    function loop(ts: number) {
      rafId = requestAnimationFrame(loop);
      ctx.clearRect(0, 0, CW, CH);
      ctx.fillStyle = 'rgba(5,8,16,0.55)';
      ctx.fillRect(0, 0, CW, CH);
      drawWeb(); drawNodes(); drawRipples(); drawBeams(); drawYou(); drawVignette();
      tryFire(ts);
    }
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#050810;display:flex;justify-content:center;}
        .w{font-family:'Space Grotesk',sans-serif;background:#050810;color:#ECE9FF;width:390px;min-height:100vh;position:relative;overflow:hidden;}
        .noise{position:fixed;top:0;left:0;right:0;bottom:0;opacity:0.35;pointer-events:none;z-index:100;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");}
        .aurora{position:absolute;top:-120px;left:50%;transform:translateX(-50%);width:520px;height:520px;background:radial-gradient(ellipse 60% 40% at 40% 50%,rgba(99,89,255,0.18) 0%,transparent 60%),radial-gradient(ellipse 50% 35% at 65% 45%,rgba(29,158,117,0.14) 0%,transparent 60%),radial-gradient(ellipse 40% 30% at 50% 70%,rgba(217,70,239,0.08) 0%,transparent 60%);pointer-events:none;animation:drift 8s ease-in-out infinite alternate;}
        @keyframes drift{from{transform:translateX(-50%) scale(1);}to{transform:translateX(-50%) scale(1.08) translateY(10px);}}
        #vc{position:absolute;top:-10px;right:-20px;width:220px;height:280px;pointer-events:none;z-index:1;opacity:0.72;}
        .nav{display:flex;align-items:center;justify-content:space-between;padding:20px 22px 0;position:relative;z-index:3;}
        .logo{font-size:20px;font-weight:700;letter-spacing:-0.5px;}
        .logo span{background:linear-gradient(135deg,#6359FF,#1D9E75);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
        .live-dot{display:flex;align-items:center;gap:6px;font-family:'Space Mono',monospace;font-size:10px;color:#1D9E75;letter-spacing:0.5px;}
        .dot{width:7px;height:7px;border-radius:50%;background:#1D9E75;box-shadow:0 0 8px #1D9E75;animation:pulse 1.8s ease-in-out infinite;}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.4;transform:scale(0.65);}}
        .hero{padding:40px 22px 0;position:relative;z-index:3;min-height:280px;}
        .badge{display:inline-flex;align-items:center;gap:6px;background:rgba(99,89,255,0.12);border:1px solid rgba(99,89,255,0.3);border-radius:20px;padding:5px 12px;font-family:'Space Mono',monospace;font-size:9px;color:#A89FFF;letter-spacing:0.5px;margin-bottom:18px;white-space:nowrap;}
        .badge-dot{width:5px;height:5px;border-radius:50%;background:#6359FF;box-shadow:0 0 6px #6359FF;}
        h1{font-size:38px;font-weight:700;line-height:1.05;letter-spacing:-1.4px;margin-bottom:16px;max-width:220px;}
        h1 .g{background:linear-gradient(135deg,#6359FF 0%,#1D9E75 60%,#D946EF 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
        .sub{font-size:14px;font-weight:400;color:rgba(236,233,255,0.5);line-height:1.65;margin-bottom:28px;max-width:260px;}
        .sub strong{color:rgba(236,233,255,0.8);font-weight:500;}
        .btns{display:flex;gap:10px;margin-bottom:40px;position:relative;z-index:3;}
        .btn-p{flex:1;padding:14px 0;background:linear-gradient(135deg,#6359FF,#4F47CC);color:#fff;border:none;border-radius:14px;font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 8px 24px rgba(99,89,255,0.35);transition:transform 0.15s,box-shadow 0.15s;}
        .btn-p:hover{transform:translateY(-2px);box-shadow:0 14px 30px rgba(99,89,255,0.45);}
        .btn-g{flex:1;padding:14px 0;background:transparent;color:#ECE9FF;border:1px solid rgba(236,233,255,0.15);border-radius:14px;font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:500;cursor:pointer;backdrop-filter:blur(10px);transition:border-color 0.15s;}
        .btn-g:hover{border-color:rgba(236,233,255,0.4);}
        .stats{display:flex;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:18px 0;margin:0 22px 40px;position:relative;z-index:3;}
        .stat{flex:1;text-align:center;}
        .stat-v{font-family:'Space Mono',monospace;font-size:20px;font-weight:700;letter-spacing:-1px;}
        .stat-v.green{color:#1D9E75;}.stat-v.purple{color:#A89FFF;}.stat-v.white{color:#ECE9FF;}
        .stat-l{font-size:10px;color:rgba(236,233,255,0.35);margin-top:4px;letter-spacing:0.5px;text-transform:uppercase;}
        .sdiv{width:1px;background:rgba(255,255,255,0.07);align-self:stretch;}
        .sec-hd{padding:0 22px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;position:relative;z-index:3;}
        .sec-title{font-family:'Space Mono',monospace;font-size:10px;color:rgba(236,233,255,0.35);letter-spacing:2px;text-transform:uppercase;}
        .sec-more{font-size:11px;color:#6359FF;cursor:pointer;border-bottom:1px solid rgba(99,89,255,0.3);}
        .lb-wrap{margin:0 22px 40px;background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:18px;overflow:hidden;position:relative;z-index:3;}
        .lb-tabs{display:flex;border-bottom:1px solid rgba(255,255,255,0.06);padding:0 16px;gap:20px;}
        .lb-tab{font-family:'Space Mono',monospace;font-size:10px;padding:12px 0;color:rgba(236,233,255,0.35);letter-spacing:1px;cursor:pointer;border-bottom:2px solid transparent;transition:all 0.15s;}
        .lb-tab.active{color:#6359FF;border-bottom-color:#6359FF;}
        .lb-head{display:grid;grid-template-columns:28px 1fr 64px 70px;padding:10px 16px;gap:8px;border-bottom:1px solid rgba(255,255,255,0.04);}
        .lb-hcell{font-family:'Space Mono',monospace;font-size:9px;color:rgba(236,233,255,0.2);letter-spacing:1px;text-transform:uppercase;}
        .lb-hcell:last-child,.lb-hcell:nth-child(3){text-align:right;}
        .lb-row{display:grid;grid-template-columns:28px 1fr 64px 70px;padding:12px 16px;gap:8px;align-items:center;border-bottom:1px solid rgba(255,255,255,0.04);cursor:pointer;transition:background 0.12s;}
        .lb-row:last-child{border-bottom:none;}.lb-row:hover{background:rgba(255,255,255,0.04);}
        .lb-row-gold{background:rgba(255,185,0,0.04);}.lb-row-silver{background:rgba(180,180,180,0.03);}.lb-row-bronze{background:rgba(180,100,40,0.03);}
        .rank{font-family:'Space Mono',monospace;font-size:12px;font-weight:700;text-align:center;}
        .r1{color:#FFB900;}.r2{color:#B0B0B0;}.r3{color:#CD7F32;}.r4,.r5{color:rgba(236,233,255,0.22);font-size:10px;}
        .trader{display:flex;align-items:center;gap:9px;}
        .av{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;}
        .tn{font-size:13px;font-weight:600;color:#ECE9FF;margin-bottom:1px;}.tm{font-family:'Space Mono',monospace;font-size:9px;color:rgba(236,233,255,0.3);}
        .pnl-cell{text-align:right;}.pnl{font-family:'Space Mono',monospace;font-size:13px;font-weight:700;}
        .pnl.pos{color:#1D9E75;}.pnl.neg{color:#F09595;}
        .bar-cell{display:flex;flex-direction:column;align-items:flex-end;gap:4px;}
        .wr{font-family:'Space Mono',monospace;font-size:10px;color:rgba(236,233,255,0.5);}
        .bar-bg{width:52px;height:3px;background:rgba(255,255,255,0.08);border-radius:2px;overflow:hidden;}
        .bar-fill{height:100%;border-radius:2px;}
        .cc-wrap{margin:0 22px 40px;display:grid;grid-template-columns:1fr 1fr;gap:10px;position:relative;z-index:3;}
        .cc-card{border-radius:16px;padding:20px 14px;position:relative;overflow:hidden;}
        .cc-copy{background:linear-gradient(135deg,rgba(29,158,117,0.16),rgba(29,158,117,0.04));border:1px solid rgba(29,158,117,0.28);}
        .cc-counter{background:linear-gradient(135deg,rgba(217,70,239,0.16),rgba(217,70,239,0.04));border:1px solid rgba(217,70,239,0.28);}
        .cc-icon{font-size:22px;margin-bottom:10px;}.cc-name{font-size:13px;font-weight:700;margin-bottom:5px;}
        .cc-copy .cc-name{color:#1D9E75;}.cc-counter .cc-name{color:#D946EF;}
        .cc-desc{font-size:11px;color:rgba(236,233,255,0.45);line-height:1.5;}
        .cc-glow-c{position:absolute;bottom:-20px;right:-20px;width:80px;height:80px;background:radial-gradient(circle,rgba(29,158,117,0.2),transparent 70%);}
        .cc-glow-f{position:absolute;bottom:-20px;right:-20px;width:80px;height:80px;background:radial-gradient(circle,rgba(217,70,239,0.2),transparent 70%);}
        .hiw{margin:0 22px 40px;position:relative;z-index:3;}
        .step{display:flex;gap:14px;margin-bottom:22px;align-items:flex-start;}
        .step-left{display:flex;flex-direction:column;align-items:center;}
        .step-n{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#6359FF,#4F47CC);display:flex;align-items:center;justify-content:center;font-family:'Space Mono',monospace;font-size:11px;font-weight:700;color:#fff;flex-shrink:0;box-shadow:0 4px 12px rgba(99,89,255,0.4);}
        .step-line{width:1px;height:28px;background:linear-gradient(to bottom,rgba(99,89,255,0.4),transparent);margin-top:4px;}
        .step-body{padding-top:5px;}.step-title{font-size:14px;font-weight:600;margin-bottom:4px;}
        .step-desc{font-size:12px;color:rgba(236,233,255,0.45);line-height:1.55;}
        .trust{margin:0 22px 40px;display:grid;grid-template-columns:1fr 1fr;gap:8px;position:relative;z-index:3;}
        .tc{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:18px 14px;position:relative;overflow:hidden;transition:border-color 0.2s;}
        .tc:hover{border-color:rgba(255,255,255,0.12);}
        .tc-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:17px;margin-bottom:12px;}
        .tc-icon.exit{background:rgba(99,89,255,0.15);}.tc-icon.sleep{background:rgba(29,158,117,0.15);}
        .tc-icon.pts{background:rgba(255,185,0,0.12);}.tc-icon.stats{background:rgba(217,70,239,0.13);}
        .tc-title{font-size:12px;font-weight:600;color:#ECE9FF;margin-bottom:5px;line-height:1.3;}
        .tc-desc{font-size:11px;color:rgba(236,233,255,0.35);line-height:1.5;}
        .tc::after{content:'';position:absolute;bottom:-16px;right:-16px;width:60px;height:60px;border-radius:50%;opacity:0.5;}
        .tc:nth-child(1)::after{background:radial-gradient(circle,rgba(99,89,255,0.25),transparent 70%);}
        .tc:nth-child(2)::after{background:radial-gradient(circle,rgba(29,158,117,0.25),transparent 70%);}
        .tc:nth-child(3)::after{background:radial-gradient(circle,rgba(255,185,0,0.2),transparent 70%);}
        .tc:nth-child(4)::after{background:radial-gradient(circle,rgba(217,70,239,0.22),transparent 70%);}
        .bcta{margin:0 22px 56px;background:linear-gradient(135deg,#6359FF 0%,#1D9E75 100%);border-radius:18px;padding:24px 20px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;position:relative;overflow:hidden;z-index:3;}
        .bcta::before{content:'';position:absolute;top:-40px;right:-40px;width:120px;height:120px;background:rgba(255,255,255,0.08);border-radius:50%;}
        .bcta-l{position:relative;}.bcta-title{font-size:17px;font-weight:700;color:#fff;margin-bottom:3px;}
        .bcta-sub{font-size:11px;color:rgba(255,255,255,0.65);}
        .bcta-arr{width:42px;height:42px;background:rgba(255,255,255,0.15);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;color:#fff;flex-shrink:0;transition:transform 0.2s;}
        .bcta:hover .bcta-arr{transform:translateX(3px);}
      `}</style>

      <div className="w">
        <div className="noise" />
        <div className="aurora" />
        <canvas id="vc" ref={canvasRef} />

        <nav className="nav">
          <div className="logo">Hyper<span>Copy</span></div>
          <div className="live-dot"><div className="dot" />LIVE ON HL L1</div>
        </nav>

        <div className="hero">
          <div className="badge"><div className="badge-dot" />400+ KOLs · Real-time signals</div>
          <h1>Copy the<br />best crypto<br />minds.<br /><span className="g">Automatically.</span></h1>
          <p className="sub">HyperCopy monitors crypto Twitter, <strong>scores every KOL&apos;s accuracy</strong>, and fires your trades on HyperLiquid the moment they call it.</p>
          <div className="btns">
            <button className="btn-p">Start copying →</button>
            <button className="btn-g">How it works</button>
          </div>
        </div>

        <div className="stats">
          <div className="stat"><div className="stat-v purple">400+</div><div className="stat-l">KOLs</div></div>
          <div className="sdiv" />
          <div className="stat"><div className="stat-v green">$0</div><div className="stat-l">Withdraw fee</div></div>
          <div className="sdiv" />
          <div className="stat"><div className="stat-v white">8</div><div className="stat-l">Chains</div></div>
          <div className="sdiv" />
          <div className="stat"><div className="stat-v green">15s</div><div className="stat-l">To order</div></div>
        </div>

        <div className="sec-hd">
          <div className="sec-title">⚡ Live leaderboard · 7d</div>
          <div className="sec-more">View all →</div>
        </div>
        <div className="lb-wrap">
          <div className="lb-tabs">
            <div className="lb-tab active">7D</div>
            <div className="lb-tab">30D</div>
            <div className="lb-tab">ALL</div>
          </div>
          <div className="lb-head">
            <div className="lb-hcell">#</div><div className="lb-hcell">TRADER</div>
            <div className="lb-hcell">PNL</div><div className="lb-hcell">WIN%</div>
          </div>
          {[
            { rank:'1',rc:'r1',av:{bg:'rgba(255,185,0,0.15)',c:'#FFB900'},ab:'KA',name:'KingAlpha',sigs:'312 signals',pnl:'+247%',pos:true,wr:'78%',ww:78,barG:'#1D9E75,#5DCAA5',rowC:'lb-row lb-row-gold' },
            { rank:'2',rc:'r2',av:{bg:'rgba(99,89,255,0.15)',c:'#A89FFF'},ab:'SX',name:'SolXpert',sigs:'189 signals',pnl:'+184%',pos:true,wr:'71%',ww:71,barG:'#6359FF,#A89FFF',rowC:'lb-row lb-row-silver' },
            { rank:'3',rc:'r3',av:{bg:'rgba(217,70,239,0.15)',c:'#D946EF'},ab:'DW',name:'DegenWatch',sigs:'441 signals',pnl:'+119%',pos:true,wr:'65%',ww:65,barG:'#D946EF,#F0A0FF',rowC:'lb-row lb-row-bronze' },
            { rank:'4',rc:'r4',av:{bg:'rgba(29,158,117,0.12)',c:'#5DCAA5'},ab:'BH',name:'BTCHunter',sigs:'227 signals',pnl:'+88%',pos:true,wr:'63%',ww:63,barG:'#1D9E75,#5DCAA5',rowC:'lb-row' },
            { rank:'5',rc:'r5',av:{bg:'rgba(240,149,149,0.12)',c:'#F09595'},ab:'RB',name:'RugnBull',sigs:'98 signals',pnl:'−12%',pos:false,wr:'41%',ww:41,barG:'#F09595,#FFBBBB',rowC:'lb-row' },
          ].map((r,i) => (
            <div key={i} className={r.rowC}>
              <div className={`rank ${r.rc}`}>{r.rank}</div>
              <div className="trader">
                <div className="av" style={{background:r.av.bg,color:r.av.c}}>{r.ab}</div>
                <div><div className="tn">{r.name}</div><div className="tm">{r.sigs}</div></div>
              </div>
              <div className="pnl-cell"><div className={`pnl ${r.pos?'pos':'neg'}`}>{r.pnl}</div></div>
              <div className="bar-cell">
                <div className="wr">{r.wr}</div>
                <div className="bar-bg"><div className="bar-fill" style={{width:`${r.ww}%`,background:`linear-gradient(90deg,${r.barG})`}} /></div>
              </div>
            </div>
          ))}
        </div>

        <div className="sec-hd"><div className="sec-title">Two ways to trade</div></div>
        <div className="cc-wrap">
          <div className="cc-card cc-copy">
            <div className="cc-icon">🟢</div><div className="cc-name">Copy Trade</div>
            <div className="cc-desc">Mirror top KOL positions automatically as they call it.</div>
            <div className="cc-glow-c" />
          </div>
          <div className="cc-card cc-counter">
            <div className="cc-icon">🔴</div><div className="cc-name">Counter Trade</div>
            <div className="cc-desc">Fade the worst callers. Profit when they&apos;re wrong.</div>
            <div className="cc-glow-f" />
          </div>
        </div>

        <div className="sec-hd"><div className="sec-title">How it works</div></div>
        <div className="hiw">
          {[
            {n:'1',title:'Connect your wallet',desc:"Sign in with any wallet, email, or passkey. Privy creates a secure embedded wallet instantly.",line:true},
            {n:'2',title:'Deposit USDC from any chain',desc:'Send USDC from any of 8 chains. We auto-bridge to your dedicated HyperLiquid trading wallet.',line:true},
            {n:'3',title:'Pick your KOLs',desc:'Browse the leaderboard. Every trader ranked by verified signal accuracy — not hype.',line:true},
            {n:'4',title:'Trades fire in 15 seconds',desc:'The moment a KOL signals on Twitter, real orders hit HyperLiquid perps. You watch the P&L.',line:false},
          ].map((s,i) => (
            <div key={i} className="step">
              <div className="step-left">
                <div className="step-n">{s.n}</div>
                {s.line && <div className="step-line" />}
              </div>
              <div className="step-body">
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="trust">
          <div className="tc"><div className="tc-icon exit">🎯</div><div className="tc-title">Customize exit strategies</div><div className="tc-desc">Set take-profit, stop-loss, and trailing exits per KOL — on your terms.</div></div>
          <div className="tc"><div className="tc-icon sleep">🌙</div><div className="tc-title">Automate trades while you sleep</div><div className="tc-desc">The engine runs 24/7. Signals fire orders in 15s whether you&apos;re watching or not.</div></div>
          <div className="tc"><div className="tc-icon pts">⭐</div><div className="tc-title">Earn points</div><div className="tc-desc">Copy top KOLs, hit profit milestones, and climb the rewards leaderboard.</div></div>
          <div className="tc"><div className="tc-icon stats">📈</div><div className="tc-title">Analyze KOL statistics</div><div className="tc-desc">Win rate, avg return, signal history, and accuracy score — all verified on-chain.</div></div>
        </div>

        <div className="bcta">
          <div className="bcta-l">
            <div className="bcta-title">Start trading for free</div>
            <div className="bcta-sub">No fees to withdraw · Live on HyperLiquid L1</div>
          </div>
          <div className="bcta-arr">→</div>
        </div>
      </div>
    </>
  );
}
