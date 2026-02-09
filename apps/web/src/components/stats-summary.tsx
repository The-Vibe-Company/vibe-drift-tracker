import {
  getVibeDriftLevel,
  getVibeDriftColor,
} from "@vibedrift/shared/dist/types";

const levelLabels: Record<string, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  "vibe-drift": "Very High",
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
    {
      label: "Total Commits",
      value: stats.totalCommits,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <line x1="1.05" y1="12" x2="7" y2="12" />
          <line x1="17.01" y1="12" x2="22.96" y2="12" />
        </svg>
      ),
    },
    {
      label: "Avg Drift Score",
      value: Number(stats.avgScore).toFixed(2),
      badge: {
        label: levelLabels[driftLevel] ?? driftLevel,
        color: driftColor,
      },
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
    },
    {
      label: "Lines / Commit",
      value:
        stats.totalCommits > 0
          ? stats.linesPerCommit.toLocaleString()
          : "–",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
      ),
    },
    {
      label: "Prompts / Commit",
      value:
        stats.totalCommits > 0
          ? stats.promptsPerCommit.toFixed(1)
          : "–",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
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
          <div
            className="flex items-center gap-1.5 text-sm"
            style={{ color: "var(--muted-foreground)" }}
          >
            {card.icon}
            <span>{card.label}</span>
          </div>
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
