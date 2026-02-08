import {
  getVibeDriftLevel,
  getVibeDriftColor,
} from "@vibedrift/shared/dist/types";

const levelLabels: Record<string, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  "vibe-drift": "Vibe Drifting",
};

export function StatsSummary({
  stats,
}: {
  stats: {
    totalCommits: number;
    avgScore: number;
    linesPerCommit: number;
    promptsPerCommit: number;
  };
}) {
  const driftLevel = getVibeDriftLevel(stats.avgScore);
  const driftColor = getVibeDriftColor(driftLevel);

  const cards = [
    { label: "Total Commits", value: stats.totalCommits },
    {
      label: "Avg Drift Score",
      value: Number(stats.avgScore).toFixed(2),
      badge: {
        label: levelLabels[driftLevel] ?? driftLevel,
        color: driftColor,
      },
    },
    {
      label: "Lines / Commit",
      value:
        stats.totalCommits > 0
          ? stats.linesPerCommit.toLocaleString()
          : "–",
    },
    {
      label: "Prompts / Commit",
      value:
        stats.totalCommits > 0
          ? stats.promptsPerCommit.toFixed(1)
          : "–",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border-l-2 border p-4"
          style={{
            borderColor: "var(--border)",
            borderLeftColor: "var(--primary)",
            backgroundColor: "var(--card)",
          }}
        >
          <p
            className="text-sm"
            style={{ color: "var(--muted-foreground)" }}
          >
            {card.label}
          </p>
          <p
            className="mt-1 text-2xl font-semibold"
            style={{ color: "var(--primary)" }}
          >
            {card.value}
          </p>
          {"badge" in card && card.badge && (
            <span
              className="mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `${card.badge.color}20`,
                color: card.badge.color,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: card.badge.color }}
              />
              {card.badge.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
