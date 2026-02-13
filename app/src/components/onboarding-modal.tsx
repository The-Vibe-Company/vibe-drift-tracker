"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

const TOTAL_STEPS = 3;

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isCompleted = step < current;
        return (
          <div key={step} className="flex items-center">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-colors"
              style={{
                backgroundColor: isActive || isCompleted ? "var(--primary)" : "var(--muted)",
                color: isActive || isCompleted ? "var(--primary-foreground)" : "var(--muted-foreground)",
                border: isActive ? "2px solid var(--primary)" : "2px solid transparent",
                boxShadow: isActive ? "0 0 12px rgba(250, 204, 21, 0.3)" : "none",
              }}
            >
              {isCompleted ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                step
              )}
            </div>
            {i < TOTAL_STEPS - 1 && (
              <div
                className="w-12 h-0.5 mx-1"
                style={{
                  backgroundColor: step < current ? "var(--primary)" : "var(--border)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors"
      style={{
        backgroundColor: copied ? "rgba(34, 197, 94, 0.15)" : "var(--muted)",
        color: copied ? "#22c55e" : "var(--muted-foreground)",
        border: "1px solid",
        borderColor: copied ? "rgba(34, 197, 94, 0.3)" : "var(--border)",
      }}
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

function Step1({ apiKey, generating, onGenerate, autoCopied }: {
  apiKey: string | null;
  generating: boolean;
  onGenerate: () => void;
  autoCopied: boolean;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>
        Create your API key
      </h3>
      <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
        This key connects your VS Code extension to VibeDrift.
      </p>

      {!apiKey ? (
        <button
          onClick={onGenerate}
          disabled={generating}
          className="rounded px-4 py-2 text-sm font-medium transition-colors"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
            opacity: generating ? 0.6 : 1,
          }}
        >
          {generating ? "Generating..." : "Generate API Key"}
        </button>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <code
              className="flex-1 rounded px-3 py-2 text-xs font-mono overflow-x-auto"
              style={{
                backgroundColor: "var(--muted)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
              }}
            >
              {apiKey}
            </code>
            <CopyButton text={apiKey} />
          </div>
          {autoCopied && (
            <p className="mt-2 text-xs font-medium" style={{ color: "#22c55e" }}>
              Copied to clipboard!
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Step2({ onLinkClick }: { onLinkClick: () => void }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>
        Install the VS Code extension
      </h3>
      <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
        The extension automatically tracks your AI interactions per commit.
      </p>

      <a
        href="https://marketplace.visualstudio.com/items?itemName=TheVibeCompany.vibedrift-vscode"
        target="_blank"
        rel="noopener noreferrer"
        onClick={onLinkClick}
        className="inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors"
        style={{
          backgroundColor: "var(--primary)",
          color: "var(--primary-foreground)",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        Open VS Code Marketplace
      </a>
    </div>
  );
}

function Step3() {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>
        Configure your API key in VS Code
      </h3>
      <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
        Open VS Code Settings and paste your key into{" "}
        <code
          className="rounded px-1.5 py-0.5 text-xs"
          style={{ backgroundColor: "var(--muted)", color: "var(--foreground)" }}
        >vibedrift.apiKey</code>
      </p>

      <a
        href="vscode://settings/vibedrift.apiKey"
        className="inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors"
        style={{
          backgroundColor: "var(--primary)",
          color: "var(--primary-foreground)",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        Open VS Code Settings
      </a>
    </div>
  );
}

export function OnboardingModal() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [autoCopied, setAutoCopied] = useState(false);
  const [extensionLinkClicked, setExtensionLinkClicked] = useState(false);

  async function handleGenerateKey() {
    setGenerating(true);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Default" }),
      });
      if (res.ok) {
        const data = await res.json();
        setApiKey(data.key);
        try {
          await navigator.clipboard.writeText(data.key);
          setAutoCopied(true);
          setTimeout(() => setAutoCopied(false), 2000);
        } catch {}
      }
    } finally {
      setGenerating(false);
    }
  }

  async function handleFinish() {
    setFinishing(true);
    try {
      await fetch("/api/setup-complete", { method: "POST" });
      router.refresh();
    } finally {
      setFinishing(false);
    }
  }

  const canGoNext = step === 1 ? apiKey !== null : step === 2 ? extensionLinkClicked : true;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="relative mx-4 w-full max-w-lg rounded-xl border"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--border)",
          boxShadow: "0 16px 48px rgba(0, 0, 0, 0.4)",
        }}
      >
        {/* Header */}
        <div
          className="border-b px-6 pt-6 pb-4"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
            Welcome to VibeDrift
          </h2>
          <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
            Set up your workspace in 3 steps
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <StepIndicator current={step} />

          {step === 1 && (
            <Step1
              apiKey={apiKey}
              generating={generating}
              onGenerate={handleGenerateKey}
              autoCopied={autoCopied}
            />
          )}
          {step === 2 && <Step2 onLinkClick={() => setExtensionLinkClicked(true)} />}
          {step === 3 && <Step3 />}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between border-t px-6 py-4"
          style={{ borderColor: "var(--border)" }}
        >
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
            className="rounded px-4 py-2 text-sm font-medium transition-colors"
            style={{
              backgroundColor: "transparent",
              color: step === 1 ? "var(--border)" : "var(--muted-foreground)",
              border: "1px solid",
              borderColor: step === 1 ? "var(--border)" : "var(--border)",
              cursor: step === 1 ? "not-allowed" : "pointer",
              opacity: step === 1 ? 0.5 : 1,
            }}
          >
            Back
          </button>

          {step < TOTAL_STEPS ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canGoNext}
              className="rounded px-4 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: canGoNext ? "var(--primary)" : "var(--muted)",
                color: canGoNext ? "var(--primary-foreground)" : "var(--muted-foreground)",
                cursor: canGoNext ? "pointer" : "not-allowed",
                opacity: canGoNext ? 1 : 0.5,
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={finishing}
              className="rounded px-4 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--primary-foreground)",
                opacity: finishing ? 0.6 : 1,
              }}
            >
              {finishing ? "Finishing..." : "Finish installation"}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
