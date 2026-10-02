import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import CreditStats from "../components/Credits/CreditStats";
import RecentTransactions from "../components/Credits/RecentTransactions";
import BuyCredits from "../components/Credits/BuyCredits";
import PayoutSection from "../components/Credits/PayoutSection";
import { fetchWallet, fetchTransactions } from "../store/creditsSlice";
import { fetchProfile } from "../store/profileSlice";

function CreditsPage() {
  const dispatch = useDispatch();
  const { wallet, transactions, loading } = useSelector((state) => state.credits);
  const { profile } = useSelector((state) => state.profile);

  useEffect(() => {
    dispatch(fetchWallet());
    dispatch(fetchTransactions({ limit: 20, offset: 0 }));
  }, [dispatch]);

  useEffect(() => {
    if (!profile) dispatch(fetchProfile());
  }, [profile, dispatch]);

  // Cashing out is a teacher's concern, so it stays hidden until someone
  // actually teaches. Gated on the skills on the profile rather than what was
  // picked during onboarding, so adding a teaching skill later reveals it on
  // its own. The earned-balance check keeps it visible for anyone who still
  // holds earnings after removing their teaching skills.
  const canCashOut =
    (profile?.skillsTeaching?.length ?? 0) > 0 || (wallet?.earnedBalance ?? 0) > 0;

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
          purchased={wallet?.purchasedBalance ?? 0}
          earnedBalance={wallet?.earnedBalance ?? 0}
          showCashOut={canCashOut}
          earned={wallet?.earnedThisMonth ?? 0}
          spent={wallet?.spentThisMonth ?? 0}
          loading={loading}
        />
      </div>

      {/* Transactions and Buy Credits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentTransactions transactions={transactions} loading={loading} />
        </div>
        <div>
          <BuyCredits />
        </div>
      </div>

      {/* Teacher Payouts */}
      {canCashOut && (
        <div className="mt-6">
          <PayoutSection
            balance={wallet?.earnedBalance ?? 0}
            onBalanceChange={() => dispatch(fetchWallet())}
          />
        </div>
      )}
    </div>
  );
}

export default CreditsPage;
