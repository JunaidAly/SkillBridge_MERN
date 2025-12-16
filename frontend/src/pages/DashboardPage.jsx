import { Star } from "lucide-react";
import AIRecommendedMatches from "../components/Dashboard/AIRecommendedMatches";

function DashboardPage() {
  const stats = [
    {
      title: "Credit Balance",
      value: "1,250",
      icon: "/assets/credit.svg",
      isImage: true,
    },
    {
      title: "Scheduled Sessions",
      value: "3",
      icon: "/assets/sessions.svg",
      isImage: true,
    },
    {
      title: "Average Rating",
      value: "4.9",
      icon: Star,
      isImage: false,
      iconColor: "text-yellow-500 fill-yellow-500",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-family-poppins text-3xl font-bold text-black mb-2">
          Welcome back, Jane!
        </h1>
        <p className="font-family-poppins text-gray">
          Here's an overview of your SkillBridge activity.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="mb-8">
        <h2 className="font-family-poppins text-2xl font-medium text-black mb-4">
          Quick Stats
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="bg-white rounded-xl p-6 shadow-sm"
              >
                <p className="font-family-poppins text-sm text-gray mb-3">
                  {stat.title}
                </p>
                <div className="mb-3">
                  {stat.isImage ? (
                    <img src={stat.icon} alt={stat.title} className="w-8 h-8" />
                  ) : (
                    <div className={`w-10 h-10 flex items-center justify-center`}>
                      <Icon className={stat.iconColor} size={30} />
                    </div>
                  )}
                </div>
                <p className="font-family-poppins text-3xl font-medium text-black">
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Recommended Matches */}
      <AIRecommendedMatches />
    </div>
  );
}

export default DashboardPage;
