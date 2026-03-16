'use client';

import { useEffect, useRef } from 'react';

export default function Home() {
  const vcRef   = useRef<HTMLCanvasElement | null>(null);
  const vpRef   = useRef<HTMLDivElement | null>(null);
  const cs1Ref  = useRef<HTMLCanvasElement | null>(null);
  const cs2Ref  = useRef<HTMLCanvasElement | null>(null);
  const cs3Ref  = useRef<HTMLCanvasElement | null>(null);
  const cs4Ref  = useRef<HTMLCanvasElement | null>(null);
  const acRef   = useRef<HTMLCanvasElement | null>(null);

  /* ─────────────────────────────── VORTEX ─────────────────── */
  useEffect(() => {
    const cv = vcRef.current; const vp = vpRef.current;
    if (!cv || !vp) return;
    const ctx = cv.getContext('2d')!;
    const CW = 390, CH = 320;
    cv.width = CW; cv.height = CH;
    const cx = CW * 0.72, cy = CH * 0.45;
    const G1 = '#0EB87A';
    const N = 16;
    let nodes: any[] = [], edges: [number,number][] = [], beams: any[] = [], ripples: any[] = [];
    let coreRot=0, coreHit=0, corePulse=0, lastFire=0;
    let raf: number;

    if (!document.getElementById('vPopStyle')) {
      const s = document.createElement('style');
      s.id = 'vPopStyle';
      s.textContent = `@keyframes vPop{0%{opacity:0;transform:translateY(0) scale(.5)}12%{opacity:1;transform:translateY(-6px) scale(1.15)}65%{opacity:1;transform:translateY(-32px) scale(1)}100%{opacity:0;transform:translateY(-52px) scale(.85)}}`;
      document.head.appendChild(s);
    }

    function scatter() {
      nodes = [];
      for (let i = 0; i < N; i++) {
        let x=0, y=0, tries=0;
        do {
          const a = Math.random()*Math.PI*2;
          const r = 24 + Math.pow(Math.random(),.5)*(115-24);
          x = cx + Math.cos(a)*r; y = cy + Math.sin(a)*r; tries++;
        } while (tries<80 && (nodes.some((n:any)=>Math.hypot(n.ax-x,n.ay-y)<20)||x<CW*.38||x>CW-12||y<12||y>CH-12));
        nodes.push({ax:x,ay:y,x,y,dA:Math.random()*Math.PI*2,dSpd:.0003+Math.random()*.0004,dAmp:4+Math.random()*7,dPh:Math.random()*Math.PI*2,nr:4+Math.random()*2.5,flash:0,ph:Math.random()*Math.PI*2});
      }
      buildEdges();
    }

    function buildEdges() {
      edges = [];
      const seen = new Set<string>();
      nodes.forEach((_:any,i:number)=>{
        const deg=2+Math.floor(Math.random()*2); let att=0,conn=0;
        while(conn<deg&&att<30){att++;const j=Math.floor(Math.random()*N);if(j===i)continue;const k=i<j?`${i}-${j}`:`${j}-${i}`;if(seen.has(k))continue;seen.add(k);edges.push([i,j]);conn++;}
        if(Math.random()<.38) edges.push([i,-1]);
      });
    }

    function spawnPopup(x:number,y:number){
      if (!vp) return;
      const AMOUNTS=[50,75,100,125,150,200,250,300,350,400,500];
      const amt=AMOUNTS[Math.floor(Math.random()*AMOUNTS.length)];
      const el=document.createElement('span');
      el.textContent=`+$${amt}`;
      el.style.cssText=`position:absolute;left:${x-18}px;top:${y-10}px;font-family:'Space Mono',monospace;font-size:11px;font-weight:700;color:#0EB87A;text-shadow:0 0 8px rgba(14,184,122,.7);pointer-events:none;white-space:nowrap;animation:vPop 1.5s ease-out forwards;`;
      vp.appendChild(el);
      setTimeout(()=>el.remove(),1600);
    }

    function bez(t:number,x0:number,y0:number,x1:number,y1:number,x2:number,y2:number){const m=1-t;return{x:m*m*x0+2*m*t*x1+t*t*x2,y:m*m*y0+2*m*t*y1+t*t*y2};}

    function addRipple(){ripples.push({r:4,a:.55,spd:2.6});ripples.push({r:11,a:.28,spd:4});}

    function tryFire(ts:number){
      if(ts-lastFire<2200+Math.random()*1400)return;lastFire=ts;
      const busy=new Set(beams.map((b:any)=>b.ni));
      const pool=nodes.map((_:any,i:number)=>i).filter((i:number)=>!busy.has(i));
      if(!pool.length)return;
      const ni=pool[Math.floor(Math.random()*pool.length)];
      beams.push({ni,t:0,done:false,ox:(Math.random()-.5)*40,oy:(Math.random()-.5)*40});
    }

    function drawYou(){
      corePulse+=.04; coreHit=Math.max(0,coreHit-.04);
      const ps=1+Math.sin(corePulse)*.07+coreHit*.2, S=8*ps;
      const mg=ctx.createRadialGradient(cx,cy,S*.3,cx,cy,S*5);
      mg.addColorStop(0,`rgba(14,184,122,${.18+coreHit*.15})`);mg.addColorStop(.5,`rgba(10,148,99,${.06+coreHit*.04})`);mg.addColorStop(1,'rgba(10,148,99,0)');
      ctx.beginPath();ctx.arc(cx,cy,S*5,0,Math.PI*2);ctx.fillStyle=mg;ctx.fill();
      ctx.save();ctx.translate(cx,cy);
      ctx.rotate(coreRot);const so=S+5;ctx.strokeStyle=`rgba(14,184,122,${.28+coreHit*.32})`;ctx.lineWidth=.5;ctx.setLineDash([2,3]);ctx.strokeRect(-so,-so,so*2,so*2);ctx.setLineDash([]);
      ctx.rotate(-coreRot*1.7);const so2=S+10;ctx.strokeStyle=`rgba(10,148,99,${.15+coreHit*.18})`;ctx.lineWidth=.4;ctx.setLineDash([1,5]);ctx.strokeRect(-so2,-so2,so2*2,so2*2);ctx.setLineDash([]);
      ctx.rotate(coreRot*.8);const sb=S+15,bl=3;ctx.strokeStyle=`rgba(14,184,122,${.45+coreHit*.3})`;ctx.lineWidth=.8;
      [[[-sb,-sb+bl],[-sb,-sb],[-sb+bl,-sb]],[[sb-bl,-sb],[sb,-sb],[sb,-sb+bl]],[[sb,sb-bl],[sb,sb],[sb-bl,sb]],[[-sb+bl,sb],[-sb,sb],[-sb,sb-bl]]].forEach(pts=>{ctx.beginPath();pts.forEach(([x,y],i)=>i===0?ctx.moveTo(x,y):ctx.lineTo(x,y));ctx.stroke();});
      ctx.restore();
      const cg=ctx.createLinearGradient(cx-S,cy-S,cx+S,cy+S);cg.addColorStop(0,'rgba(0,32,14,.96)');cg.addColorStop(1,'rgba(0,14,6,.96)');
      ctx.fillStyle=cg;ctx.fillRect(cx-S,cy-S,S*2,S*2);
      ctx.strokeStyle=`rgba(14,184,122,${.65+coreHit*.3})`;ctx.lineWidth=.8+coreHit*.5;ctx.strokeRect(cx-S,cy-S,S*2,S*2);
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`400 4.5px 'Share Tech Mono',monospace`;ctx.shadowColor=G1;ctx.shadowBlur=3+coreHit*4;ctx.fillStyle=`rgba(14,184,122,${.9+coreHit*.1})`;ctx.fillText('YOU',cx,cy);ctx.shadowBlur=0;
      coreRot+=.005;
    }

    function drawWeb(){
      edges.forEach(([i,j])=>{
        const a=nodes[i],bx=j===-1?cx:nodes[j].x,by=j===-1?cy:nodes[j].y;
        const dist=Math.hypot(a.x-bx,a.y-by),al=Math.max(0,(1-dist/120)*.18+.025);
        const gr=ctx.createLinearGradient(a.x,a.y,bx,by);
        if(j===-1){gr.addColorStop(0,`rgba(14,184,122,${al*1.4})`);gr.addColorStop(1,'rgba(10,148,99,0)');}
        else{gr.addColorStop(0,`rgba(10,148,99,${al})`);gr.addColorStop(.5,`rgba(5,100,55,${al*.4})`);gr.addColorStop(1,`rgba(10,148,99,${al})`);}
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(bx,by);ctx.strokeStyle=gr;ctx.lineWidth=.4;ctx.stroke();
      });
    }

    function drawNodes(){
      nodes.forEach((nd:any)=>{
        nd.ph+=.009;nd.dPh+=nd.dSpd*16;nd.x=nd.ax+Math.cos(nd.dA+nd.dPh)*nd.dAmp;nd.y=nd.ay+Math.sin(nd.dA*1.3+nd.dPh)*nd.dAmp*.7;
        const ps=1+Math.sin(nd.ph)*.04,r=nd.nr*ps,{x,y}=nd;
        if(nd.flash>0){const fg=ctx.createRadialGradient(x,y,0,x,y,r*4);fg.addColorStop(0,`rgba(14,184,122,${.35*nd.flash})`);fg.addColorStop(1,'rgba(14,184,122,0)');ctx.beginPath();ctx.arc(x,y,r*4,0,Math.PI*2);ctx.fillStyle=fg;ctx.fill();nd.flash=Math.max(0,nd.flash-.07);}
        const gg=ctx.createRadialGradient(x,y,r*.4,x,y,r*2);gg.addColorStop(0,'rgba(14,184,122,.10)');gg.addColorStop(1,'rgba(14,184,122,0)');ctx.beginPath();ctx.arc(x,y,r*2,0,Math.PI*2);ctx.fillStyle=gg;ctx.fill();
        ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,.88)';ctx.fill();ctx.strokeStyle=nd.flash>.2?G1:'rgba(14,184,122,.5)';ctx.lineWidth=.6;ctx.stroke();
      });
    }

    function drawBeams(){
      beams=beams.filter((b:any)=>!b.done);
      beams.forEach((b:any)=>{
        b.t=Math.min(1,b.t+.014);const nd=nodes[b.ni],sx=nd.x,sy=nd.y;
        const cpx=sx*.42+cx*.58+b.ox,cpy=sy*.42+cy*.58+b.oy,tip=bez(b.t,sx,sy,cpx,cpy,cx,cy);
        for(let w=0;w<6;w++){const wt=Math.max(0,b.t-w*.055),wp=bez(wt,sx,sy,cpx,cpy,cx,cy),wA=(1-w/6)*.22,wR=(1-w/6)*4.5,wg=ctx.createRadialGradient(wp.x,wp.y,0,wp.x,wp.y,wR*2);wg.addColorStop(0,`rgba(14,184,122,${wA})`);wg.addColorStop(1,'rgba(14,184,122,0)');ctx.beginPath();ctx.arc(wp.x,wp.y,wR*2,0,Math.PI*2);ctx.fillStyle=wg;ctx.fill();}
        const breathe=1+Math.sin(b.t*Math.PI*2.5)*.35,orbR=5.5*breathe,tg=ctx.createRadialGradient(tip.x,tip.y,0,tip.x,tip.y,orbR*2);
        tg.addColorStop(0,'#fff');tg.addColorStop(.25,G1);tg.addColorStop(.7,'rgba(14,184,122,.35)');tg.addColorStop(1,'rgba(14,184,122,0)');
        ctx.shadowColor=G1;ctx.shadowBlur=10+breathe*4;ctx.beginPath();ctx.arc(tip.x,tip.y,orbR*2,0,Math.PI*2);ctx.fillStyle=tg;ctx.fill();ctx.shadowBlur=0;
        if(b.t>=1){coreHit=1;nd.flash=1;addRipple();spawnPopup(cx+(Math.random()-.5)*40,cy-14+(Math.random()-.5)*16);b.done=true;}
      });
    }

    function drawRipples(){
      ripples=ripples.filter((r:any)=>r.a>.01);
      ripples.forEach((r:any)=>{ctx.strokeStyle=`rgba(14,184,122,${r.a})`;ctx.lineWidth=.6;ctx.strokeRect(cx-r.r,cy-r.r,r.r*2,r.r*2);r.r+=r.spd;r.a*=.9;});
    }

    function drawVignette(){
      const gl=ctx.createLinearGradient(0,0,CW*.5,0);gl.addColorStop(0,'rgba(5,8,16,1)');gl.addColorStop(.72,'rgba(5,8,16,.55)');gl.addColorStop(1,'rgba(5,8,16,0)');ctx.fillStyle=gl;ctx.fillRect(0,0,CW*.5,CH);
      const gb=ctx.createLinearGradient(0,CH*.76,0,CH);gb.addColorStop(0,'rgba(5,8,16,0)');gb.addColorStop(1,'rgba(5,8,16,1)');ctx.fillStyle=gb;ctx.fillRect(0,CH*.76,CW,CH*.24);
      const gt=ctx.createLinearGradient(0,0,0,CH*.06);gt.addColorStop(0,'rgba(5,8,16,1)');gt.addColorStop(1,'rgba(5,8,16,0)');ctx.fillStyle=gt;ctx.fillRect(0,0,CW,CH*.06);
      const gr=ctx.createLinearGradient(CW*.88,0,CW,0);gr.addColorStop(0,'rgba(5,8,16,0)');gr.addColorStop(1,'rgba(5,8,16,1)');ctx.fillStyle=gr;ctx.fillRect(CW*.88,0,CW*.12,CH);
    }

    scatter();
    function loop(ts:number){raf=requestAnimationFrame(loop);ctx.clearRect(0,0,CW,CH);ctx.fillStyle='rgba(5,8,16,.5)';ctx.fillRect(0,0,CW,CH);drawWeb();drawNodes();drawRipples();drawBeams();drawYou();drawVignette();tryFire(ts);}
    raf=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(raf);
  }, []);

  /* ─────────────────────────── LEADERBOARD LIVE ───────────── */
  useEffect(() => {
    const rows = [
      {base:247,bar:78,wr:78,pos:true, drift:0},
      {base:184,bar:71,wr:71,pos:true, drift:0},
      {base:119,bar:65,wr:65,pos:true, drift:0},
      {base:88, bar:63,wr:63,pos:true, drift:0},
      {base:-12,bar:41,wr:41,pos:false,drift:0},
    ] as any[];
    rows.forEach((r:any,i:number)=>{r.pEl=document.getElementById(`pnl${i}`);r.bEl=document.getElementById(`bar${i}`);r.wEl=document.getElementById(`wr${i}`);});
    let last=0,btick=0,raf:number;
    function tick(ts:number){raf=requestAnimationFrame(tick);if(ts-last<800)return;last=ts;btick++;
      rows.forEach((r:any,i:number)=>{if(!r.pEl)return;const bias=r.pos?.62:.36;const move=(Math.random()<bias?1:-1)*(Math.random()*1.5+.3);r.drift=Math.max(r.pos?-20:-30,Math.min(r.pos?35:10,r.drift+move));const val=r.base+Math.round(r.drift);const sign=val>=0?'+':'−';r.pEl.textContent=sign+Math.abs(val)+'%';
        if(r.pos){r.pEl.classList.remove('pnl-flash');void r.pEl.offsetWidth;r.pEl.classList.add('pnl-flash');}
        if(btick%12===i&&r.pos){r.wr=Math.min(r.wr+.35,r.bar+9);r.bEl.style.width=r.wr+'%';r.wEl.textContent=Math.round(r.wr)+'%';}
      });
    }
    raf=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(raf);
  }, []);

  /* ─────────────────────────── CANDLESTICK CHARTS ─────────── */
  useEffect(() => {
    const GREEN='#0EB87A',DIM='rgba(14,184,122,.25)',RED='#F04444',GRID='rgba(255,255,255,.04)',LABEL='rgba(255,255,255,.18)';
    function setup(ref: React.RefObject<HTMLCanvasElement | null>){const el=ref.current;if(!el)return null;const W=el.offsetWidth||160,H=52;el.width=W*devicePixelRatio;el.height=H*devicePixelRatio;el.style.width=W+'px';el.style.height=H+'px';const c=el.getContext('2d')!;c.scale(devicePixelRatio,devicePixelRatio);return{c,W,H};}
    function drawGrid(c:CanvasRenderingContext2D,W:number,H:number){c.strokeStyle=GRID;c.lineWidth=.5;[H*.25,H*.5,H*.75].forEach(y=>{c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();});}
    function drawCandle(c:CanvasRenderingContext2D,x:number,open:number,close:number,high:number,low:number,W:number,H:number,col:string){const sY=(v:number)=>H-H*.1-v*(H*.8);const o=sY(open),cl=sY(close),hi=sY(high),lo=sY(low),bw=W*.06;c.strokeStyle=col;c.lineWidth=1;c.beginPath();c.moveTo(x,hi);c.lineTo(x,lo);c.stroke();c.fillStyle=col;c.fillRect(x-bw/2,Math.min(o,cl),bw,Math.max(Math.abs(o-cl),2));}
    const rafs:number[]=[];

    // Chart 1
    (()=>{const r=setup(cs1Ref);if(!r)return;const{c,W,H}=r;const candles=[{o:.35,cl:.55,hi:.62,lo:.28,col:GREEN},{o:.55,cl:.45,hi:.60,lo:.38,col:RED},{o:.45,cl:.65,hi:.70,lo:.40,col:GREEN},{o:.65,cl:.58,hi:.72,lo:.52,col:RED},{o:.58,cl:.75,hi:.80,lo:.52,col:GREEN}];let t=0;const xs=candles.map((_,i)=>W*.12+i*(W*.76/4));function frame(){c.clearRect(0,0,W,H);drawGrid(c,W,H);t+=.006;candles.forEach((cd,i)=>{const rev=Math.min(1,Math.max(0,(t-i*.35)*2));c.globalAlpha=rev;drawCandle(c,xs[i],cd.o,cd.cl,cd.hi,cd.lo,W,H,cd.col);});c.globalAlpha=1;const last=Math.min(4,Math.floor(t/.35));if(last<5&&Math.sin(t*6)>0){c.fillStyle=GREEN;c.fillRect(xs[last]-1,H*.05,2,H*.85);}if(t<5*.35+1.2)rafs.push(requestAnimationFrame(frame));else{t=0;setTimeout(()=>rafs.push(requestAnimationFrame(frame)),800);}};rafs.push(requestAnimationFrame(frame));})();

    // Chart 2
    (()=>{const r=setup(cs2Ref);if(!r)return;const{c,W,H}=r;let t=0;const sY=(v:number)=>H-H*.1-v*(H*.8);function frame(){c.clearRect(0,0,W,H);drawGrid(c,W,H);t+=.007;const cycle=t%2.5,fill=cycle<1.5?Math.min(1,cycle):Math.max(0,1-(cycle-1.5));const bw=W*.14;c.fillStyle=DIM;c.fillRect(W/2-bw/2,sY(.9),bw,sY(.1)-sY(.9));const top=sY(.1+fill*.8),bot=sY(.1);c.fillStyle=GREEN;c.shadowColor=GREEN;c.shadowBlur=fill*8;c.fillRect(W/2-bw/2,top,bw,bot-top);c.shadowBlur=0;c.strokeStyle=GREEN;c.lineWidth=1;c.beginPath();c.moveTo(W/2,top);c.lineTo(W/2,top-H*.07*fill);c.stroke();c.fillStyle=LABEL;c.font=`7px monospace`;c.textAlign='center';c.textBaseline='top';c.fillText('+$'+(fill*5000|0),W/2,2);rafs.push(requestAnimationFrame(frame));}rafs.push(requestAnimationFrame(frame));})();

    // Chart 3 – KOL picker
    (()=>{const r=setup(cs3Ref);if(!r)return;const{c,W,H}=r;const KOLS=[{ab:'KA',pnl:'+247%',col:'#0EB87A'},{ab:'DW',pnl:'+119%',col:'#60CFFF'},{ab:'SX',pnl:'+184%',col:'#C084FC'},{ab:'BH',pnl:'+88%',col:'#FFB900'},{ab:'MV',pnl:'+61%',col:'#FB923C'}];let tray:number[]=[],t=0,phase='scan' as string,phaseT=0,cursor=0,flyProgress=0,flyIdx=-1,flyStartX=0,flyStartY=0;const ROW_H=H/5.2,AV_R=ROW_H*.38;function drawAv(x:number,y:number,rr:number,kol:any,alpha:number){c.globalAlpha=alpha;c.beginPath();c.arc(x,y,rr,0,Math.PI*2);c.fillStyle=kol.col+'28';c.fill();c.strokeStyle=kol.col;c.lineWidth=.8;c.stroke();c.fillStyle=kol.col;c.font=`600 ${rr*.75}px 'Space Grotesk',sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(kol.ab,x,y);c.globalAlpha=1;}function ease(x:number){return x<.5?2*x*x:-1+(4-2*x)*x;}function frame(){c.clearRect(0,0,W,H);t+=.008;phaseT+=.008;if(phase==='scan'){cursor=Math.min(4,Math.floor(phaseT/.28));if(phaseT>.28*5+.3){phase='pick';phaseT=0;flyIdx=Math.floor(Math.random()*5);flyStartX=AV_R+4;flyStartY=(flyIdx+.5)*ROW_H;flyProgress=0;}}else if(phase==='pick'){flyProgress=Math.min(1,phaseT*2.2);if(flyProgress>=1){tray.push(flyIdx);if(tray.length>=3)tray=[];phase='wait';phaseT=0;}}else if(phase==='wait'){if(phaseT>.6){phase='scan';phaseT=0;cursor=0;}}KOLS.forEach((kol,i)=>{const y=(i+.5)*ROW_H,rowA=(phase==='scan'&&i<=cursor)||(phase==='pick'&&i===flyIdx)?1:.4;if(i===cursor&&phase==='scan'){c.fillStyle='rgba(14,184,122,.08)';c.fillRect(0,i*ROW_H,W,ROW_H);}if(!(phase==='pick'&&i===flyIdx))drawAv(AV_R+4,y,AV_R,kol,rowA);c.globalAlpha=rowA*.85;c.fillStyle=kol.col;c.font=`500 ${ROW_H*.3}px 'Space Mono',monospace`;c.textAlign='left';c.textBaseline='middle';c.fillText(kol.pnl,AV_R*2+10,y);c.globalAlpha=1;if(tray.includes(i)){c.fillStyle=GREEN;c.font=`${ROW_H*.32}px monospace`;c.textAlign='right';c.textBaseline='middle';c.fillText('✓',W-4,y);}});if(phase==='scan'){c.strokeStyle='rgba(14,184,122,.55)';c.lineWidth=.8;c.strokeRect(.5,cursor*ROW_H+.5,W-1,ROW_H-1);}if(phase==='pick'&&flyIdx>=0){const kol=KOLS[flyIdx],ex=W-6,ey=6,midX=(flyStartX+ex)*.5+12,midY=flyStartY*.5,fe=ease(flyProgress),fx=(1-fe)*(1-fe)*flyStartX+2*(1-fe)*fe*midX+fe*fe*ex,fy=(1-fe)*(1-fe)*flyStartY+2*(1-fe)*fe*midY+fe*fe*ey;drawAv(fx,fy,AV_R*(1-fe*.5),kol,1);}rafs.push(requestAnimationFrame(frame));}rafs.push(requestAnimationFrame(frame));})();

    // Chart 4
    (()=>{const r=setup(cs4Ref);if(!r)return;const{c,W,H}=r;const history:any[]=[];let lastY=.4,frameCount=0;function addCandle(){const move=(Math.random()-.3)*.18,open=lastY,close=Math.min(.92,Math.max(.08,open+move));lastY=close;history.push({o:open,cl:close,hi:Math.max(open,close)+Math.random()*.08,lo:Math.min(open,close)-Math.random()*.06,col:close>open?GREEN:RED});if(history.length>7)history.shift();}function frame(){c.clearRect(0,0,W,H);drawGrid(c,W,H);frameCount++;if(frameCount%36===0)addCandle();const n=history.length;history.forEach((cd:any,i:number)=>{const x=W*.08+(i/6)*(W*.84),alpha=.4+(i/n)*.6;c.globalAlpha=alpha;drawCandle(c,x,cd.o,cd.cl,cd.hi,cd.lo,W,H,cd.col);});c.globalAlpha=1;if(history.length>1){c.strokeStyle='rgba(14,184,122,.5)';c.lineWidth=1;c.setLineDash([2,3]);c.beginPath();history.forEach((cd:any,i:number)=>{const x=W*.08+(i/6)*(W*.84),y=H-H*.1-cd.cl*(H*.8);i===0?c.moveTo(x,y):c.lineTo(x,y);});c.stroke();c.setLineDash([]);}if(frameCount%36<3){c.fillStyle=`rgba(14,184,122,${.08*(3-(frameCount%18))})`;c.fillRect(0,0,W,H);}rafs.push(requestAnimationFrame(frame));}addCandle();addCandle();addCandle();rafs.push(requestAnimationFrame(frame));})();

    return ()=>rafs.forEach(r=>cancelAnimationFrame(r));
  }, []);

  /* ─────────────────────────── AIRDROP ANIMATION ─────────── */
  useEffect(() => {
    const el = acRef.current; if (!el) return;
    let raf: number;
    function init() {
      if (!el) return;
      const W=el.offsetWidth,H=el.offsetHeight;if(!W||!H){setTimeout(init,100);return;}
      el.width=W*devicePixelRatio;el.height=H*devicePixelRatio;
      const ctx=el.getContext('2d')!;ctx.scale(devicePixelRatio,devicePixelRatio);
      const GOLD='#FFB900',GOLDA=(a:number)=>`rgba(255,185,0,${a})`;
      const pkgs:any[]=[];
      function spawnPkg(){pkgs.push({x:W*.1+Math.random()*W*.8,y:-26,vy:.5+Math.random()*.28,sway:Math.random()*Math.PI*2,swaySpd:.022+Math.random()*.018,swayAmp:2.2+Math.random()*1.8,landed:false,landTimer:0,dead:false,alpha:1,pts:['+50','+75','+100','+150','+200'][Math.floor(Math.random()*5)],sz:.72+Math.random()*.32});}
      function drawPkg(p:any){const{x,y,sz,alpha}=p;ctx.globalAlpha=alpha;const r=10*sz;ctx.beginPath();ctx.arc(x,y-r*.55,r,Math.PI,0);ctx.fillStyle=GOLDA(.13);ctx.fill();ctx.strokeStyle=GOLD;ctx.lineWidth=.75;ctx.stroke();for(let i=0;i<=4;i++){const a=Math.PI+(i/4)*Math.PI;ctx.beginPath();ctx.moveTo(x,y-r*.55);ctx.lineTo(x+Math.cos(a)*r,y-r*.55+Math.sin(a)*r);ctx.strokeStyle=GOLDA(.38);ctx.lineWidth=.45;ctx.stroke();}const ry=y-r*.55+r,bTop=y+3*sz;[x-r*.5,x+r*.5].forEach(sx=>{ctx.beginPath();ctx.moveTo(sx,ry);ctx.lineTo(x,bTop);ctx.strokeStyle=GOLDA(.3);ctx.lineWidth=.45;ctx.stroke();});const bw=8.5*sz,bh=6.5*sz;ctx.beginPath();(ctx as any).roundRect(x-bw/2,bTop,bw,bh,2);ctx.fillStyle=GOLDA(.16);ctx.fill();ctx.strokeStyle=GOLD;ctx.lineWidth=.85;ctx.stroke();ctx.strokeStyle=GOLDA(.55);ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(x,bTop);ctx.lineTo(x,bTop+bh);ctx.moveTo(x-bw/2,bTop+bh/2);ctx.lineTo(x+bw/2,bTop+bh/2);ctx.stroke();ctx.globalAlpha=1;}
      let t=0,nextSpawn=0;
      function frame(){ctx.clearRect(0,0,W,H);t++;if(t>=nextSpawn){spawnPkg();nextSpawn=t+52+Math.random()*38;}pkgs.forEach((p:any)=>{if(p.dead)return;p.sway+=p.swaySpd;p.x+=Math.sin(p.sway)*p.swayAmp*.055;p.y+=p.vy;if(p.y>H+24){p.dead=true;return;}if(!p.landed&&p.y>H-20)p.landed=true;if(p.landed){p.landTimer++;p.alpha=Math.max(0,1-p.landTimer/28);ctx.globalAlpha=p.alpha;ctx.fillStyle=GOLD;ctx.font=`700 ${7.5*p.sz}px 'Space Mono',monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor=GOLD;ctx.shadowBlur=6;ctx.fillText(p.pts,p.x,H-16-p.landTimer*.65);ctx.shadowBlur=0;ctx.globalAlpha=1;if(p.landTimer>28)p.dead=true;return;}drawPkg(p);});for(let i=pkgs.length-1;i>=0;i--)if(pkgs[i].dead)pkgs.splice(i,1);raf=requestAnimationFrame(frame);}
      spawnPkg();setTimeout(()=>spawnPkg(),400);raf=requestAnimationFrame(frame);
    }
    setTimeout(init,60);
    return ()=>cancelAnimationFrame(raf);
  }, []);

  /* ─────────────────────────────── JSX ────────────────────── */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&family=Share+Tech+Mono&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#050810;display:flex;justify-content:center;}
        .w{font-family:'Space Grotesk',sans-serif;background:#050810;color:#ECE9FF;width:390px;min-height:100vh;position:relative;overflow:hidden;}
        .noise{position:fixed;top:0;left:0;right:0;bottom:0;opacity:.35;pointer-events:none;z-index:100;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");}
        .aurora{position:absolute;top:-120px;left:50%;transform:translateX(-50%);width:520px;height:520px;background:radial-gradient(ellipse 60% 40% at 40% 50%,rgba(14,184,122,.10) 0%,transparent 60%),radial-gradient(ellipse 50% 35% at 65% 45%,rgba(29,158,117,.14) 0%,transparent 60%),radial-gradient(ellipse 40% 30% at 50% 70%,rgba(220,38,38,.05) 0%,transparent 60%);pointer-events:none;animation:drift 8s ease-in-out infinite alternate;}
        @keyframes drift{from{transform:translateX(-50%) scale(1);}to{transform:translateX(-50%) scale(1.08) translateY(10px);}}
        #vc{position:absolute;top:-10px;left:0;right:0;width:390px;height:320px;pointer-events:none;z-index:1;opacity:.72;}
        .nav{display:flex;align-items:center;justify-content:space-between;padding:20px 22px 0;position:relative;z-index:3;}
        .logo{font-size:20px;font-weight:700;letter-spacing:-.5px;}
        .logo span{background:linear-gradient(135deg,#0EB87A,#0A9463);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
        .live-dot{display:flex;align-items:center;gap:6px;font-family:'Space Mono',monospace;font-size:10px;color:#1D9E75;letter-spacing:.5px;}
        .dot{width:7px;height:7px;border-radius:50%;background:#1D9E75;box-shadow:0 0 8px #1D9E75;animation:pulse 1.8s ease-in-out infinite;}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.4;transform:scale(.65);}}
        .hero{padding:40px 22px 0;position:relative;z-index:3;min-height:280px;}
        .badge{display:inline-flex;align-items:center;gap:6px;background:rgba(99,89,255,.12);border:1px solid rgba(99,89,255,.3);border-radius:20px;padding:5px 12px;font-family:'Space Mono',monospace;font-size:9px;color:#A89FFF;letter-spacing:.5px;margin-bottom:18px;white-space:nowrap;}
        .badge-dot{width:5px;height:5px;border-radius:50%;background:#6359FF;box-shadow:0 0 6px #6359FF;}
        h1{font-size:38px;font-weight:700;line-height:1.05;letter-spacing:-1.4px;margin-bottom:16px;max-width:195px;}
        h1 .g{background:linear-gradient(135deg,#6359FF 0%,#1D9E75 60%,#F04444 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
        .btns{display:flex;gap:10px;margin-bottom:40px;position:relative;z-index:3;}
        .btn-p{flex:1;padding:15px 0;background:#fff;color:#0a0f0a;border:none;border-radius:100px;font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:600;cursor:pointer;letter-spacing:-.1px;box-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 2px 12px rgba(0,0,0,.4),0 0 0 1px rgba(255,255,255,.08);transition:transform .15s,box-shadow .15s,background .15s;position:relative;overflow:hidden;}
        .btn-p::after{content:'';position:absolute;inset:0;background:linear-gradient(to bottom,rgba(255,255,255,.06) 0%,rgba(255,255,255,0) 60%);border-radius:100px;pointer-events:none;}
        .btn-p:hover{background:#f0faf5;transform:translateY(-1px);box-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 6px 20px rgba(0,0,0,.45),0 0 24px rgba(14,184,122,.18),0 0 0 1px rgba(255,255,255,.1);}
        .btn-g{flex:1;padding:15px 0;background:transparent;color:rgba(236,233,255,.7);border:1px solid rgba(255,255,255,.1);border-radius:100px;font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:400;cursor:pointer;transition:border-color .15s,color .15s;}
        .btn-g:hover{border-color:rgba(255,255,255,.25);color:rgba(236,233,255,.95);}
        .stats{display:flex;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:18px 0;margin:0 22px 40px;position:relative;z-index:3;}
        .stat{flex:1;text-align:center;}
        .stat-v{font-family:'Space Mono',monospace;font-size:20px;font-weight:700;letter-spacing:-1px;}
        .stat-v.green{color:#1D9E75;}.stat-v.green2{color:#0EB87A;}.stat-v.white{color:#ECE9FF;}
        .stat-l{font-size:10px;color:rgba(236,233,255,.35);margin-top:4px;letter-spacing:.5px;text-transform:uppercase;}
        .sdiv{width:1px;background:rgba(255,255,255,.07);align-self:stretch;}
        .sec-hd{padding:0 22px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;position:relative;z-index:3;}
        .sec-title{font-family:'Space Mono',monospace;font-size:10px;color:rgba(236,233,255,.35);letter-spacing:2px;text-transform:uppercase;}
        .sec-more{font-size:11px;color:#0EB87A;cursor:pointer;border-bottom:1px solid rgba(14,184,122,.3);}
        .lb-wrap{margin:0 22px 40px;background:#0d1117;border:1px solid rgba(14,184,122,.12);border-radius:18px;overflow:hidden;position:relative;z-index:3;}
        .lb-tabs{display:flex;border-bottom:1px solid rgba(14,184,122,.1);padding:0 16px;gap:20px;}
        .lb-tab{font-family:'Space Mono',monospace;font-size:10px;padding:12px 0;color:rgba(255,255,255,.3);letter-spacing:1px;cursor:pointer;border-bottom:2px solid transparent;transition:all .15s;}
        .lb-tab.active{color:#0EB87A;border-bottom-color:#0EB87A;}
        .lb-head{display:grid;grid-template-columns:28px 1fr 64px 70px;padding:10px 16px;gap:8px;border-bottom:1px solid rgba(255,255,255,.05);}
        .lb-hcell{font-family:'Space Mono',monospace;font-size:9px;color:rgba(255,255,255,.2);letter-spacing:1px;text-transform:uppercase;}
        .lb-hcell:last-child,.lb-hcell:nth-child(3){text-align:right;}
        .lb-row{display:grid;grid-template-columns:28px 1fr 64px 70px;padding:13px 16px;gap:8px;align-items:center;border-bottom:1px solid rgba(255,255,255,.05);cursor:pointer;transition:background .12s;}
        .lb-row:last-child{border-bottom:none;}.lb-row:hover{background:rgba(14,184,122,.04);}
        .lb-row:nth-child(1){background:rgba(14,184,122,.05);}.lb-row:nth-child(2){background:rgba(14,184,122,.03);}.lb-row:nth-child(3){background:rgba(14,184,122,.02);}
        .rank{font-family:'Space Mono',monospace;font-size:12px;font-weight:700;text-align:center;}
        .r1{color:#0EB87A;}.r2{color:#0EB87A;opacity:.8;}.r3{color:#0EB87A;opacity:.65;}.r4,.r5{color:rgba(255,255,255,.22);font-size:10px;}
        .trader{display:flex;align-items:center;gap:10px;}
        .av{width:36px;height:36px;border-radius:50%;background:rgba(14,184,122,.12);border:1px solid rgba(14,184,122,.25);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;color:#0EB87A;letter-spacing:.5px;}
        .tn{font-size:13px;font-weight:600;color:#fff;margin-bottom:2px;}.tm{font-family:'Space Mono',monospace;font-size:9px;color:rgba(255,255,255,.28);}
        .pnl-cell{text-align:right;}.pnl{font-family:'Space Mono',monospace;font-size:13px;font-weight:700;}
        .pnl.pos{color:#0EB87A;}.pnl.neg{color:#FF6B6B;}
        .pnl-flash{animation:pnlUp .8s ease-out;}
        @keyframes pnlUp{0%{opacity:.7;}40%{opacity:1;}100%{opacity:1;}}
        .bar-cell{display:flex;flex-direction:column;align-items:flex-end;gap:5px;}
        .wr{font-family:'Space Mono',monospace;font-size:10px;color:rgba(255,255,255,.4);}
        .bar-bg{width:52px;height:3px;background:rgba(255,255,255,.07);border-radius:2px;overflow:hidden;}
        .bar-fill{height:100%;border-radius:2px;background:#0EB87A;transition:width 2.8s cubic-bezier(.25,1,.5,1);}
        .cc-wrap{margin:0 22px 40px;display:grid;grid-template-columns:1fr 1fr;gap:10px;position:relative;z-index:3;}
        .cc-card{border-radius:16px;padding:20px 14px;position:relative;overflow:hidden;}
        .cc-copy{background:linear-gradient(135deg,rgba(29,158,117,.16),rgba(29,158,117,.04));border:1px solid rgba(29,158,117,.28);}
        .cc-counter{background:linear-gradient(135deg,rgba(220,38,38,.14),rgba(220,38,38,.03));border:1px solid rgba(220,38,38,.30);}
        .cc-icon{font-size:22px;margin-bottom:10px;display:flex;align-items:center;}
        .cc-dot{display:inline-block;width:18px;height:18px;border-radius:50%;}
        .cc-dot-g{background:#0EB87A;box-shadow:0 0 8px rgba(14,184,122,.6);}
        .cc-dot-r{background:#F04444;box-shadow:0 0 8px rgba(240,68,68,.6);}
        .cc-name{font-size:13px;font-weight:700;margin-bottom:5px;}
        .cc-copy .cc-name{color:#1D9E75;}.cc-counter .cc-name{color:#F04444;}
        .cc-desc{font-size:11px;color:rgba(236,233,255,.45);line-height:1.5;}
        .cc-glow-c{position:absolute;bottom:-20px;right:-20px;width:80px;height:80px;background:radial-gradient(circle,rgba(29,158,117,.2),transparent 70%);}
        .cc-glow-f{position:absolute;bottom:-20px;right:-20px;width:80px;height:80px;background:radial-gradient(circle,rgba(220,38,38,.20),transparent 70%);}
        .hiw{margin:0 22px 40px;position:relative;z-index:3;}
        .hiw-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
        .hiw-card{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:14px 14px 16px;position:relative;overflow:hidden;}
        .hiw-chart{display:block;width:100%;height:52px;margin-bottom:12px;}
        .hiw-num{font-family:'Space Mono',monospace;font-size:9px;color:rgba(14,184,122,.6);letter-spacing:1px;margin-bottom:5px;}
        .hiw-label{font-size:12px;font-weight:600;color:#ECE9FF;}
        .trust{margin:0 22px 40px;display:grid;grid-template-columns:1fr 1fr;gap:8px;position:relative;z-index:3;}
        .tc{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:18px 14px;position:relative;overflow:hidden;transition:border-color .2s;}
        .tc:hover{border-color:rgba(255,255,255,.12);}
        .tc-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:17px;margin-bottom:12px;}
        .tc-icon.exit{background:rgba(14,184,122,.12);}.tc-icon.sleep{background:rgba(29,158,117,.15);}.tc-icon.pts{background:rgba(255,185,0,.12);}.tc-icon.stats{background:rgba(220,38,38,.12);}
        .tc-title{font-size:12px;font-weight:600;color:#ECE9FF;margin-bottom:5px;line-height:1.3;}
        .tc::after{content:'';position:absolute;bottom:-16px;right:-16px;width:60px;height:60px;border-radius:50%;opacity:.5;}
        .tc:nth-child(1)::after{background:radial-gradient(circle,rgba(14,184,122,.18),transparent 70%);}
        .tc:nth-child(2)::after{background:radial-gradient(circle,rgba(29,158,117,.25),transparent 70%);}
        .tc:nth-child(3)::after{background:radial-gradient(circle,rgba(255,185,0,.2),transparent 70%);}
        .tc:nth-child(4)::after{background:radial-gradient(circle,rgba(220,38,38,.22),transparent 70%);}
        .bcta{margin:0 22px 56px;background:linear-gradient(135deg,#0A9463 0%,#076B34 100%);border-radius:18px;padding:24px 20px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;position:relative;overflow:hidden;z-index:3;}
        .bcta::before{content:'';position:absolute;top:-40px;right:-40px;width:120px;height:120px;background:rgba(255,255,255,.08);border-radius:50%;}
        .bcta-l{position:relative;}.bcta-title{font-size:17px;font-weight:700;color:#fff;margin-bottom:3px;}.bcta-sub{font-size:11px;color:rgba(255,255,255,.65);}
        .bcta-arr{width:42px;height:42px;background:rgba(255,255,255,.15);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;color:#fff;flex-shrink:0;transition:transform .2s;}
        .bcta:hover .bcta-arr{transform:translateX(3px);}
      `}</style>

      <div className="w">
        <div className="noise" />
        <div className="aurora" />
        <canvas id="vc" ref={vcRef} />
        <div ref={vpRef} style={{position:'absolute',top:0,left:0,width:390,height:320,pointerEvents:'none',zIndex:2,overflow:'hidden'}} />

        <nav className="nav">
          <div className="logo">Hyper<span>Copy</span></div>
          <div className="live-dot"><div className="dot" />LIVE ON HL L1</div>
        </nav>

        <div className="hero">
          <div className="badge"><div className="badge-dot" />1000+ KOLs · Live on HL L1</div>
          <h1>Trade like<br />the best.<br /><span className="g">Automatically.</span></h1>
          <div className="btns">
            <button className="btn-p">Start copying →</button>
            <button className="btn-g">How it works</button>
          </div>
        </div>

        <div className="stats">
          <div className="stat"><div className="stat-v green2">1000+</div><div className="stat-l">KOLs</div></div>
          <div className="sdiv" />
          <div className="stat"><div className="stat-v green">$0</div><div className="stat-l">Withdraw fee</div></div>
          <div className="sdiv" />
          <div className="stat"><div className="stat-v white">8</div><div className="stat-l">Chains</div></div>
          <div className="sdiv" />
          <div className="stat"><div className="stat-v green">15s</div><div className="stat-l">To order</div></div>
        </div>

        <div className="sec-hd">
          <div className="sec-title">Leaderboard · 7d</div>
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
            {rank:'1',rc:'r1',ab:'KA',name:'KingAlpha',sigs:'312 signals',pnl:'+247%',pos:true,wr:'78%',ww:78,id:0},
            {rank:'2',rc:'r2',ab:'SX',name:'SolXpert',sigs:'189 signals',pnl:'+184%',pos:true,wr:'71%',ww:71,id:1},
            {rank:'3',rc:'r3',ab:'DW',name:'DegenWatch',sigs:'441 signals',pnl:'+119%',pos:true,wr:'65%',ww:65,id:2},
            {rank:'4',rc:'r4',ab:'BH',name:'BTCHunter',sigs:'227 signals',pnl:'+88%',pos:true,wr:'63%',ww:63,id:3},
            {rank:'5',rc:'r5',ab:'RB',name:'RugnBull',sigs:'98 signals',pnl:'−12%',pos:false,wr:'41%',ww:41,id:4},
          ].map(r=>(
            <div key={r.id} className="lb-row">
              <div className={`rank ${r.rc}`}>{r.rank}</div>
              <div className="trader"><div className="av">{r.ab}</div><div><div className="tn">{r.name}</div><div className="tm">{r.sigs}</div></div></div>
              <div className="pnl-cell"><div className={`pnl ${r.pos?'pos':'neg'}`} id={`pnl${r.id}`}>{r.pnl}</div></div>
              <div className="bar-cell"><div className="wr" id={`wr${r.id}`}>{r.wr}</div><div className="bar-bg"><div className="bar-fill" id={`bar${r.id}`} style={{width:`${r.ww}%`}} /></div></div>
            </div>
          ))}
        </div>

        <div className="cc-wrap">
          <div className="cc-card cc-copy">
            <div className="cc-icon"><span className="cc-dot cc-dot-g" /></div>
            <div className="cc-name">Copy Trade</div>
            <div className="cc-desc">Mirror top KOLs automatically.</div>
            <div className="cc-glow-c" />
          </div>
          <div className="cc-card cc-counter">
            <div className="cc-icon"><span className="cc-dot cc-dot-r" /></div>
            <div className="cc-name">Counter Trade</div>
            <div className="cc-desc">Profit when bad callers are wrong.</div>
            <div className="cc-glow-f" />
          </div>
        </div>

        <div className="sec-hd"><div className="sec-title">How it works</div></div>
        <div className="hiw">
          <div className="hiw-grid">
            {[{id:'cs1',n:'01',label:'Connect wallet',ref:cs1Ref},{id:'cs2',n:'02',label:'Deposit USDC',ref:cs2Ref},{id:'cs3',n:'03',label:'Pick KOLs',ref:cs3Ref},{id:'cs4',n:'04',label:'Trades fire in 15s',ref:cs4Ref}].map(c=>(
              <div key={c.id} className="hiw-card">
                <canvas className="hiw-chart" id={c.id} ref={c.ref} />
                <div className="hiw-num">{c.n}</div>
                <div className="hiw-label">{c.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="trust">
          <div className="tc"><div className="tc-icon exit"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="#0EB87A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div><div className="tc-title">Custom exits</div></div>
          <div className="tc"><div className="tc-icon sleep"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5" stroke="#0EB87A" strokeWidth="1.5"/><path d="M8 5v3l2 2" stroke="#0EB87A" strokeWidth="1.5" strokeLinecap="round"/></svg></div><div className="tc-title">24/7 automation</div></div>
          <div className="tc" style={{position:'relative'}}>
            <canvas ref={acRef} style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',borderRadius:16,pointerEvents:'none'}} />
            <div style={{position:'relative',zIndex:1}}><div className="tc-icon pts"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2l1.5 4h4l-3.2 2.4 1.2 4L8 10l-3.5 2.4 1.2-4L2.5 6h4z" stroke="#FFB900" strokeWidth="1.3" strokeLinejoin="round"/></svg></div><div className="tc-title">Earn points</div></div>
          </div>
          <div className="tc"><div className="tc-icon stats"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="9" width="3" height="5" rx="1" stroke="#0EB87A" strokeWidth="1.3"/><rect x="6.5" y="5" width="3" height="9" rx="1" stroke="#0EB87A" strokeWidth="1.3"/><rect x="11" y="2" width="3" height="12" rx="1" stroke="#0EB87A" strokeWidth="1.3"/></svg></div><div className="tc-title">KOL analytics</div></div>
        </div>

        <div className="bcta">
          <div className="bcta-l">
            <div className="bcta-title">Start for free</div>
            <div className="bcta-sub">Zero fees · Live on HyperLiquid</div>
          </div>
          <div className="bcta-arr">→</div>
        </div>
      </div>
    </>
  );
}