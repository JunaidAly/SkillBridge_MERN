import { Wallet, TrendingUp, TrendingDown, Banknote } from "lucide-react";

function CreditStats({ balance, purchased, earnedBalance, earned, spent, loading, showCashOut }) {
  const stats = [
    {
      title: "Available Balance",
      value: balance,
      // The split is only worth spelling out for someone who can actually
      // cash out - to a student the two halves mean the same thing.
      caption: showCashOut ? `${purchased} bought · ${earnedBalance} earned` : null,
      icon: Wallet,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-500",
      valueColor: "text-black",
    },
    ...(showCashOut
      ? [
          {
            title: "Available to Cash Out",
            value: earnedBalance,
            caption: "Credits earned by teaching",
            icon: Banknote,
            iconBg: "bg-teal/10",
            iconColor: "text-teal",
            valueColor: "text-teal",
          },
        ]
      : []),
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
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${showCashOut ? "xl:grid-cols-4" : "md:grid-cols-3"}`}>
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
            {loading ? (
              <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
            ) : (
              <>
                <p
                  className={`font-family-poppins text-3xl font-bold ${stat.valueColor}`}
                >
                  {stat.value}
                </p>
                {stat.caption && (
                  <p className="font-family-poppins text-xs text-gray mt-1">{stat.caption}</p>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default CreditStats;
