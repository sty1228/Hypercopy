"use client";

import { useEffect, useRef, useMemo, useState, useCallback, Suspense } from "react";
import Image from "next/image";
import logoIcon from "@/assets/icons/logo.png";
import { usePrivy } from "@privy-io/react-auth";
import { FullScreenLoader } from "@/components/ui/fullscreen-loader";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { createOrGetWallet, getWalletBalance } from "@/service";
import DepositSheet from "@/app/dashboard/components/DepositSheet";

/* ─── Canvas network animation ─── */
const NetworkCanvas = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d") as CanvasRenderingContext2D; if (!ctx) return;
    const CW = 220, CH = 280; cv.width = CW; cv.height = CH;
    const cx = CW * 0.58, cy = CH * 0.42;
    const G1 = "#6359FF";
    const N = 14;
    let nodes: any[] = [], edges: [number,number][] = [], beams: any[] = [], ripples: any[] = [];
    let lastFire = 0, coreRot = 0, coreHit = 0, corePulse = 0, rafId: number;

    function scatter() {
      nodes = [];
      for (let i = 0; i < N; i++) {
        let x = 0, y = 0, t = 0;
        do { const a = Math.random()*Math.PI*2, r = 18+Math.pow(Math.random(),.5)*70; x=cx+Math.cos(a)*r; y=cy+Math.sin(a)*r; t++; }
        while (t<80 && (nodes.some((n:any)=>Math.hypot(n.ax-x,n.ay-y)<20) || x<8||x>CW-8||y<8||y>CH-8));
        nodes.push({ax:x,ay:y,x,y,dA:Math.random()*Math.PI*2,dSpd:.0004+Math.random()*.0005,dAmp:4+Math.random()*6,dPh:Math.random()*Math.PI*2,nr:4.5+Math.random()*2.5,flash:0,ph:Math.random()*Math.PI*2});
      }
      const seen=new Set<string>();
      nodes.forEach((_:any,i:number)=>{
        let c=0,a=0;
        while(c<3&&a<30){a++;const j=Math.floor(Math.random()*N);if(j===i)continue;const k=i<j?`${i}-${j}`:`${j}-${i}`;if(seen.has(k))continue;seen.add(k);edges.push([i,j]);c++;}
        if(Math.random()<.4)edges.push([i,-1]);
      });
    }

    const bez=(t:number,x0:number,y0:number,x1:number,y1:number,x2:number,y2:number)=>{const m=1-t;return{x:m*m*x0+2*m*t*x1+t*t*x2,y:m*m*y0+2*m*t*y1+t*t*y2};};

    function tryFire(ts:number){
      if(ts-lastFire<1200+Math.random()*900)return;lastFire=ts;
      const busy=new Set(beams.map((b:any)=>b.ni));
      const pool=nodes.map((_:any,i:number)=>i).filter((i:number)=>!busy.has(i));
      if(!pool.length)return;
      const ni=pool[Math.floor(Math.random()*pool.length)];
      beams.push({ni,t:0,done:false,ox:(Math.random()-.5)*36,oy:(Math.random()-.5)*36});
    }

    function drawYou(){
      corePulse+=.04;coreHit=Math.max(0,coreHit-.045);
      const ps=1+Math.sin(corePulse)*.07+coreHit*.2,S=8*ps;
      const mg=ctx.createRadialGradient(cx,cy,S*.3,cx,cy,S*5);
      mg.addColorStop(0,`rgba(99,89,255,${.22+coreHit*.15})`);mg.addColorStop(.5,`rgba(29,158,117,${.08+coreHit*.04})`);mg.addColorStop(1,"rgba(99,89,255,0)");
      ctx.beginPath();ctx.arc(cx,cy,S*5,0,Math.PI*2);ctx.fillStyle=mg;ctx.fill();
      ctx.save();ctx.translate(cx,cy);ctx.rotate(coreRot);
      ctx.strokeStyle=`rgba(99,89,255,${.28+coreHit*.32})`;ctx.lineWidth=.5;ctx.setLineDash([2,3]);ctx.strokeRect(-S-5,-S-5,(S+5)*2,(S+5)*2);ctx.setLineDash([]);
      ctx.rotate(-coreRot*1.7);ctx.strokeStyle=`rgba(29,158,117,${.15+coreHit*.18})`;ctx.lineWidth=.4;ctx.setLineDash([1,5]);ctx.strokeRect(-S-10,-S-10,(S+10)*2,(S+10)*2);ctx.setLineDash([]);
      ctx.rotate(coreRot*.8);const sb=S+15,bl=3;ctx.strokeStyle=`rgba(99,89,255,${.45+coreHit*.3})`;ctx.lineWidth=.8;
      [[[-sb,-sb+bl],[-sb,-sb],[-sb+bl,-sb]],[[sb-bl,-sb],[sb,-sb],[sb,-sb+bl]],[[sb,sb-bl],[sb,sb],[sb-bl,sb]],[[-sb+bl,sb],[-sb,sb],[-sb,sb-bl]]].forEach(pts=>{ctx.beginPath();pts.forEach(([px,py]:number[],idx:number)=>idx===0?ctx.moveTo(px,py):ctx.lineTo(px,py));ctx.stroke();});
      ctx.restore();
      const cg=ctx.createLinearGradient(cx-S,cy-S,cx+S,cy+S);cg.addColorStop(0,"rgba(10,8,30,.97)");cg.addColorStop(1,"rgba(5,8,16,.97)");
      ctx.fillStyle=cg;ctx.fillRect(cx-S,cy-S,S*2,S*2);
      ctx.strokeStyle=`rgba(99,89,255,${.65+coreHit*.3})`;ctx.lineWidth=.8+coreHit*.5;ctx.strokeRect(cx-S,cy-S,S*2,S*2);
      ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="400 4.5px monospace";ctx.shadowColor=G1;ctx.shadowBlur=3+coreHit*4;ctx.fillStyle=`rgba(168,159,255,${.9+coreHit*.1})`;ctx.fillText("YOU",cx,cy);ctx.shadowBlur=0;
      coreRot+=.005;
    }

    function drawWeb(){
      edges.forEach(([i,j])=>{
        const a=nodes[i],bx=j===-1?cx:nodes[j].x,by=j===-1?cy:nodes[j].y;
        const dist=Math.hypot(a.x-bx,a.y-by),al=Math.max(0,(1-dist/110)*.18+.02);
        const gr=ctx.createLinearGradient(a.x,a.y,bx,by);
        if(j===-1){gr.addColorStop(0,`rgba(99,89,255,${al*1.4})`);gr.addColorStop(1,"rgba(99,89,255,0)");}
        else{gr.addColorStop(0,`rgba(29,158,117,${al})`);gr.addColorStop(.5,`rgba(29,158,117,${al*.3})`);gr.addColorStop(1,`rgba(99,89,255,${al})`);}
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(bx,by);ctx.strokeStyle=gr;ctx.lineWidth=.4;ctx.stroke();
      });
    }

    function drawNodes(){
      nodes.forEach((nd:any)=>{
        nd.ph+=.018;nd.dPh+=nd.dSpd*16;nd.x=nd.ax+Math.cos(nd.dA+nd.dPh)*nd.dAmp;nd.y=nd.ay+Math.sin(nd.dA*1.3+nd.dPh)*nd.dAmp*.7;
        const r=nd.nr*(1+Math.sin(nd.ph)*.04);const{x,y}=nd;
        if(nd.flash>0){const fg=ctx.createRadialGradient(x,y,0,x,y,r*4);fg.addColorStop(0,`rgba(99,89,255,${.35*nd.flash})`);fg.addColorStop(1,"rgba(99,89,255,0)");ctx.beginPath();ctx.arc(x,y,r*4,0,Math.PI*2);ctx.fillStyle=fg;ctx.fill();nd.flash=Math.max(0,nd.flash-.07);}
        const gg=ctx.createRadialGradient(x,y,r*.4,x,y,r*2);gg.addColorStop(0,"rgba(99,89,255,.12)");gg.addColorStop(1,"rgba(99,89,255,0)");ctx.beginPath();ctx.arc(x,y,r*2,0,Math.PI*2);ctx.fillStyle=gg;ctx.fill();
        ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle="rgba(236,233,255,.85)";ctx.fill();ctx.strokeStyle=nd.flash>.2?G1:"rgba(99,89,255,.5)";ctx.lineWidth=.6;ctx.stroke();
      });
    }

    function drawBeams(){
      beams=beams.filter((b:any)=>!b.done);
      beams.forEach((b:any)=>{
        b.t=Math.min(1,b.t+.036);const nd=nodes[b.ni];const sx=nd.x,sy=nd.y;
        const cpx=sx*.4+cx*.6+b.ox,cpy=sy*.4+cy*.6+b.oy;
        const tip=bez(b.t,sx,sy,cpx,cpy,cx,cy),tailT=Math.max(0,b.t-.3),tail=bez(tailT,sx,sy,cpx,cpy,cx,cy);
        ctx.beginPath();let first=true;
        for(let k=0;k<=22;k++){const st=tailT+(b.t-tailT)*(k/22);const p=bez(st,sx,sy,cpx,cpy,cx,cy);first?(ctx.moveTo(p.x,p.y),first=false):ctx.lineTo(p.x,p.y);}
        const lg=ctx.createLinearGradient(tail.x,tail.y,tip.x,tip.y);lg.addColorStop(0,"rgba(99,89,255,0)");lg.addColorStop(.5,"rgba(99,89,255,.45)");lg.addColorStop(1,G1);
        ctx.strokeStyle=lg;ctx.lineWidth=1.2;ctx.lineCap="round";ctx.shadowColor=G1;ctx.shadowBlur=5;ctx.stroke();ctx.shadowBlur=0;
        const tg=ctx.createRadialGradient(tip.x,tip.y,0,tip.x,tip.y,5);tg.addColorStop(0,"#fff");tg.addColorStop(.4,G1);tg.addColorStop(1,"rgba(99,89,255,0)");
        ctx.beginPath();ctx.arc(tip.x,tip.y,5,0,Math.PI*2);ctx.fillStyle=tg;ctx.fill();
        if(b.t>=1){coreHit=1;nd.flash=1;ripples.push({r:4,a:.6,spd:2.4},{r:10,a:.3,spd:3.6});b.done=true;}
      });
    }

    function drawRipples(){
      ripples=ripples.filter((r:any)=>r.a>.01);
      ripples.forEach((r:any)=>{ctx.strokeStyle=`rgba(99,89,255,${r.a})`;ctx.lineWidth=.6;ctx.strokeRect(cx-r.r,cy-r.r,r.r*2,r.r*2);r.r+=r.spd;r.a*=.90;});
    }

    function drawVignette(){
      [[0,0,CW*.35,0,"rgba(5,8,16,1)","rgba(5,8,16,0)",0,0,CW*.35,CH],[0,CH*.72,0,CH,"rgba(5,8,16,0)","rgba(5,8,16,1)",0,CH*.72,CW,CH*.28],[0,0,0,CH*.08,"rgba(5,8,16,1)","rgba(5,8,16,0)",0,0,CW,CH*.08],[CW*.75,0,CW,0,"rgba(5,8,16,0)","rgba(5,8,16,1)",CW*.75,0,CW*.25,CH]].forEach(([x1,y1,x2,y2,c1,c2,rx,ry,rw,rh])=>{
        const g=ctx.createLinearGradient(x1 as number,y1 as number,x2 as number,y2 as number);g.addColorStop(0,c1 as string);g.addColorStop(1,c2 as string);ctx.fillStyle=g;ctx.fillRect(rx as number,ry as number,rw as number,rh as number);
      });
    }

    scatter();
    function loop(ts:number){rafId=requestAnimationFrame(loop);ctx.clearRect(0,0,CW,CH);ctx.fillStyle="rgba(5,8,16,.55)";ctx.fillRect(0,0,CW,CH);drawWeb();drawNodes();drawRipples();drawBeams();drawYou();drawVignette();tryFire(ts);}
    rafId=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(rafId);
  }, []);
  return <canvas ref={ref} style={{position:"absolute",top:-10,right:-20,width:220,height:280,pointerEvents:"none",zIndex:1,opacity:.8}} />;
};

/* ─── Terms Sheet ─── */
const TermsSheet = ({isOpen,onClose}:{isOpen:boolean;onClose:()=>void}) => {
  if (!isOpen) return null;
  const sections = [
    ["1. Custodial Wallet Arrangement","HyperCopy generates a dedicated trading wallet on your behalf. Private keys are encrypted and stored by the Platform. You acknowledge this custodial model carries inherent risk including potential loss of funds due to security breaches, technical failures, or operational errors."],
    ["2. Trading Risks","Copy trading involves automatically replicating trades from KOL social media signals. You accept that: (a) past performance doesn't guarantee future results; (b) you may lose some or all deposited funds; (c) leveraged perpetual futures amplifies gains and losses; (d) AI signal detection may be inaccurate or delayed."],
    ["3. Fees","HyperCopy charges a builder fee of 0.1% (10 basis points) per trade. Deposits and zero-fee withdrawals incur no additional charge, though cross-chain bridging may involve minimal network fees (~0.06%)."],
    ["4. Not Investment Advice","Nothing on the Platform constitutes financial, investment, legal, or tax advice. All trading decisions are made at your own risk. Consult qualified professionals before making financial decisions."],
    ["5. Eligibility","You represent that you are at least 18 years old and that use of cryptocurrency trading platforms is not prohibited in your jurisdiction."],
    ["6. Service Availability","HyperCopy is provided \"as is\" and \"as available\". We do not guarantee uninterrupted operation and are not liable for losses from service interruptions."],
    ["7. Limitation of Liability","To the maximum extent permitted by law, HyperCopy and its operators are not liable for direct, indirect, incidental, consequential, or punitive damages from your use of the Platform."],
    ["8. Changes to Terms","HyperCopy reserves the right to modify these terms at any time. Continued use constitutes acceptance of the revised terms."],
  ];
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.65)",backdropFilter:"blur(6px)"}} />
      <div style={{position:"relative",width:"100%",maxWidth:480,maxHeight:"80vh",borderRadius:"20px 20px 0 0",display:"flex",flexDirection:"column",background:"linear-gradient(180deg,#0d0b24,#050810)",border:"1px solid rgba(99,89,255,.2)",borderBottom:"none"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"center",padding:"12px 0 8px"}}><div style={{width:40,height:4,borderRadius:2,background:"rgba(236,233,255,.15)"}} /></div>
        <div style={{padding:"0 24px 12px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontFamily:"'Space Mono',monospace",fontSize:12,color:"#A89FFF",letterSpacing:"1.5px",fontWeight:700}}>TERMS OF SERVICE</span>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:"50%",background:"rgba(99,89,255,.1)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(236,233,255,.5)" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div style={{padding:"0 24px 32px",overflowY:"auto",color:"rgba(236,233,255,.6)",fontSize:13,lineHeight:1.7}}>
          <p style={{color:"rgba(236,233,255,.3)",fontSize:11,marginBottom:16}}>Last updated: February 28, 2026</p>
          <p style={{marginBottom:12}}>By using HyperCopy (&quot;the Platform&quot;), you acknowledge and agree to the following terms. Please read them carefully before depositing funds or enabling copy trading.</p>
          {sections.map(([title,body])=>(
            <div key={title} style={{marginBottom:16}}>
              <p style={{color:"#A89FFF",fontWeight:600,fontSize:12,marginBottom:4,fontFamily:"'Space Mono',monospace"}}>{title}</p>
              <p>{body}</p>
            </div>
          ))}
          <p style={{color:"rgba(236,233,255,.3)",fontSize:11,marginTop:12}}>Questions? support@hypercopy.io</p>
        </div>
      </div>
    </div>
  );
};

/* ─── Main page ─── */
const OnboardingContent = () => {
  const {ready,login,authenticated} = usePrivy();
  const router = useRouter();
  const from = useSearchParams().get("from") as string|null;
  const [walletReady,setWalletReady] = useState(false);
  const [showDeposit,setShowDeposit] = useState(false);
  const [showTerms,setShowTerms] = useState(false);
  const [hasBalance,setHasBalance] = useState(false);
  const howItWorksRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{if(authenticated&&from&&from!=="orderPlace")router.push(from);},[from,authenticated,router]);
  useEffect(()=>{
    if(!authenticated){setWalletReady(false);return;}
    createOrGetWallet().then(()=>setWalletReady(true)).catch(()=>setWalletReady(true));
  },[authenticated]);
  useEffect(()=>{
    if(!authenticated||!walletReady)return;
    getWalletBalance().then(b=>{if(b.hl_equity>0||b.arb_usdc>0)setHasBalance(true);}).catch(()=>{});
  },[authenticated,walletReady]);
  useEffect(()=>{
    if(authenticated&&walletReady&&hasBalance){
      toast.success("Welcome back! Redirecting...");
      const t=setTimeout(()=>router.push("/dashboard"),1000);
      return ()=>clearTimeout(t);
    }
  },[authenticated,walletReady,hasBalance,router]);

  const currentStep = useMemo(()=>(!authenticated||!walletReady?0:1),[authenticated,walletReady]);
  const primaryLabel = useMemo(()=>{
    if(!authenticated)return"GET STARTED →";
    if(!walletReady)return"SETTING UP...";
    return"DEPOSIT & START TRADING →";
  },[authenticated,walletReady]);

  const handlePrimary = ()=>{if(!authenticated){login();return;}if(walletReady)setShowDeposit(true);};
  const handleDepositSuccess = useCallback(()=>{toast.success("Deposit started! Redirecting...");setTimeout(()=>router.push("/dashboard"),1500);},[router]);
  const scrollToHiw = ()=>howItWorksRef.current?.scrollIntoView({behavior:"smooth"});

  if(!ready)return <FullScreenLoader/>;

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#050810;display:flex;justify-content:center;}
    .ob-w{font-family:'Space Grotesk',sans-serif;background:#050810;color:#ECE9FF;width:100%;max-width:480px;min-height:100vh;position:relative;overflow-x:hidden;}
    .ob-noise{position:fixed;top:0;left:0;right:0;bottom:0;opacity:.35;pointer-events:none;z-index:100;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");}
    .ob-aurora{position:absolute;top:-120px;left:50%;transform:translateX(-50%);width:520px;height:520px;background:radial-gradient(ellipse 60% 40% at 40% 50%,rgba(99,89,255,.18) 0%,transparent 60%),radial-gradient(ellipse 50% 35% at 65% 45%,rgba(29,158,117,.14) 0%,transparent 60%),radial-gradient(ellipse 40% 30% at 50% 70%,rgba(217,70,239,.08) 0%,transparent 60%);pointer-events:none;animation:ob-drift 8s ease-in-out infinite alternate;}
    @keyframes ob-drift{from{transform:translateX(-50%) scale(1);}to{transform:translateX(-50%) scale(1.08) translateY(10px);}}
    .ob-nav{display:flex;align-items:center;justify-content:space-between;padding:20px 22px 0;position:relative;z-index:3;}
    .ob-live{display:flex;align-items:center;gap:6px;font-family:'Space Mono',monospace;font-size:10px;color:#1D9E75;letter-spacing:.5px;}
    .ob-dot{width:7px;height:7px;border-radius:50%;background:#1D9E75;box-shadow:0 0 8px #1D9E75;animation:ob-pulse 1.8s ease-in-out infinite;}
    @keyframes ob-pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.4;transform:scale(.65);}}
    .ob-hero{padding:40px 22px 0;position:relative;z-index:3;min-height:280px;}
    .ob-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(99,89,255,.12);border:1px solid rgba(99,89,255,.3);border-radius:20px;padding:5px 12px;font-family:'Space Mono',monospace;font-size:9px;color:#A89FFF;letter-spacing:.5px;margin-bottom:18px;white-space:nowrap;}
    .ob-badge-dot{width:5px;height:5px;border-radius:50%;background:#6359FF;box-shadow:0 0 6px #6359FF;}
    .ob-h1{font-size:38px;font-weight:700;line-height:1.05;letter-spacing:-1.4px;margin-bottom:16px;max-width:220px;}
    .ob-g{background:linear-gradient(135deg,#6359FF 0%,#1D9E75 60%,#D946EF 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
    .ob-sub{font-size:14px;font-weight:400;color:rgba(236,233,255,.5);line-height:1.65;margin-bottom:28px;max-width:260px;}
    .ob-sub strong{color:rgba(236,233,255,.8);font-weight:500;}
    .ob-btns{display:flex;gap:10px;margin-bottom:32px;position:relative;z-index:3;padding:0 22px;}
    .ob-btn-p{flex:1;padding:16px 0;background:linear-gradient(135deg,#6359FF,#4F47CC);color:#fff;border:none;border-radius:14px;font-family:'Space Mono',monospace;font-size:12px;font-weight:700;letter-spacing:1px;cursor:pointer;box-shadow:0 8px 24px rgba(99,89,255,.35);transition:transform .15s,box-shadow .15s;position:relative;overflow:hidden;}
    .ob-btn-p:disabled{opacity:.6;cursor:not-allowed;}
    .ob-btn-p:not(:disabled):hover{transform:translateY(-2px);box-shadow:0 14px 30px rgba(99,89,255,.45);}
    .ob-btn-p::after{content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent);animation:ob-shimmer 2.5s ease-in-out infinite;}
    @keyframes ob-shimmer{0%{left:-100%;}100%{left:200%;}}
    .ob-btn-g{flex:1;padding:16px 0;background:transparent;color:#ECE9FF;border:1px solid rgba(236,233,255,.15);border-radius:14px;font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:border-color .15s;}
    .ob-btn-g:hover{border-color:rgba(236,233,255,.4);}
    .ob-stats{display:flex;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:18px 0;margin:0 22px 40px;position:relative;z-index:3;}
    .ob-stat{flex:1;text-align:center;}
    .ob-stat-v{font-family:'Space Mono',monospace;font-size:20px;font-weight:700;letter-spacing:-1px;}
    .ob-stat-l{font-size:10px;color:rgba(236,233,255,.35);margin-top:4px;letter-spacing:.5px;text-transform:uppercase;}
    .ob-sdiv{width:1px;background:rgba(255,255,255,.07);align-self:stretch;}
    .ob-sec-hd{padding:0 22px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;position:relative;z-index:3;}
    .ob-sec-title{font-family:'Space Mono',monospace;font-size:10px;color:rgba(236,233,255,.35);letter-spacing:2px;text-transform:uppercase;}
    .ob-sec-more{font-size:11px;color:#6359FF;cursor:pointer;border-bottom:1px solid rgba(99,89,255,.3);}
    .ob-lb{margin:0 22px 40px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:18px;overflow:hidden;position:relative;z-index:3;}
    .ob-lb-tabs{display:flex;border-bottom:1px solid rgba(255,255,255,.06);padding:0 16px;gap:20px;}
    .ob-lb-tab{font-family:'Space Mono',monospace;font-size:10px;padding:12px 0;color:rgba(236,233,255,.35);letter-spacing:1px;cursor:pointer;border-bottom:2px solid transparent;transition:all .15s;}
    .ob-lb-tab.active{color:#6359FF;border-bottom-color:#6359FF;}
    .ob-lb-head{display:grid;grid-template-columns:28px 1fr 64px 70px;padding:10px 16px;gap:8px;border-bottom:1px solid rgba(255,255,255,.04);}
    .ob-lb-hc{font-family:'Space Mono',monospace;font-size:9px;color:rgba(236,233,255,.2);letter-spacing:1px;text-transform:uppercase;}
    .ob-lb-hc:last-child,.ob-lb-hc:nth-child(3){text-align:right;}
    .ob-lb-row{display:grid;grid-template-columns:28px 1fr 64px 70px;padding:12px 16px;gap:8px;align-items:center;border-bottom:1px solid rgba(255,255,255,.04);cursor:pointer;transition:background .12s;}
    .ob-lb-row:last-child{border-bottom:none;}.ob-lb-row:hover{background:rgba(255,255,255,.04);}
    .ob-rank{font-family:'Space Mono',monospace;font-size:12px;font-weight:700;text-align:center;}
    .ob-r1{color:#FFB900;}.ob-r2{color:#B0B0B0;}.ob-r3{color:#CD7F32;}.ob-r4,.ob-r5{color:rgba(236,233,255,.22);font-size:10px;}
    .ob-av{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;}
    .ob-tn{font-size:13px;font-weight:600;color:#ECE9FF;margin-bottom:1px;}.ob-tm{font-family:'Space Mono',monospace;font-size:9px;color:rgba(236,233,255,.3);}
    .ob-pnl{font-family:'Space Mono',monospace;font-size:13px;font-weight:700;text-align:right;}
    .ob-pos{color:#1D9E75;}.ob-neg{color:#F09595;}
    .ob-bar-bg{width:52px;height:3px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden;}
    .ob-bar-fill{height:100%;border-radius:2px;}
    .ob-cc{margin:0 22px 40px;display:grid;grid-template-columns:1fr 1fr;gap:10px;position:relative;z-index:3;}
    .ob-cc-card{border-radius:16px;padding:20px 14px;position:relative;overflow:hidden;}
    .ob-cc-copy{background:linear-gradient(135deg,rgba(29,158,117,.16),rgba(29,158,117,.04));border:1px solid rgba(29,158,117,.28);}
    .ob-cc-counter{background:linear-gradient(135deg,rgba(217,70,239,.16),rgba(217,70,239,.04));border:1px solid rgba(217,70,239,.28);}
    .ob-cc-icon{font-size:22px;margin-bottom:10px;}
    .ob-cc-name{font-size:13px;font-weight:700;margin-bottom:5px;}
    .ob-cc-copy .ob-cc-name{color:#1D9E75;}.ob-cc-counter .ob-cc-name{color:#D946EF;}
    .ob-cc-desc{font-size:11px;color:rgba(236,233,255,.45);line-height:1.5;}
    .ob-hiw{margin:0 22px 40px;position:relative;z-index:3;}
    .ob-step{display:flex;gap:14px;margin-bottom:22px;align-items:flex-start;}
    .ob-step-n{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#6359FF,#4F47CC);display:flex;align-items:center;justify-content:center;font-family:'Space Mono',monospace;font-size:11px;font-weight:700;color:#fff;flex-shrink:0;box-shadow:0 4px 12px rgba(99,89,255,.4);}
    .ob-step-line{width:1px;height:28px;background:linear-gradient(to bottom,rgba(99,89,255,.4),transparent);margin-top:4px;}
    .ob-step-title{font-size:14px;font-weight:600;margin-bottom:4px;padding-top:5px;}
    .ob-step-desc{font-size:12px;color:rgba(236,233,255,.45);line-height:1.55;}
    .ob-trust{margin:0 22px 40px;display:grid;grid-template-columns:1fr 1fr;gap:8px;position:relative;z-index:3;}
    .ob-tc{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:18px 14px;position:relative;overflow:hidden;transition:border-color .2s;}
    .ob-tc:hover{border-color:rgba(255,255,255,.12);}
    .ob-tc-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:17px;margin-bottom:12px;}
    .ob-tc-title{font-size:12px;font-weight:600;color:#ECE9FF;margin-bottom:5px;line-height:1.3;}
    .ob-tc-desc{font-size:11px;color:rgba(236,233,255,.35);line-height:1.5;}
    .ob-step-indicator{padding:0 22px;margin-bottom:20px;position:relative;z-index:3;}
    .ob-cta-wrap{padding:0 22px;margin-bottom:12px;position:relative;z-index:3;}
    .ob-skip-wrap{padding:0 22px;margin-bottom:12px;position:relative;z-index:3;}
    .ob-skip{width:100%;height:52px;border-radius:14px;cursor:pointer;background:transparent;color:rgba(236,233,255,.45);font-family:'Space Mono',monospace;font-size:11px;letter-spacing:1.5px;border:1px solid rgba(255,255,255,.1);transition:border-color .15s,color .15s;}
    .ob-skip:hover{border-color:rgba(99,89,255,.4);color:#A89FFF;}
    .ob-terms-note{font-size:11px;text-align:center;color:rgba(236,233,255,.35);padding:0 48px;margin-bottom:48px;position:relative;z-index:3;}
    .ob-terms-link{color:#A89FFF;cursor:pointer;text-decoration:underline;text-underline-offset:2px;}
    .ob-bcta{margin:0 22px 56px;background:linear-gradient(135deg,#6359FF 0%,#1D9E75 100%);border-radius:18px;padding:24px 20px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;position:relative;overflow:hidden;z-index:3;}
    .ob-bcta::before{content:'';position:absolute;top:-40px;right:-40px;width:120px;height:120px;background:rgba(255,255,255,.08);border-radius:50%;}
    .ob-bcta-title{font-size:17px;font-weight:700;color:#fff;margin-bottom:3px;position:relative;}
    .ob-bcta-sub{font-size:11px;color:rgba(255,255,255,.65);position:relative;}
    .ob-bcta-arr{width:42px;height:42px;background:rgba(255,255,255,.15);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;color:#fff;flex-shrink:0;transition:transform .2s;}
    .ob-bcta:hover .ob-bcta-arr{transform:translateX(3px);}
  `;

  const leaderboard = [
    {rank:"1",rc:"ob-r1",av:{bg:"rgba(255,185,0,.15)",c:"#FFB900"},ab:"KA",name:"KingAlpha",sigs:"312 signals",pnl:"+247%",pos:true,wr:"78%",ww:78,barG:"#1D9E75,#5DCAA5",rowExtra:"background:rgba(255,185,0,.04)"},
    {rank:"2",rc:"ob-r2",av:{bg:"rgba(99,89,255,.15)",c:"#A89FFF"},ab:"SX",name:"SolXpert",sigs:"189 signals",pnl:"+184%",pos:true,wr:"71%",ww:71,barG:"#6359FF,#A89FFF",rowExtra:"background:rgba(180,180,180,.03)"},
    {rank:"3",rc:"ob-r3",av:{bg:"rgba(217,70,239,.15)",c:"#D946EF"},ab:"DW",name:"DegenWatch",sigs:"441 signals",pnl:"+119%",pos:true,wr:"65%",ww:65,barG:"#D946EF,#F0A0FF",rowExtra:"background:rgba(180,100,40,.03)"},
    {rank:"4",rc:"ob-r4",av:{bg:"rgba(29,158,117,.12)",c:"#5DCAA5"},ab:"BH",name:"BTCHunter",sigs:"227 signals",pnl:"+88%",pos:true,wr:"63%",ww:63,barG:"#1D9E75,#5DCAA5",rowExtra:""},
    {rank:"5",rc:"ob-r5",av:{bg:"rgba(240,149,149,.12)",c:"#F09595"},ab:"RB",name:"RugnBull",sigs:"98 signals",pnl:"−12%",pos:false,wr:"41%",ww:41,barG:"#F09595,#FFBBBB",rowExtra:""},
  ];

  return (
    <div className="ob-w">
      <style>{CSS}</style>
      <div className="ob-noise" />
      <div className="ob-aurora" />

      {/* Nav */}
      <nav className="ob-nav">
        <Image src={logoIcon} alt="HyperCopy" width={90} height={90} />
        <div className="ob-live"><div className="ob-dot" />LIVE ON HL L1</div>
      </nav>

      {/* Hero */}
      <div className="ob-hero">
        <NetworkCanvas />
        <div className="ob-badge"><div className="ob-badge-dot" />400+ KOLs · Real-time signals</div>
        <h1 className="ob-h1">
          Copy the<br />best crypto<br />minds.<br />
          <span className="ob-g">Automatically.</span>
        </h1>
        <p className="ob-sub">HyperCopy monitors crypto Twitter, <strong>scores every KOL&apos;s accuracy</strong>, and fires your trades on HyperLiquid the moment they call it.</p>
      </div>

      {/* CTA buttons */}
      <div className="ob-btns">
        <button className="ob-btn-p" disabled={authenticated&&!walletReady} onClick={handlePrimary}>
          {primaryLabel}
        </button>
        <button className="ob-btn-g" onClick={scrollToHiw}>How it works</button>
      </div>

      {/* Step progress (after auth) */}
      {authenticated && (
        <div className="ob-step-indicator">
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:10}}>
            {["Connect","Deposit"].map((label,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                  <div style={{width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,fontFamily:"'Space Mono',monospace",background:i<currentStep?"#6359FF":i===currentStep?"rgba(99,89,255,.15)":"rgba(255,255,255,.05)",color:i<currentStep?"#fff":i===currentStep?"#A89FFF":"rgba(236,233,255,.25)",border:i===currentStep?"1.5px solid rgba(99,89,255,.5)":"1.5px solid transparent",boxShadow:i===currentStep?"0 0 12px rgba(99,89,255,.35)":"none"}}>
                    {i<currentStep?"✓":i+1}
                  </div>
                  <span style={{fontSize:9,marginTop:4,fontFamily:"'Space Mono',monospace",color:i<=currentStep?"#A89FFF":"rgba(236,233,255,.25)",letterSpacing:"0.5px"}}>{label}</span>
                </div>
                {i<1&&<div style={{width:32,height:1,background:i<currentStep?"rgba(99,89,255,.5)":"rgba(255,255,255,.08)",marginBottom:16}}/>}
              </div>
            ))}
          </div>
          {walletReady&&<p style={{fontSize:12,textAlign:"center",color:"rgba(236,233,255,.4)",lineHeight:1.55}}>Deposit USDC from any of 8 chains — Arbitrum, Base, Ethereum and more.</p>}
        </div>
      )}

      {/* Stats */}
      <div className="ob-stats">
        {[{v:"400+",l:"KOLs",c:"#A89FFF"},{v:"$0",l:"Withdraw fee",c:"#1D9E75"},{v:"8",l:"Chains",c:"#ECE9FF"},{v:"15s",l:"To order",c:"#1D9E75"}].map((s,i,arr)=>(
          <div key={i} style={{display:"contents"}}>
            <div className="ob-stat"><div className="ob-stat-v" style={{color:s.c}}>{s.v}</div><div className="ob-stat-l">{s.l}</div></div>
            {i<arr.length-1&&<div className="ob-sdiv"/>}
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="ob-sec-hd">
        <div className="ob-sec-title">⚡ Live leaderboard · 7d</div>
        <div className="ob-sec-more" onClick={()=>router.push("/copyTrading")}>View all →</div>
      </div>
      <div className="ob-lb">
        <div className="ob-lb-tabs">
          <div className="ob-lb-tab active">7D</div>
          <div className="ob-lb-tab">30D</div>
          <div className="ob-lb-tab">ALL</div>
        </div>
        <div className="ob-lb-head">
          <div className="ob-lb-hc">#</div><div className="ob-lb-hc">TRADER</div>
          <div className="ob-lb-hc">PNL</div><div className="ob-lb-hc">WIN%</div>
        </div>
        {leaderboard.map((r,i)=>(
          <div key={i} className="ob-lb-row" style={{...(r.rowExtra?{background:r.rowExtra.replace("background:","")}:{})}}>
            <div className={`ob-rank ${r.rc}`}>{r.rank}</div>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <div className="ob-av" style={{background:r.av.bg,color:r.av.c}}>{r.ab}</div>
              <div><div className="ob-tn">{r.name}</div><div className="ob-tm">{r.sigs}</div></div>
            </div>
            <div className={`ob-pnl ${r.pos?"ob-pos":"ob-neg"}`}>{r.pnl}</div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"rgba(236,233,255,.5)"}}>{r.wr}</div>
              <div className="ob-bar-bg"><div className="ob-bar-fill" style={{width:`${r.ww}%`,background:`linear-gradient(90deg,${r.barG})`}}/></div>
            </div>
          </div>
        ))}
      </div>

      {/* Two ways to trade */}
      <div className="ob-sec-hd"><div className="ob-sec-title">Two ways to trade</div></div>
      <div className="ob-cc">
        <div className="ob-cc-card ob-cc-copy">
          <div className="ob-cc-icon">🟢</div><div className="ob-cc-name">Copy Trade</div>
          <div className="ob-cc-desc">Mirror top KOL positions automatically as they call it.</div>
        </div>
        <div className="ob-cc-card ob-cc-counter">
          <div className="ob-cc-icon">🔴</div><div className="ob-cc-name">Counter Trade</div>
          <div className="ob-cc-desc">Fade the worst callers. Profit when they&apos;re wrong.</div>
        </div>
      </div>

      {/* How it works */}
      <div className="ob-sec-hd" ref={howItWorksRef}><div className="ob-sec-title">How it works</div></div>
      <div className="ob-hiw">
        {[
          {n:"1",title:"Connect your wallet",desc:"Sign in with any wallet, email, or passkey. Privy creates a secure embedded wallet instantly.",line:true},
          {n:"2",title:"Deposit USDC from any chain",desc:"Send USDC from any of 8 chains. We auto-bridge to your dedicated HyperLiquid trading wallet.",line:true},
          {n:"3",title:"Pick your KOLs",desc:"Browse the leaderboard. Every trader ranked by verified signal accuracy — not hype.",line:true},
          {n:"4",title:"Trades fire in 15 seconds",desc:"The moment a KOL signals on Twitter, real orders hit HyperLiquid perps. You watch the P&L.",line:false},
        ].map((s,i)=>(
          <div key={i} className="ob-step">
            <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
              <div className="ob-step-n">{s.n}</div>
              {s.line&&<div className="ob-step-line"/>}
            </div>
            <div>
              <div className="ob-step-title">{s.title}</div>
              <div className="ob-step-desc">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Trust cards */}
      <div className="ob-trust">
        {[
          {icon:"🎯",bg:"rgba(99,89,255,.15)",title:"Customize exit strategies",desc:"Set take-profit, stop-loss, and trailing exits per KOL — on your terms."},
          {icon:"🌙",bg:"rgba(29,158,117,.15)",title:"Automate trades while you sleep",desc:"The engine runs 24/7. Signals fire orders in 15s whether you're watching or not."},
          {icon:"⭐",bg:"rgba(255,185,0,.12)",title:"Earn points",desc:"Copy top KOLs, hit profit milestones, and climb the rewards leaderboard."},
          {icon:"📈",bg:"rgba(217,70,239,.13)",title:"Analyze KOL statistics",desc:"Win rate, avg return, signal history, and accuracy score — all verified on-chain."},
        ].map((c,i)=>(
          <div key={i} className="ob-tc">
            <div className="ob-tc-icon" style={{background:c.bg}}>{c.icon}</div>
            <div className="ob-tc-title">{c.title}</div>
            <div className="ob-tc-desc">{c.desc}</div>
          </div>
        ))}
      </div>

      {/* Terms note */}
      <p className="ob-terms-note">
        By tapping the button below you agree to our{" "}
        <span className="ob-terms-link" onClick={()=>setShowTerms(true)}>Terms of Service</span>.
      </p>

      {/* Bottom CTA (primary) */}
      <div className="ob-cta-wrap">
        <button className="ob-btn-p" style={{width:"100%",height:62,borderRadius:16,fontSize:13,letterSpacing:"1.5px"}} disabled={authenticated&&!walletReady} onClick={handlePrimary}>
          {primaryLabel}
        </button>
      </div>

      {/* Skip */}
      <div className="ob-skip-wrap">
        <button className="ob-skip" onClick={()=>authenticated?router.push("/dashboard"):router.push("/copyTrading")}>
          {authenticated?"SKIP — GO TO DASHBOARD →":"EXPLORE TOP TRADERS →"}
        </button>
      </div>

      {/* Bottom gradient CTA banner */}
      <div className="ob-bcta" onClick={handlePrimary}>
        <div>
          <div className="ob-bcta-title">Start trading for free</div>
          <div className="ob-bcta-sub">No fees to withdraw · Live on HyperLiquid L1</div>
        </div>
        <div className="ob-bcta-arr">→</div>
      </div>

      <DepositSheet isOpen={showDeposit} onClose={()=>setShowDeposit(false)} onSuccess={handleDepositSuccess}/>
      <TermsSheet isOpen={showTerms} onClose={()=>setShowTerms(false)}/>
    </div>
  );
};

const Onboarding = () => (
  <Suspense fallback={<FullScreenLoader/>}>
    <OnboardingContent/>
  </Suspense>
);

export default Onboarding;