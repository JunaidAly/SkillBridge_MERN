const VARIANTS = {
  completed: "bg-teal/10 text-teal",
  failed: "bg-red/10 text-red",
  refunded: "bg-gray-200 text-gray",
  verified: "bg-teal/10 text-teal",
  pending: "bg-orange-100 text-orange-600",
  rejected: "bg-red/10 text-red",
  unverified: "bg-gray-200 text-gray",
  approved: "bg-teal/10 text-teal",
};

function Badge({ status, label }) {
  const style = VARIANTS[status] || VARIANTS.refunded;
  return (
    <span
      className={`font-family-poppins text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${style}`}
    >
      {label || status}
    </span>
  );
}

export default Badge;
