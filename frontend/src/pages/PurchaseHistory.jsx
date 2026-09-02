import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/client";
import Pagination from "../ui/Pagination";
import Badge from "../ui/Badge";

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const formatAmount = (amount, currency) =>
  amount == null ? "-" : new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(amount);

function PurchaseHistory() {
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get(`/payments/transactions?page=${page}&limit=10`);
        if (cancelled) return;
        setTransactions(res.data.transactions || []);
        setTotalPages(res.data.totalPages || 1);
      } catch {
        if (!cancelled) setError("Unable to load purchase history. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTransactions();
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-family-poppins text-2xl font-bold text-black mb-1">
          Purchase History
        </h1>
        <p className="font-family-poppins text-sm text-gray">
          All your credit purchases in one place
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="font-family-poppins text-sm text-gray text-center py-8">{error}</p>
        )}

        {!loading && !error && transactions.length === 0 && (
          <div className="text-center py-10">
            <p className="font-family-poppins text-sm text-gray mb-3">No purchases yet</p>
            <Link
              to="/credits"
              className="font-family-poppins text-sm text-teal font-semibold hover:underline"
            >
              Buy Credits
            </Link>
          </div>
        )}

        {!loading && !error && transactions.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#E5E5E5]">
                    <th className="font-family-poppins text-xs text-gray font-medium pb-3">Date</th>
                    <th className="font-family-poppins text-xs text-gray font-medium pb-3">Credits</th>
                    <th className="font-family-poppins text-xs text-gray font-medium pb-3">Amount Paid</th>
                    <th className="font-family-poppins text-xs text-gray font-medium pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-[#F0F0F0] last:border-0">
                      <td className="font-family-poppins text-sm text-black py-3">
                        {formatDate(t.createdAt)}
                      </td>
                      <td className="font-family-poppins text-sm text-black py-3">
                        {t.creditsGranted}
                      </td>
                      <td className="font-family-poppins text-sm text-black py-3">
                        {formatAmount(t.amountPaid, t.currency)}
                      </td>
                      <td className="py-3">
                        <Badge status={t.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default PurchaseHistory;
