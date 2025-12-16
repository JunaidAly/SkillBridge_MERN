import { CheckCircle, ArrowUpRight, ArrowDownLeft, CreditCard } from "lucide-react";

const transactions = [
  {
    id: 1,
    type: "teaching",
    title: "Teaching React Basics to Sarah M.",
    date: "Dec 4, 2025 * 10:25 PM",
    amount: "+25",
    isPositive: true,
  },
  {
    id: 2,
    type: "learning",
    title: "Learning Python with Alex T.",
    date: "Dec 2, 2025 * 2:30 PM",
    amount: "-25",
    isPositive: false,
  },
  {
    id: 3,
    type: "teaching",
    title: "Teaching TypeScript to David C.",
    date: "Dec 1, 2025 * 10:30 PM",
    amount: "+25",
    isPositive: true,
  },
  {
    id: 4,
    type: "teaching",
    title: "Teaching UI Design to Emma W.",
    date: "Nov 30, 2025 * 4:00 PM",
    amount: "+25",
    isPositive: true,
  },
  {
    id: 5,
    type: "learning",
    title: "Learning Spanish with Maria G.",
    date: "Nov 28, 2025 * 9:15 AM",
    amount: "-25",
    isPositive: false,
  },
  {
    id: 6,
    type: "learning",
    title: "Teaching React Basics to Sarah M.",
    date: "Nov 27, 2025 * 3:00 PM",
    amount: "-25",
    isPositive: false,
  },
  {
    id: 7,
    type: "purchase",
    title: "Credit Purchase",
    date: "Nov 25, 2025 * 11:00 AM",
    amount: "+25",
    isPositive: true,
  },
];

function RecentTransactions() {
  const getIcon = (type, isPositive) => {
    if (type === "purchase") {
      return (
        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
          <CreditCard className="text-gray" size={20} />
        </div>
      );
    }
    if (isPositive) {
      return (
        <div className="w-10 h-10 bg-teal/10 rounded-full flex items-center justify-center">
          <CheckCircle className="text-teal" size={20} />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 bg-red/10 rounded-full flex items-center justify-center">
        <ArrowUpRight className="text-red" size={20} />
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="font-family-poppins text-lg font-semibold text-black mb-4">
        Recent Transactions
      </h2>

      <div className="space-y-4">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              {getIcon(transaction.type, transaction.isPositive)}
              <div>
                <p className="font-family-poppins text-sm font-medium text-black">
                  {transaction.title}
                </p>
                <p className="font-family-poppins text-xs text-gray">
                  {transaction.date}
                </p>
              </div>
            </div>
            <span
              className={`font-family-poppins text-base font-semibold ${
                transaction.isPositive ? "text-teal" : "text-red"
              }`}
            >
              {transaction.amount}
            </span>
          </div>
        ))}
      </div>

      <button className="w-full mt-6 text-center font-family-poppins text-sm font-medium text-teal hover:underline">
        View All Transactions
      </button>
    </div>
  );
}

export default RecentTransactions;
