"use client";

import { useState, useEffect } from "react";
import { getReferralInfo, applyAffiliateProgram, ReferralInfo } from "@/service";

interface InviteSheetProps {
  onClose: () => void;
}

const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M20 6L9 17l-5-5"/>
  </svg>
);
const XLogoIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.628L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
  </svg>
);
const ShareIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
);

const avatarColors = ["#e74c3c","#8e44ad","#2980b9","#27ae60","#f39c12","#1abc9c"];
const getColor = (s: string) => avatarColors[s.split("").reduce((a,c) => a+c.charCodeAt(0),0) % avatarColors.length];

const LoadingSpinner = () => (
  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"48px 0", gap:12 }}>
    <div style={{ width:28, height:28, borderRadius:"50%", border:"2px solid rgba(45,212,191,0.25)", borderTopColor:"transparent", animation:"spin 0.8s linear infinite" }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <span style={{ fontSize:12, color:"rgba(255,255,255,0.3)" }}>Loading...</span>
  </div>
);

const InviteSheet = ({ onClose }: InviteSheetProps) => {
  const [closing, setClosing] = useState(false);
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [affiliateLoading, setAffiliateLoading] = useState(false);
  const [affiliateApplied, setAffiliateApplied] = useState(false);
  const [barPct, setBarPct] = useState(0);

  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);

  useEffect(() => {
    getReferralInfo()
      .then(d => {
        setInfo(d);
        setAffiliateApplied(d.affiliate_applied);
        setTimeout(() => setBarPct(Math.min(100, (d.global_slots.slots_used / d.global_slots.total_slots) * 100)), 300);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const handleClose = () => { setClosing(true); setTimeout(onClose, 300); };

  const copyText = (text: string, type: "code" | "link") => {
    navigator.clipboard?.writeText(text).catch(() => {});
    if (type === "code") { setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); }
    else { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); }
  };

  const handleShare = () => {
    if (!info) return;
    const text = `Join me on HyperCopy — copy trade the best crypto KOLs on HyperLiquid.\nUse my code ${info.code} and get +15% points boost + 10 free copy trades.\nhttps://${info.link}`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).catch(() => {});
    }
  };

  const handlePostX = () => {
    if (!info) return;
    const text = encodeURIComponent(`Join me on HyperCopy — copy trade the best crypto KOLs on HyperLiquid 🚀\n\nUse code ${info.code} → +15% pts boost + 10 free copy trades\n\nhttps://${info.link}`);
    window.open(`https://x.com/intent/tweet?text=${text}`, "_blank");
  };

  const handleAffiliateApply = async () => {
    if (affiliateApplied || affiliateLoading) return;
    setAffiliateLoading(true);
    try {
      await applyAffiliateProgram();
      setAffiliateApplied(true);
      if (info) setInfo({ ...info, affiliate_applied: true });
    } catch {}
    setAffiliateLoading(false);
  };

  return (
    <>
      <style>{`
        @keyframes sheetUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        .invite-btn { cursor: pointer; transition: all 0.18s; }
        .invite-btn:active { transform: scale(0.97); opacity: 0.85; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{ position:"fixed", inset:0, zIndex:50, background:"rgba(0,0,0,0.72)", backdropFilter:"blur(10px)", opacity:closing?0:1, transition:"opacity 0.3s" }}
      />

      {/* Sheet */}
      <div
        style={{
          position:"fixed", bottom:0, left:0, right:0, zIndex:51,
          background:"linear-gradient(180deg,#0e1319 0%,#0a0e13 100%)",
          borderRadius:"24px 24px 0 0", maxHeight:"90vh", overflowY:"auto",
          transform: closing ? "translateY(100%)" : "translateY(0)",
          animation: closing ? "none" : "sheetUp 0.32s cubic-bezier(0.32,0.72,0,1)",
          boxShadow:"0 -8px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        {/* Handle */}
        <div style={{ padding:"12px 0 4px", display:"flex", justifyContent:"center" }}>
          <div style={{ width:36, height:4, borderRadius:99, background:"rgba(255,255,255,0.1)" }} />
        </div>

        {/* Header */}
        <div style={{ padding:"8px 20px 14px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:"#fff" }}>Invite Friends</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginTop:2 }}>Share your code, earn rewards together</div>
          </div>
          <button onClick={handleClose} className="invite-btn"
            style={{ width:30, height:30, borderRadius:10, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div style={{ padding:"0 16px 40px", display:"flex", flexDirection:"column", gap:10 }}>
          {loading ? <LoadingSpinner /> : error ? (
            <div style={{ textAlign:"center", padding:"32px 0", color:"rgba(255,255,255,0.3)", fontSize:13 }}>Failed to load. Please try again.</div>
          ) : info && (
            <>
              {/* Invited by — only show if user was referred */}
              {info.invited_by && (
                <div style={{ background:"rgba(45,212,191,0.06)", border:"1px solid rgba(45,212,191,0.14)", borderRadius:16, padding:"12px 16px", display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:"50%", background:`linear-gradient(135deg,${getColor(info.invited_by.username)},${getColor(info.invited_by.username+"x")})`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:14, flexShrink:0, color:"#fff" }}>
                    {info.invited_by.display_name[0].toUpperCase()}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>Invited by</div>
                    <div style={{ fontSize:14, fontWeight:700, color:"#2dd4bf" }}>@{info.invited_by.username}</div>
                  </div>
                  <div style={{ background:"rgba(45,212,191,0.12)", border:"1px solid rgba(45,212,191,0.2)", borderRadius:8, padding:"3px 8px", fontSize:11, fontWeight:700, color:"#2dd4bf" }}>+15% PTS</div>
                </div>
              )}

              {/* Your benefits */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <div style={{ background:"rgba(45,212,191,0.07)", border:"1px solid rgba(45,212,191,0.14)", borderRadius:14, padding:"14px 12px", textAlign:"center" }}>
                  <div style={{ fontSize:22, fontWeight:800, color:"#2dd4bf" }}>+15%</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", marginTop:2 }}>Points Boost</div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.2)", marginTop:1 }}>permanent</div>
                </div>
                <div style={{ background:"rgba(168,85,247,0.07)", border:"1px solid rgba(168,85,247,0.18)", borderRadius:14, padding:"14px 12px", textAlign:"center" }}>
                  <div style={{ fontSize:22, fontWeight:800, color:"#a855f7" }}>10</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", marginTop:2 }}>Free Copy Trades</div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.2)", marginTop:1 }}>no fees</div>
                </div>
              </div>

              {/* Slot progress */}
              <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"14px 16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700 }}>Reduced Fee Slots</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:1 }}>First {info.global_slots.total_slots.toLocaleString()} users · locked-in forever</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:18, fontWeight:800, color:"#f59e0b" }}>{(info.global_slots.total_slots - info.global_slots.slots_used).toLocaleString()}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>slots left</div>
                  </div>
                </div>
                <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:99, height:7, overflow:"hidden", marginBottom:6 }}>
                  <div style={{ height:"100%", borderRadius:99, background:"linear-gradient(90deg,#2dd4bf,#f59e0b)", width:`${barPct}%`, transition:"width 1.2s cubic-bezier(0.25,0.46,0.45,0.94)", boxShadow:"0 0 10px rgba(245,158,11,0.35)" }} />
                </div>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)" }}>{info.global_slots.slots_used} / {info.global_slots.total_slots} claimed</div>
                  <div style={{ fontSize:10, color:"#f59e0b", fontWeight:700 }}>🔥 {Math.round(barPct)}% full</div>
                </div>
                <div style={{ marginTop:10, background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.14)", borderRadius:10, padding:"7px 12px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#22c55e" }}>✦ First 100 — Free Forever</div>
                  <div style={{ fontSize:11, fontWeight:700, color:"#22c55e", background:"rgba(34,197,94,0.15)", border:"1px solid rgba(34,197,94,0.25)", borderRadius:6, padding:"2px 7px" }}>
                    {info.global_slots.free_tier_full ? "FULL" : "OPEN"}
                  </div>
                </div>
              </div>

              {/* Your code */}
              <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"14px 16px" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.35)", letterSpacing:"0.08em", marginBottom:10 }}>YOUR INVITE CODE</div>

                {/* Code row */}
                <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                  <div style={{ flex:1, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"10px 14px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <span style={{ fontSize:15, fontWeight:800, letterSpacing:"0.12em", color:"#2dd4bf" }}>{info.code}</span>
                    <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)" }}>code</span>
                  </div>
                  <button className="invite-btn" onClick={() => copyText(info.code, "code")}
                    style={{ background: codeCopied ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)", border:`1px solid ${codeCopied ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)"}`, borderRadius:10, padding:"0 14px", color: codeCopied ? "#22c55e" : "rgba(255,255,255,0.5)", display:"flex", alignItems:"center", gap:5, fontSize:12, fontWeight:600 }}>
                    {codeCopied ? <><CheckIcon /> Copied</> : <><CopyIcon /> Copy</>}
                  </button>
                </div>

                {/* Link row */}
                <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:10, padding:"8px 12px", display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{info.link}</span>
                  <button className="invite-btn" onClick={() => copyText(`https://${info.link}`, "link")}
                    style={{ background:"none", border:"none", color: linkCopied ? "#22c55e" : "rgba(255,255,255,0.3)", display:"flex", alignItems:"center", gap:4, fontSize:11, fontWeight:600, flexShrink:0, paddingLeft:8 }}>
                    {linkCopied ? <><CheckIcon /> Copied</> : <><CopyIcon /> Copy</>}
                  </button>
                </div>

                {/* Share buttons */}
                <div style={{ display:"flex", gap:8 }}>
                  <button className="invite-btn" onClick={handleShare}
                    style={{ flex:1, background:"rgba(45,212,191,0.1)", border:"1px solid rgba(45,212,191,0.2)", borderRadius:10, padding:"10px", display:"flex", alignItems:"center", justifyContent:"center", gap:6, color:"#2dd4bf", fontSize:12, fontWeight:700 }}>
                    <ShareIcon /> Share
                  </button>
                  <button className="invite-btn" onClick={handlePostX}
                    style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:10, padding:"10px", display:"flex", alignItems:"center", justifyContent:"center", gap:6, color:"rgba(255,255,255,0.6)", fontSize:12, fontWeight:700 }}>
                    <XLogoIcon /> Post on X
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                {([["Invited", String(info.invited_count)], ["Active", String(info.active_count)], ["Earned", `$${info.earned_usd.toFixed(2)}`]] as [string,string][]).map(([l, v]) => (
                  <div key={l} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"12px 8px", textAlign:"center" }}>
                    <div style={{ fontSize:17, fontWeight:800, color: v.startsWith("$") ? "#22c55e" : "#fff" }}>{v}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:2 }}>{l}</div>
                  </div>
                ))}
              </div>

              {/* Affiliate */}
              <div style={{ background:"linear-gradient(135deg,rgba(245,158,11,0.07),rgba(168,85,247,0.07))", border:"1px solid rgba(245,158,11,0.18)", borderRadius:16, padding:"14px 16px" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#f59e0b", letterSpacing:"0.08em", marginBottom:4 }}>AFFILIATE PROGRAM</div>
                <div style={{ fontSize:14, fontWeight:800, marginBottom:4 }}>Earn 20% of Fees</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", lineHeight:1.5, marginBottom:12 }}>
                  For creators & communities. Custom code + revenue share on every trade your referrals make.
                </div>
                <button className="invite-btn" onClick={handleAffiliateApply}
                  disabled={affiliateApplied || affiliateLoading}
                  style={{ width:"100%", background: affiliateApplied ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)", border:`1px solid ${affiliateApplied ? "rgba(34,197,94,0.25)" : "rgba(245,158,11,0.25)"}`, borderRadius:10, padding:"11px", color: affiliateApplied ? "#22c55e" : "#f59e0b", fontWeight:700, fontSize:13, opacity: affiliateLoading ? 0.6 : 1 }}>
                  {affiliateLoading ? "Submitting..." : affiliateApplied ? "✓ Application Submitted" : "Apply Now →"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default InviteSheet;