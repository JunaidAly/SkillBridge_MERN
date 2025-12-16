import { useState } from "react";
import Button from "../ui/AuthButton";

function TwoFactorPage() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);

  const handleChange = (index, value) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace to go to previous input
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fullCode = code.join("");
    console.log("Submitted code:", fullCode);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - 2FA Form */}
      <div className="w-full lg:w-1/2 bg-light-bg flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-left mb-8">
            <h1 className="font-family-poppins text-3xl font-bold text-black mb-3">
              Authenticate Your Account
            </h1>
            <p className="font-family-poppins text-sm text-[#575757]">
              Protecting your privacy is our top priority. Please confirm your
              account by entering the authorization code sent to your email.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Code Input Boxes */}
            <div className="flex gap-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-14 h-16 text-center text-2xl font-semibold border border-[#D0D0D0] rounded-lg outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
                />
              ))}
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="font-family-poppins text-sm text-[#575757]">
                It may take a minute to receive your code.
                <br />
                Haven't received it?{" "}
                <a href="#" className="text-teal font-medium hover:underline">
                  Resend a new code.
                </a>
              </p>

              <Button variant="primary" className="rounded-full px-10 py-3">
                Submit
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-dark-blue flex-col items-center justify-center px-8 text-center relative overflow-hidden">
        {/* Top Left Image */}
        <img
          src="/auth/1.png"
          alt=""
          className="absolute top-8 left-8 w-24 h-24 object-contain"
        />
        {/* Middle Right Image */}
        <img
          src="/auth/2.png"
          alt=""
          className="absolute top-[30%] right-8 -translate-y-1/2 w-24 h-24 object-contain"
        />
        {/* Bottom Right Image */}
        <img
          src="/auth/3.png"
          alt=""
          className="absolute bottom-8 right-8 w-24 h-24 object-contain"
        />

        <img
          src="/logo.svg"
          alt="SkillBridge Logo"
          className="h-16 mb-8"
        />
        <h2 className="font-family-poppins text-4xl font-bold text-white mb-4">
          Start Learning Today
        </h2>
        <p className="font-family-poppins text-lg text-white/80 max-w-md">
          Join SkillBridge. Your next breakthrough is just a connection away
        </p>
      </div>
    </div>
  );
}

export default TwoFactorPage;
