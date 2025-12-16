import { useState } from "react";

const creditPackages = [
  {
    id: 1,
    credits: 50,
    price: "PKR 100",
    popular: false,
  },
  {
    id: 2,
    credits: 100,
    price: "PKR 200",
    popular: true,
  },
  {
    id: 3,
    credits: 200,
    price: "PKR 400",
    popular: false,
  },
];

function BuyCredits() {
  const [selectedPackage, setSelectedPackage] = useState(2);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="font-family-poppins text-lg font-semibold text-black mb-4">
        Buy Credits
      </h2>

      <div className="space-y-3">
        {creditPackages.map((pkg) => (
          <div
            key={pkg.id}
            onClick={() => setSelectedPackage(pkg.id)}
            className={`relative flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all ${
              selectedPackage === pkg.id
                ? "border-2 border-teal bg-teal/5"
                : "border border-[#E5E5E5] hover:border-teal/50"
            }`}
          >
            {pkg.popular && (
              <span className="absolute -top-2 left-3 px-2 py-0.5 bg-teal text-white text-xs font-family-poppins rounded">
                Popular
              </span>
            )}
            <div>
              <p className="font-family-poppins text-2xl font-bold text-black">
                {pkg.credits}
              </p>
              <p className="font-family-poppins text-xs text-gray">Credits</p>
            </div>
            <p className="font-family-poppins text-base font-semibold text-black">
              {pkg.price}
            </p>
          </div>
        ))}
      </div>

      <p className="font-family-poppins text-xs text-gray text-center mt-4">
        Credits never expire. Use them anytime.
      </p>
    </div>
  );
}

export default BuyCredits;
