import { Check } from "lucide-react";

// A solid blue circle with a white checkmark, matching the Upwork/Twitter/
// Instagram-style verified badge - not lucide's scalloped BadgeCheck icon.
function VerifiedBadge({ size = 20, className = "" }) {
  const s = Math.round(size);
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-blue-500 ${className}`}
      style={{
        width: s,
        height: s,
        flex: `0 0 ${s}px`,
        boxSizing: "border-box",
        border: "none",
        padding: 0,
      }}
      aria-label="Verified teacher"
    >
      <Check className="text-white" size={Math.round(s * 0.6)} strokeWidth={3} />
    </span>
  );
}

export default VerifiedBadge;
