const driftColors: Record<string, string> = {
  low: "#22c55e",
  moderate: "#eab308",
  high: "#f97316",
  "vibe-drifting": "#ef4444",
};

export function DriftBadge({ score, level }: { score: number; level: string }) {
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
      {score.toFixed(1)} &middot; {level}
    </span>
  );
}
