"use client";

import { useState, useEffect } from "react";
import { getReferralInfo, applyAffiliateProgram, ReferralInfo } from "@/service";

interface InviteSheetProps {
  onClose: () => void;
}

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M20 6L9 17l-5-5"/>
  </svg>
);
const XLogoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.628L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
  </svg>
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

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    getReferralInfo()
      .then(d => {
        setInfo(d);
        setAffiliateApplied(d.affiliate_applied);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const handleClose = () => { setClosing(true); setTimeout(onClose, 280); };

  const copyText = (text: string, type: "code" | "link") => {
    navigator.clipboard?.writeText(text).catch(() => {});
    if (type === "code") { setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); }
    else { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); }
  };

  const handlePostX = () => {
    if (!info) return;
    const text = encodeURIComponent(`Copy-trading the best crypto KOLs on HyperLiquid with @HyperCopyio\n\nUse my code ${info.code} — get +15% points & 10 free trades\n\nhttps://${info.link}`);
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
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        .inv-btn { cursor: pointer; transition: opacity 0.15s, background 0.15s; }
        .inv-btn:active { opacity: 0.7; }
        .inv-btn:disabled { opacity: 0.4; cursor: default; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "rgba(0,0,0,0.6)",
          opacity: closing ? 0 : 1,
          transition: "opacity 0.28s",
          animation: "fadeIn 0.2s ease",
        }}
      />

      {/* Sheet */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 51,
        background: "#0d1117",
        borderRadius: "20px 20px 0 0",
        maxHeight: "88vh",
        overflowY: "auto",
        transform: closing ? "translateY(100%)" : "translateY(0)",
        animation: closing ? "none" : "sheetUp 0.3s cubic-bezier(0.32,0.72,0,1)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}>
        {/* Handle */}
        <div style={{ padding: "14px 0 0", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 32, height: 3, borderRadius: 99, background: "rgba(255,255,255,0.12)" }} />
        </div>

        {/* Header */}
        <div style={{ padding: "14px 20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>Invite Friends</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Earn rewards when your referrals trade</div>
          </div>
          <button onClick={handleClose} className="inv-btn"
            style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div style={{ padding: "16px 16px 40px", display: "flex", flexDirection: "column", gap: 12 }}>
          {loading ? (
            <div style={{ padding: "48px 0", display: "flex", justifyContent: "center" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.08)", borderTopColor: "#2dd4bf", animation: "spin 0.8s linear infinite" }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : error ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
              Failed to load. Please try again.
            </div>
          ) : info && (
            <>
              {/* Benefits — what referees get */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: "0.07em", marginBottom: 12 }}>FRIENDS GET</div>
                <div style={{ display: "flex", gap: 24 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#2dd4bf" }}>+15%</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>Points boost</div>
                  </div>
                  <div style={{ width: 1, background: "rgba(255,255,255,0.07)" }} />
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>10</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>Free copy trades</div>
                  </div>
                  <div style={{ width: 1, background: "rgba(255,255,255,0.07)" }} />
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#f59e0b" }}>20%</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>Fee share to you</div>
                  </div>
                </div>
              </div>

              {/* Invite code */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: "0.07em", marginBottom: 12 }}>YOUR CODE</div>

                {/* Code */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1, background: "rgba(45,212,191,0.06)", border: "1px solid rgba(45,212,191,0.15)", borderRadius: 10, padding: "10px 14px" }}>
                    <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.1em", color: "#2dd4bf" }}>{info.code}</span>
                  </div>
                  <button className="inv-btn" onClick={() => copyText(info.code, "code")}
                    style={{ background: codeCopied ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.06)", border: `1px solid ${codeCopied ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.08)"}`, borderRadius: 10, padding: "10px 16px", color: codeCopied ? "#22c55e" : "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600 }}>
                    {codeCopied ? <><CheckIcon />Copied</> : <><CopyIcon />Copy</>}
                  </button>
                </div>

                {/* Link */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "8px 12px", overflow: "hidden" }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>{info.link}</span>
                  </div>
                  <button className="inv-btn" onClick={() => copyText(`https://${info.link}`, "link")}
                    style={{ background: "none", border: "none", color: linkCopied ? "#22c55e" : "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                    {linkCopied ? <><CheckIcon />Copied</> : <><CopyIcon />Copy</>}
                  </button>
                </div>

                {/* Post on X */}
                <button className="inv-btn" onClick={handlePostX}
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "11px", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600 }}>
                  <XLogoIcon /> Post on X
                </button>
              </div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {([["Invited", String(info.invited_count)], ["Active", String(info.active_count)], ["Earned", `$${info.earned_usd.toFixed(2)}`]] as [string, string][]).map(([label, val]) => (
                  <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: label === "Earned" ? "#22c55e" : "#fff" }}>{val}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Affiliate */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Affiliate Program</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 3, lineHeight: 1.5 }}>For creators & communities — earn 20% of your referrals' fees.</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", flexShrink: 0, marginLeft: 12 }}>20%</div>
                </div>
                <button className="inv-btn" onClick={handleAffiliateApply}
                  disabled={affiliateApplied || affiliateLoading}
                  style={{ width: "100%", background: affiliateApplied ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.05)", border: `1px solid ${affiliateApplied ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.08)"}`, borderRadius: 10, padding: "10px", color: affiliateApplied ? "#22c55e" : "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 13 }}>
                  {affiliateLoading ? "Submitting..." : affiliateApplied ? "✓ Application Submitted" : "Apply →"}
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