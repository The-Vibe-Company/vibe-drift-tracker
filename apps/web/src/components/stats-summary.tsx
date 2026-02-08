export function StatsSummary({
  stats,
}: {
  stats: {
    totalCommits: number;
    avgScore: number;
    totalLines: number;
    totalPrompts: number;
  };
}) {
  const cards = [
    { label: "Total Commits", value: stats.totalCommits },
    { label: "Avg Drift Score", value: stats.avgScore.toFixed(2) },
    { label: "Total Lines Changed", value: stats.totalLines.toLocaleString() },
    { label: "Total Prompts", value: stats.totalPrompts },
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
        </div>
      ))}
    </div>
  );
}
