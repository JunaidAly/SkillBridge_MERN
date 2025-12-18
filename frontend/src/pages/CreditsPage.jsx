import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import CreditStats from "../components/Credits/CreditStats";
import RecentTransactions from "../components/Credits/RecentTransactions";
import BuyCredits from "../components/Credits/BuyCredits";
import { fetchWallet, fetchTransactions } from "../store/creditsSlice";

function CreditsPage() {
  const dispatch = useDispatch();
  const { wallet, transactions, loading } = useSelector((state) => state.credits);

  useEffect(() => {
    dispatch(fetchWallet());
    dispatch(fetchTransactions({ limit: 20, offset: 0 }));
  }, [dispatch]);

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
          balance={wallet?.balance ?? 0}
          earned={wallet?.earnedThisMonth ?? 0}
          spent={wallet?.spentThisMonth ?? 0}
          loading={loading}
        />
      </div>

      {/* Transactions and Buy Credits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <RecentTransactions transactions={transactions} loading={loading} />
        </div>
        {/* Buy Credits For Future Module*/}
        {/* <div>
          <BuyCredits />
        </div> */}
      </div>
    </div>
  );
}

export default CreditsPage;
