interface SummaryCardProps {
  label: string;
  value: string;
  tone?: "default" | "accent" | "dark";
}

export default function SummaryCard({
  label,
  value,
  tone = "default",
}: SummaryCardProps) {
  const toneClass =
    tone === "accent"
      ? "border-[rgba(216,111,69,0.22)] bg-[rgba(216,111,69,0.12)]"
      : tone === "dark"
        ? "border-transparent bg-[#18201f] text-white"
        : "border-[rgba(23,33,30,0.08)] bg-white/70";

  return (
    <div className={`rounded-[20px] border p-4 shadow-sm ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-current/70">
        {label}
      </p>
      <p className="mt-3 text-lg font-semibold leading-tight">{value}</p>
    </div>
  );
}
