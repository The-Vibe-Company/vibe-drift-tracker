const driftColors: Record<string, string> = {
  "very-low": "#22c55e",
  low: "#34d399",
  moderate: "#eab308",
  high: "#f97316",
  "vibe-drift": "#ef4444",
};

const driftLabels: Record<string, string> = {
  "very-low": "Very Low",
  low: "Low",
  moderate: "Moderate",
  high: "High",
  "vibe-drift": "Very High",
};

export function DriftBadge({ score, level, promptCount }: { score: number; level: string; promptCount?: number }) {
  if (promptCount === 0) {
    const gray = "#6b7280";
    return (
      <span
        className="inline-flex whitespace-nowrap items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
        style={{ backgroundColor: `${gray}20`, color: gray }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: gray }}
        />
        No vibe
      </span>
    );
  }

  const color = driftColors[level] ?? "#6b7280";

  return (
    <span
      className="inline-flex whitespace-nowrap items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}20`, color }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {score.toFixed(1)} &middot; {driftLabels[level] ?? level}
    </span>
  );
}
