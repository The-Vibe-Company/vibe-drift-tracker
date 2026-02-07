import { getVibeDriftColor, type VibeDriftLevel } from "@vibedrift/shared";

export function DriftBadge({
  score,
  level,
}: {
  score: number;
  level: string;
}) {
  const color = getVibeDriftColor(level as VibeDriftLevel);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
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
