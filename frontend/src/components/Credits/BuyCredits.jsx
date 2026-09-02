import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CheckoutEventNames } from "@paddle/paddle-js";
import apiClient from "../../api/client";
import { getPaddleInstance, onPaddleEvent } from "../../lib/paddle";
import { fetchWallet } from "../../store/creditsSlice";
import { useToast } from "../../ui/Toast";

function BuyCredits() {
  const dispatch = useDispatch();
  const { success, error: showError } = useToast();
  const userId = useSelector((state) => state.auth.user?.id);

  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState(null);
  const [buyingPriceId, setBuyingPriceId] = useState(null);

  const fetchPackages = () => {
    apiClient
      .get("/payments/packages")
      .then((res) => {
        setPackages(res.data.packages || []);
        if (!res.data.packages?.length) {
          setPackagesError("No credit packages are available right now.");
        }
      })
      .catch(() => {
        setPackagesError("Unable to load packages. Please try again.");
      })
      .finally(() => setPackagesLoading(false));
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const retryLoadPackages = () => {
    setPackagesLoading(true);
    setPackagesError(null);
    fetchPackages();
  };

  useEffect(() => {
    const unsubscribe = onPaddleEvent((event) => {
      if (event.name === CheckoutEventNames.CHECKOUT_COMPLETED) {
        setBuyingPriceId(null);
        success("Purchase successful! Your credits have been added.");
        dispatch(fetchWallet());
      } else if (event.name === CheckoutEventNames.CHECKOUT_CLOSED) {
        setBuyingPriceId(null);
      } else if (
        event.name === CheckoutEventNames.CHECKOUT_ERROR ||
        event.name === CheckoutEventNames.CHECKOUT_PAYMENT_FAILED
      ) {
        setBuyingPriceId(null);
        showError("Payment could not be completed. Please try again.");
      }
    });
    return unsubscribe;
  }, [dispatch, success, showError]);

  const handleBuy = async (priceId) => {
    if (buyingPriceId) return;
    setBuyingPriceId(priceId);
    try {
      await apiClient.post("/payments/checkout", { priceId });
      const paddle = await getPaddleInstance();
      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customData: { userId },
      });
    } catch (err) {
      setBuyingPriceId(null);
      showError(err.response?.data?.message || "Unable to start checkout. Please try again.");
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="font-family-poppins text-lg font-semibold text-black mb-4">
        Buy Credits
      </h2>

      {packagesLoading && (
        <p className="font-family-poppins text-sm text-gray text-center py-6">
          Loading packages...
        </p>
      )}

      {!packagesLoading && packagesError && (
        <div className="text-center py-6">
          <p className="font-family-poppins text-sm text-gray mb-3">{packagesError}</p>
          <button
            onClick={retryLoadPackages}
            className="font-family-poppins text-sm text-teal font-semibold hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {!packagesLoading && !packagesError && (
        <div className="space-y-3">
          {packages.map((pkg) => {
            const isBuying = buyingPriceId === pkg.priceId;
            return (
              <div
                key={pkg.priceId}
                className="relative flex items-center justify-between p-4 rounded-xl border border-[#E5E5E5]"
              >
                <div>
                  <p className="font-family-poppins text-2xl font-bold text-black">
                    {pkg.credits}
                  </p>
                  <p className="font-family-poppins text-xs text-gray">{pkg.label}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-family-poppins text-base font-semibold text-black">
                    {pkg.displayPrice}
                  </p>
                  <button
                    onClick={() => handleBuy(pkg.priceId)}
                    disabled={!!buyingPriceId}
                    className="font-family-poppins text-sm font-semibold text-white bg-teal px-4 py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed min-w-[72px]"
                  >
                    {isBuying ? (
                      <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Buy"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="font-family-poppins text-xs text-gray text-center mt-4">
        Credits never expire. Use them anytime.
      </p>
    </div>
  );
}

export default BuyCredits;
