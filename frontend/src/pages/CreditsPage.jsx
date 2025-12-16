import CreditStats from "../components/Credits/CreditStats";
import RecentTransactions from "../components/Credits/RecentTransactions";
import BuyCredits from "../components/Credits/BuyCredits";

function CreditsPage() {
  const creditData = {
    balance: 250,
    earned: 125,
    spent: 75,
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-family-poppins text-2xl font-bold text-black mb-1">
          Credit Wallet
        </h1>
        <p className="font-family-poppins text-sm text-gray">
          Manage your credits and view transaction history
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-6">
        <CreditStats
          balance={creditData.balance}
          earned={creditData.earned}
          spent={creditData.spent}
        />
      </div>

      {/* Transactions and Buy Credits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentTransactions />
        </div>
        <div>
          <BuyCredits />
        </div>
      </div>
    </div>
  );
}

export default CreditsPage;
