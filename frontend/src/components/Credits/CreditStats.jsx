import { Wallet, TrendingUp, TrendingDown } from "lucide-react";

function CreditStats({ balance, earned, spent }) {
  const stats = [
    {
      title: "Available Balance",
      value: balance,
      icon: Wallet,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-500",
      valueColor: "text-black",
    },
    {
      title: "Earned This Month",
      value: `+${earned}`,
      icon: TrendingUp,
      iconBg: "bg-teal/10",
      iconColor: "text-teal",
      valueColor: "text-teal",
    },
    {
      title: "Spent This Month",
      value: `-${spent}`,
      icon: TrendingDown,
      iconBg: "bg-red/10",
      iconColor: "text-red",
      valueColor: "text-red",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.title}
            className="bg-white rounded-xl p-5 shadow-sm"
          >
            <p className="font-family-poppins text-sm text-gray mb-3">
              {stat.title}
            </p>
            <div
              className={`w-8 h-8 ${stat.iconBg} rounded-lg flex items-center justify-center mb-3`}
            >
              <Icon className={stat.iconColor} size={18} />
            </div>
            <p
              className={`font-family-poppins text-3xl font-bold ${stat.valueColor}`}
            >
              {stat.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default CreditStats;
