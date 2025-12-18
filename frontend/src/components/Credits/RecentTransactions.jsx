import { CheckCircle, ArrowUpRight, CreditCard, Gift } from "lucide-react";

function RecentTransactions({ transactions = [], loading }) {
  const getIcon = (type, isPositive) => {
    if (type === "purchase") {
      return (
        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
          <CreditCard className="text-gray" size={20} />
        </div>
      );
    }
    if (type === "bonus") {
      return (
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
          <Gift className="text-purple-500" size={20} />
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatAmount = (amount) => {
    return amount > 0 ? `+${amount}` : `${amount}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="font-family-poppins text-lg font-semibold text-black mb-4">
          Recent Transactions
        </h2>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                <div>
                  <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="font-family-poppins text-lg font-semibold text-black mb-4">
        Recent Transactions
      </h2>

      {transactions.length === 0 ? (
        <p className="font-family-poppins text-sm text-gray text-center py-8">
          No transactions yet. Start teaching or learning to earn/spend credits!
        </p>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => {
            const isPositive = transaction.amount > 0;
            return (
              <div
                key={transaction._id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {getIcon(transaction.type, isPositive)}
                  <div>
                    <p className="font-family-poppins text-sm font-medium text-black">
                      {transaction.description}
                    </p>
                    <p className="font-family-poppins text-xs text-gray">
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-family-poppins text-base font-semibold ${
                    isPositive ? "text-teal" : "text-red"
                  }`}
                >
                  {formatAmount(transaction.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {transactions.length > 0 && (
        <button className="w-full mt-6 text-center font-family-poppins text-sm font-medium text-teal hover:underline">
          View All Transactions
        </button>
      )}
    </div>
  );
}

export default RecentTransactions;
