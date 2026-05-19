"use client";

import { useCallback, useEffect, useState } from "react";
import {
  buildLuckyShareText,
  LUCKY_SHARE_URL,
} from "@/lib/skincare/luckyMoment";
import { fireConfettiBurst } from "@/lib/ui/confetti";

type Props = {
  open: boolean;
  message: string;
  onClose: () => void;
};

type AnimPhase = "idle" | "enter" | "writing" | "done";

function BackdropSparkles() {
  const items = [
    { top: "6%", left: "8%", delay: "0s", size: 5 },
    { top: "12%", left: "85%", delay: "0.5s", size: 4 },
    { top: "22%", left: "18%", delay: "1.2s", size: 3 },
    { top: "38%", left: "92%", delay: "0.8s", size: 4 },
    { top: "55%", left: "5%", delay: "1.6s", size: 3 },
    { top: "68%", left: "78%", delay: "0.2s", size: 5 },
    { top: "82%", left: "12%", delay: "1s", size: 4 },
    { top: "88%", left: "90%", delay: "1.4s", size: 3 },
  ];
  return (
    <div className="lucky-backdrop-sparkles pointer-events-none absolute inset-0" aria-hidden>
      {items.map((d, i) => (
        <span
          key={i}
          className="lucky-float-particle absolute rounded-full"
          style={{
            top: d.top,
            left: d.left,
            width: d.size,
            height: d.size,
            animationDelay: d.delay,
          }}
        />
      ))}
    </div>
  );
}

function DoodleFlower({ className }: { className: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="2" fill="#d14d85" fillOpacity="0.65" />
      <ellipse cx="11" cy="5.5" rx="3" ry="4.2" stroke="#5c3828" strokeWidth="1" fill="#f2a8c4" fillOpacity="0.55" />
      <ellipse cx="11" cy="16.5" rx="3" ry="4.2" stroke="#5c3828" strokeWidth="1" fill="#f2a8c4" fillOpacity="0.55" />
      <ellipse cx="5.5" cy="11" rx="4.2" ry="3" stroke="#5c3828" strokeWidth="1" fill="#f2a8c4" fillOpacity="0.55" />
      <ellipse cx="16.5" cy="11" rx="4.2" ry="3" stroke="#5c3828" strokeWidth="1" fill="#f2a8c4" fillOpacity="0.55" />
    </svg>
  );
}

function DoodleHeart({ className }: { className: string }) {
  return (
    <svg className={className} width="14" height="12" viewBox="0 0 18 16" fill="none" aria-hidden>
      <path
        d="M9 14.5C9 14.5 1.5 9.5 1.5 5.25C1.5 3.15 3.1 1.5 5.2 1.5C6.65 1.5 7.95 2.2 9 3.35C10.05 2.2 11.35 1.5 12.8 1.5C14.9 1.5 16.5 3.15 16.5 5.25C16.5 9.5 9 14.5 9 14.5Z"
        stroke="#5c3828"
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="#d14d85"
        fillOpacity="0.55"
      />
    </svg>
  );
}

function DoodleStar({ className }: { className: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M6 1L7.2 4.5H11L7.9 6.6L9.1 10L6 7.8L2.9 10L4.1 6.6L1 4.5H4.8L6 1Z"
        stroke="#8b5a18"
        strokeWidth="0.9"
        fill="#f0d78a"
        fillOpacity="0.7"
      />
    </svg>
  );
}

function DoodleArrow({ className }: { className: string }) {
  return (
    <svg className={className} width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden>
      <path
        d="M2 10C6 6 10 8 14 4"
        stroke="#5c4030"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M11 4L15 3L14 7"
        stroke="#5c4030"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PinkUnderline({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 140 10" fill="none" aria-hidden>
      <path
        d="M3 6 L18 4 L35 7 L52 4 L70 6 L88 4 L105 7 L122 5 L137 6"
        stroke="#c73b73"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <path
        d="M6 8 L24 7 L42 9 L60 7 L78 9 L96 7 L114 8 L132 7"
        stroke="#d14d85"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.65"
      />
    </svg>
  );
}

export default function SkincareLuckyMoment({ open, message, onClose }: Props) {
  const [shareNote, setShareNote] = useState("");
  const [phase, setPhase] = useState<AnimPhase>("idle");

  useEffect(() => {
    if (!open) {
      setPhase("idle");
      setShareNote("");
      return;
    }

    setPhase("enter");
    const writingTimer = window.setTimeout(() => setPhase("writing"), 380);
    const doneTimer = window.setTimeout(() => setPhase("done"), 2800);
    const confettiTimer = window.setTimeout(() => {
      void fireConfettiBurst().catch(() => {});
    }, 2500);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.clearTimeout(writingTimer);
      window.clearTimeout(doneTimer);
      window.clearTimeout(confettiTimer);
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, message, onClose]);

  const handleShare = useCallback(async () => {
    const fullText = buildLuckyShareText(message);

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "A rare BeautyReviewty moment",
          text: fullText,
          url: LUCKY_SHARE_URL,
        });
        setShareNote("Shared!");
        return;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
      }
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullText);
        setShareNote("Message copied ✨");
        return;
      }
    } catch {
      /* fall through */
    }

    try {
      const textArea = document.createElement("textarea");
      textArea.value = fullText;
      textArea.setAttribute("readonly", "true");
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setShareNote("Message copied ✨");
    } catch {
      setShareNote("Could not copy — try a screenshot");
    }
  }, [message]);

  if (!open) return null;

  const showExtras = phase === "done";
  const showButton = phase === "done";

  return (
    <div
      className={`lucky-overlay fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 ${
        phase !== "idle" ? "lucky-overlay-visible" : ""
      }`}
      role="presentation"
      onClick={onClose}
    >
      <div className="lucky-backdrop absolute inset-0 bg-[#1a0a10]/42 backdrop-blur-md" aria-hidden />
      <div
        className="lucky-backdrop-tint pointer-events-none absolute inset-0 bg-gradient-to-b from-rose-900/15 via-pink-900/22 to-[#180810]/32"
        aria-hidden
      />
      <div className="lucky-ambient-glow pointer-events-none absolute inset-0" aria-hidden />
      <BackdropSparkles />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lucky-moment-title"
        aria-describedby="lucky-moment-quote"
        className="lucky-stack relative flex max-h-[min(92vh,640px)] w-full max-w-[min(100%,20.5rem)] flex-col items-center overflow-y-auto overscroll-contain px-1"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`lucky-paper-wrap relative w-full shrink-0 ${
            phase !== "idle" ? "lucky-paper-visible" : ""
          }`}
        >
          <div
            className="absolute left-[38%] top-0 z-30 -translate-x-1/2 -translate-y-[50%]"
            aria-hidden
          >
            <div className="tape-strip h-[1.6rem] w-[5rem] -rotate-[5.5deg]" />
          </div>

          <div className="lucky-paper-stage">
            <div className="lucky-paper-cast" aria-hidden />
            <article className="lucky-paper relative px-4 pb-4 pt-7 sm:px-5 sm:pb-5 sm:pt-8">
            <div className="lucky-fiber" aria-hidden />
            <div className="lucky-stain" aria-hidden />
            <div className="lucky-crease lucky-crease-a" aria-hidden />
            <div className="lucky-crease lucky-crease-b" aria-hidden />
            <div className="lucky-corner lucky-corner-tl" aria-hidden />
            <div className="lucky-corner lucky-corner-br" aria-hidden />

            <button
              type="button"
              onClick={onClose}
              className="lucky-close-btn absolute right-2 top-2 z-40 flex h-8 w-8 items-center justify-center rounded-full text-[#6b4048] transition hover:scale-105 active:scale-95"
              aria-label="Close"
            >
              <span className="text-xl leading-none font-light" aria-hidden>
                ×
              </span>
            </button>

            <DoodleHeart
              className={`absolute left-3 top-[2.6rem] -rotate-[8deg] transition-opacity duration-700 ${
                showExtras ? "opacity-55" : "opacity-0"
              }`}
            />
            <DoodleFlower
              className={`absolute right-2 top-[2.2rem] rotate-[14deg] transition-opacity duration-700 ${
                showExtras ? "opacity-58" : "opacity-0"
              }`}
            />
            <DoodleStar
              className={`absolute left-[2.1rem] top-[5.2rem] rotate-[18deg] transition-opacity duration-700 ${
                showExtras ? "opacity-42" : "opacity-0"
              }`}
            />
            <DoodleArrow
              className={`absolute bottom-[4.8rem] right-2 -rotate-[12deg] transition-opacity duration-700 ${
                showExtras ? "opacity-38" : "opacity-0"
              }`}
            />
            <span
              className={`hw-doodle hw-sparkle pointer-events-none absolute left-[1.4rem] top-[4.1rem] text-[10px] transition-opacity duration-700 ${
                showExtras ? "opacity-35" : "opacity-0"
              }`}
              aria-hidden
            >
              ✨
            </span>
            <span
              className={`hw-doodle text-[#d14d85] pointer-events-none absolute bottom-[5.25rem] right-6 text-xs transition-opacity duration-700 ${
                showExtras ? "opacity-40" : "opacity-0"
              }`}
              aria-hidden
            >
              ♡
            </span>

            <p
              id="lucky-moment-title"
              className={`hw hw-accent hw-tilt-a relative z-10 pl-3 text-[1.02rem] font-normal leading-[1.35] text-[#c73b73] transition-all duration-500 sm:text-[1.08rem] ${
                phase !== "idle"
                  ? "translate-y-0 opacity-100"
                  : "translate-y-1 opacity-0"
              }`}
            >
              ✨ A little sign for you ♡
            </p>

            <div className="relative z-10 mt-3 max-w-[16rem] pl-4 pr-2 sm:mt-3.5 sm:pl-5">
              <p id="lucky-moment-quote" className="sr-only">
                {message}
              </p>
              <blockquote
                aria-hidden={phase !== "done"}
                className={`handwritten-quote hw-quote hw hw-tilt-b text-[1.58rem] font-normal leading-[1.48] text-[#2a1712] sm:text-[1.72rem] sm:leading-[1.46] ${
                  phase === "writing" || phase === "done" ? "is-revealing" : ""
                } ${phase === "done" ? "is-complete" : ""}`}
              >
                &ldquo;{message}&rdquo;
              </blockquote>
              <PinkUnderline className="mt-1.5 h-2 w-[78%] max-w-[7.5rem] translate-x-1 -rotate-[3deg]" />
            </div>

            <p
              className={`hw hw-accent relative z-10 mt-5 pl-4 text-[1.02rem] font-normal text-[#d14d85] transition-all duration-700 sm:mt-[1.35rem] ${
                showExtras ? "opacity-100" : "opacity-0"
              }`}
            >
              — BeautyReviewty
            </p>

            <p
              className={`hw hw-subtle relative z-10 mt-2 max-w-[13.5rem] pl-2 text-[0.88rem] font-normal leading-relaxed text-[#3a2822] sm:text-[0.94rem] ${
                showExtras ? "opacity-100" : "opacity-0"
              } transition-opacity duration-700`}
            >
              Consider this your little reminder from the universe ✨
            </p>
          </article>
          </div>
        </div>

        <p
          className={`hw hw-float lucky-mini-note relative -mt-0.5 w-[86%] max-w-[14.5rem] pl-3 text-left text-[0.86rem] font-normal leading-relaxed text-white/48 sm:text-[0.9rem] ${
            showExtras ? "opacity-100" : "opacity-0"
          } transition-all duration-500`}
          aria-hidden={!showExtras}
        >
          ✨ Not everyone gets this lucky sign!
        </p>

        <div
          className={`mt-2.5 flex w-full max-w-[16.5rem] flex-col items-center gap-1 transition-all duration-500 ${
            showButton
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-3 opacity-0"
          }`}
        >
          <button
            type="button"
            onClick={() => void handleShare()}
            className="hw lucky-share-btn w-full rounded-full px-5 py-2.5 text-[1.16rem] font-normal leading-tight text-white sm:text-[1.2rem]"
          >
            Share this moment ✨
          </button>
          {shareNote ? (
            <p className="text-xs text-rose-100/90">{shareNote}</p>
          ) : null}
        </div>
      </div>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Caveat:wght@400;500&family=Patrick+Hand&family=Shadows+Into+Light&display=swap");
      `}</style>
      <style jsx>{`
        .hw {
          font-family: "Shadows Into Light", "Caveat", cursive;
          font-weight: 400;
        }
        .hw-subtle {
          font-family: "Patrick Hand", "Shadows Into Light", cursive;
          font-weight: 400;
        }
        .hw-doodle {
          font-family: "Caveat", cursive;
          font-weight: 400;
        }
        .hw-float {
          font-family: "Shadows Into Light", cursive;
          font-weight: 400;
        }
        .hw-quote {
          font-family: "Caveat", "Shadows Into Light", cursive;
          font-weight: 400;
          letter-spacing: 0.04em;
          word-spacing: 0.06em;
        }
        .hw-accent {
          color: #c73b73;
        }
        .hw-sparkle {
          color: #d4a84a;
          text-shadow: 0 0 6px rgba(212, 168, 74, 0.45);
        }
        .hw-tilt-a {
          transform: rotate(-1.8deg) translateX(2px);
        }
        .hw-tilt-b {
          transform: rotate(1.2deg) translateX(-1px);
        }
        .hw-tilt-c {
          transform: rotate(-1deg) translateX(4px);
        }
        .hw-tilt-d {
          transform: rotate(1.6deg) translateX(6px);
        }

        .lucky-paper-stage {
          position: relative;
        }

        .lucky-ambient-glow {
          background: radial-gradient(
              ellipse 55% 45% at 50% 42%,
              rgba(251, 182, 206, 0.18) 0%,
              transparent 65%
            ),
            radial-gradient(
              ellipse 40% 30% at 20% 70%,
              rgba(244, 114, 182, 0.08) 0%,
              transparent 55%
            );
        }

        .lucky-float-particle {
          background: radial-gradient(circle, #fbcfe8 0%, #f9a8d4 55%, transparent 100%);
          box-shadow: 0 0 12px rgba(251, 182, 206, 0.45);
          animation: float-sparkle 3.5s ease-in-out infinite;
        }
        .lucky-backdrop-sparkles span:nth-child(odd) {
          animation-duration: 4.2s;
        }

        @keyframes float-sparkle {
          0%,
          100% {
            opacity: 0.15;
            transform: translateY(0) scale(0.8);
          }
          50% {
            opacity: 0.55;
            transform: translateY(-6px) scale(1.1);
          }
        }

        .lucky-overlay {
          opacity: 0;
        }
        .lucky-overlay-visible {
          animation: overlay-in 0.45s ease forwards;
        }
        @keyframes overlay-in {
          to {
            opacity: 1;
          }
        }

        .lucky-paper-wrap {
          opacity: 0;
          transform: translateY(18px) scale(0.9) rotate(-2.2deg);
          filter: drop-shadow(0 36px 48px rgba(40, 22, 32, 0.2))
            drop-shadow(0 18px 30px rgba(50, 28, 38, 0.14))
            drop-shadow(0 6px 14px rgba(0, 0, 0, 0.08));
        }
        .lucky-paper-cast {
          position: absolute;
          left: 6%;
          right: 4%;
          bottom: -14%;
          height: 28%;
          background: radial-gradient(
            ellipse 85% 100% at 48% 0%,
            rgba(50, 30, 40, 0.14) 0%,
            rgba(60, 35, 45, 0.05) 45%,
            transparent 72%
          );
          filter: blur(10px);
          z-index: -2;
          pointer-events: none;
          transform: rotate(-1deg) scaleX(1.04);
        }
        .lucky-paper-visible {
          animation: paper-float-in 0.65s cubic-bezier(0.34, 1.35, 0.48, 1) forwards,
            paper-float 5.5s ease-in-out 0.65s infinite;
        }
        @keyframes paper-float-in {
          0% {
            opacity: 0;
            transform: translateY(18px) scale(0.9) rotate(-2.2deg);
          }
          72% {
            opacity: 1;
            transform: translateY(-4px) scale(1.015) rotate(-0.4deg);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(-1.3deg);
          }
        }
        @keyframes paper-float {
          0%,
          100% {
            transform: translateY(0) rotate(-1.3deg);
          }
          50% {
            transform: translateY(-5px) rotate(0.5deg);
          }
        }

        .tape-strip {
          position: relative;
          background: linear-gradient(
            176deg,
            rgba(244, 175, 205, 0.62) 0%,
            rgba(232, 140, 175, 0.55) 45%,
            rgba(209, 77, 133, 0.5) 100%
          );
          box-shadow: 0 3px 8px rgba(80, 20, 45, 0.16),
            inset 0 1px 0 rgba(255, 255, 255, 0.32),
            inset 0 -1px 4px rgba(140, 40, 75, 0.1);
          border-radius: 1px;
          opacity: 0.78;
        }
        .tape-strip::before {
          content: "";
          position: absolute;
          left: 5%;
          right: 5%;
          bottom: -3px;
          height: 4px;
          background: rgba(0, 0, 0, 0.06);
          filter: blur(3px);
        }
        .tape-strip::after {
          content: "";
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
              92deg,
              transparent,
              transparent 4px,
              rgba(255, 255, 255, 0.08) 4px,
              rgba(255, 255, 255, 0.08) 6px
            ),
            linear-gradient(
              105deg,
              rgba(255, 255, 255, 0.1) 0%,
              transparent 30%,
              transparent 70%,
              rgba(200, 100, 130, 0.06) 100%
            ),
            radial-gradient(
              ellipse 80% 40% at 30% 20%,
              rgba(255, 255, 255, 0.12) 0%,
              transparent 70%
            );
          border-radius: inherit;
        }

        .lucky-paper {
          position: relative;
          z-index: 1;
          overflow: visible;
          border-radius: 5px 7px 6px 8px / 6px 5px 8px 4px;
          transform: rotate(-1.4deg) skewX(-0.4deg);
          transform-origin: 50% 40%;
          background: linear-gradient(
            150deg,
            #fff9f2 0%,
            #fff7ef 28%,
            #fff4e8 52%,
            #fdf1e3 78%,
            #fff9f2 100%
          );
          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.85),
            inset 0 2px 8px rgba(255, 255, 255, 0.65),
            inset 0 -4px 10px rgba(245, 228, 210, 0.08),
            inset 3px 0 6px rgba(252, 240, 228, 0.05),
            inset -3px 0 6px rgba(252, 240, 228, 0.05);
        }
        .lucky-paper::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          z-index: 1;
          mix-blend-mode: soft-light;
          opacity: 0.42;
          background-image: radial-gradient(
              ellipse 60% 50% at 30% 20%,
              rgba(255, 255, 255, 0.55) 0%,
              transparent 52%
            ),
            radial-gradient(
              ellipse 45% 38% at 80% 82%,
              rgba(255, 244, 232, 0.35) 0%,
              transparent 48%
            ),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.028'/%3E%3C/svg%3E");
        }
        .lucky-paper::after {
          content: "";
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          pointer-events: none;
          z-index: 4;
          box-shadow: inset 0 0 16px rgba(250, 235, 220, 0.35),
            inset 2px 2px 0 rgba(255, 255, 255, 0.65),
            inset -1px -2px 4px rgba(248, 230, 215, 0.06),
            0 0 0 1px rgba(255, 248, 240, 0.7);
          background: linear-gradient(
              to bottom,
              rgba(253, 241, 227, 0.25) 0%,
              transparent 5px
            ),
            linear-gradient(
              to top,
              rgba(255, 244, 232, 0.2) 0%,
              transparent 6px
            ),
            linear-gradient(
              to right,
              rgba(255, 247, 239, 0.18) 0%,
              transparent 4px
            ),
            linear-gradient(
              to left,
              rgba(255, 247, 239, 0.18) 0%,
              transparent 4px
            );
        }
        .lucky-fiber {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          z-index: 2;
          opacity: 0.28;
          background: repeating-linear-gradient(
              118deg,
              transparent,
              transparent 14px,
              rgba(255, 244, 232, 0.2) 14px,
              rgba(255, 244, 232, 0.2) 15px
            ),
            repeating-linear-gradient(
              38deg,
              transparent,
              transparent 20px,
              rgba(253, 241, 227, 0.15) 20px,
              rgba(253, 241, 227, 0.15) 21px
            );
        }
        .lucky-stain {
          position: absolute;
          width: 38%;
          height: 28%;
          bottom: 14%;
          right: 8%;
          border-radius: 50%;
          background: radial-gradient(
            ellipse at center,
            rgba(255, 248, 242, 0.5) 0%,
            transparent 68%
          );
          pointer-events: none;
          z-index: 2;
          transform: rotate(12deg);
        }
        .lucky-corner {
          position: absolute;
          pointer-events: none;
          z-index: 3;
        }
        .lucky-corner-tl {
          top: 4px;
          left: 6px;
          width: 28px;
          height: 24px;
          background: linear-gradient(
            140deg,
            rgba(255, 244, 232, 0.35) 0%,
            transparent 58%
          );
          transform: rotate(-14deg) skewX(-8deg);
        }
        .lucky-corner-br {
          bottom: 8px;
          right: 10px;
          width: 32px;
          height: 28px;
          background: linear-gradient(
            320deg,
            rgba(253, 241, 227, 0.3) 0%,
            transparent 55%
          );
          transform: rotate(10deg) skewY(6deg);
        }
        .lucky-crease {
          position: absolute;
          pointer-events: none;
          z-index: 2;
          border-radius: 50%;
          opacity: 0.2;
        }
        .lucky-crease-a {
          top: 18%;
          left: 8%;
          width: 42%;
          height: 28%;
          background: linear-gradient(
            135deg,
            transparent 40%,
            rgba(255, 248, 242, 0.25) 55%,
            transparent 70%
          );
          transform: rotate(-12deg);
        }
        .lucky-crease-b {
          bottom: 12%;
          right: 6%;
          width: 35%;
          height: 22%;
          background: linear-gradient(
            -40deg,
            transparent 45%,
            rgba(255, 244, 232, 0.2) 58%,
            transparent 72%
          );
          transform: rotate(8deg);
        }

        .lucky-close-btn {
          background: linear-gradient(165deg, #fff9f2 0%, #fdf1e3 100%);
          box-shadow: 0 2px 6px rgba(60, 35, 25, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.75);
          border: 1px solid rgba(255, 248, 240, 0.85);
          color: #3a2822;
        }

        .lucky-mini-note {
          transform: rotate(2.8deg) translateX(6px);
          text-shadow: 0 1px 8px rgba(20, 8, 14, 0.28);
          letter-spacing: 0.03em;
        }

        .lucky-share-btn {
          background: linear-gradient(
            180deg,
            #f9a8d4 0%,
            #f472b6 42%,
            #ec4899 100%
          );
          transform: translateY(-2px);
          box-shadow: 0 2px 0 rgba(190, 24, 93, 0.16),
            0 5px 18px rgba(236, 72, 153, 0.26),
            inset 0 1px 0 rgba(255, 255, 255, 0.28);
          transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
        }
        .lucky-share-btn:hover {
          filter: brightness(1.03);
          box-shadow: 0 2px 0 rgba(190, 24, 93, 0.18),
            0 7px 20px rgba(236, 72, 153, 0.32),
            inset 0 1px 0 rgba(255, 255, 255, 0.32);
          transform: translateY(-3px);
        }
        .lucky-share-btn:active {
          transform: translateY(0) scale(0.98);
          box-shadow: 0 1px 0 rgba(190, 24, 93, 0.14),
            0 3px 10px rgba(236, 72, 153, 0.22);
        }

        .handwritten-quote {
          font-weight: 400;
          clip-path: inset(0 0 100% 0);
          -webkit-clip-path: inset(0 0 100% 0);
        }
        .handwritten-quote.is-revealing {
          animation: pen-reveal 1.85s cubic-bezier(0.38, 0.82, 0.42, 1) forwards;
        }
        .handwritten-quote.is-complete {
          clip-path: inset(0 0 0 0);
          -webkit-clip-path: inset(0 0 0 0);
        }
        @keyframes pen-reveal {
          0% {
            clip-path: inset(0 0 100% 0);
            -webkit-clip-path: inset(0 0 100% 0);
          }
          15% {
            clip-path: inset(0 0 85% 0);
            -webkit-clip-path: inset(0 0 85% 0);
          }
          35% {
            clip-path: inset(0 0 65% 0);
            -webkit-clip-path: inset(0 0 65% 0);
          }
          55% {
            clip-path: inset(0 0 42% 0);
            -webkit-clip-path: inset(0 0 42% 0);
          }
          75% {
            clip-path: inset(0 0 20% 0);
            -webkit-clip-path: inset(0 0 20% 0);
          }
          100% {
            clip-path: inset(0 0 0 0);
            -webkit-clip-path: inset(0 0 0 0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .lucky-overlay-visible,
          .lucky-paper-visible,
          .handwritten-quote.is-revealing,
          .lucky-float-particle {
            animation: none !important;
          }
          .lucky-paper-wrap,
          .lucky-overlay {
            opacity: 1;
            transform: rotate(-1.3deg);
          }
          .handwritten-quote {
            clip-path: inset(0 0 0 0);
            -webkit-clip-path: inset(0 0 0 0);
          }
        }
      `}</style>
    </div>
  );
}
