"use client";

import { useState, useContext } from "react";
import { Shield, CheckCircle, Loader2, X, AlertCircle } from "lucide-react";
import { HyperLiquidContext } from "@/providers/hyperliquid";

interface Props {
  onApproved: () => void;
  onDismiss: () => void;
}

export default function BuilderApprovalBanner({ onApproved, onDismiss }: Props) {
  const { approveBuilderFee } = useContext(HyperLiquidContext);
  const [status, setStatus] = useState<"idle" | "signing" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleApprove = async () => {
    setStatus("signing");
    setErrorMsg("");

    try {
      await approveBuilderFee();
      setStatus("success");
      setTimeout(onApproved, 1500);
    } catch (err: any) {
      setStatus("error");
      const msg = err?.message || "Approval failed";
      if (msg.includes("rejected") || err?.code === 4001) {
        setErrorMsg("Signature rejected");
      } else {
        setErrorMsg(msg.length > 80 ? msg.slice(0, 80) + "…" : msg);
      }
    }
  };

  if (status === "success") {
    return (
      <div
        className="relative z-10 mx-3 mb-2 rounded-xl px-4 py-3 flex items-center gap-3"
        style={{
          background: "linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.03) 100%)",
          border: "1px solid rgba(34,197,94,0.25)",
        }}
      >
        <CheckCircle size={16} className="text-green-400 shrink-0" />
        <span className="text-[11px] text-green-400 font-semibold">
          Copy trading authorized — you're all set!
        </span>
      </div>
    );
  }

  return (
    <div
      className="relative z-10 mx-3 mb-2 rounded-xl px-4 py-3"
      style={{
        background: "linear-gradient(135deg, rgba(45,212,191,0.08) 0%, rgba(45,212,191,0.02) 100%)",
        border: "1px solid rgba(45,212,191,0.2)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: "rgba(45,212,191,0.12)" }}
          >
            <Shield size={14} className="text-teal-400" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-white mb-0.5">
              Authorize Copy Trading
            </p>
            <p className="text-[9px] text-gray-400 leading-relaxed">
              Sign a one-time approval so HyperCopy can execute trades on your behalf.
              Max fee: 0.01% per trade. Revocable anytime.
            </p>

            {status === "error" && (
              <div className="flex items-center gap-1 mt-1.5">
                <AlertCircle size={10} className="text-red-400" />
                <span className="text-[9px] text-red-400">{errorMsg}</span>
              </div>
            )}

            <button
              onClick={handleApprove}
              disabled={status === "signing"}
              className="mt-2.5 px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 active:scale-95 flex items-center gap-1.5 cursor-pointer"
              style={{
                background:
                  status === "signing"
                    ? "rgba(45,212,191,0.15)"
                    : "rgba(45,212,191,1)",
                color: status === "signing" ? "#2dd4bf" : "#0a0f14",
                boxShadow:
                  status !== "signing"
                    ? "0 0 20px rgba(45,212,191,0.3)"
                    : "none",
              }}
            >
              {status === "signing" ? (
                <>
                  <Loader2 size={10} className="animate-spin" />
                  Waiting for signature…
                </>
              ) : status === "error" ? (
                "Try Again"
              ) : (
                "Approve"
              )}
            </button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="w-5 h-5 rounded flex items-center justify-center shrink-0 hover:bg-white/10 transition-colors"
        >
          <X size={10} className="text-gray-500" />
        </button>
      </div>
    </div>
  );
}