import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../ui/Input";
import Button from "../ui/AuthButton";
import apiClient from "../api/client";
import { useToast } from "../ui/Toast";

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [step, setStep] = useState("email"); // 'email' | 'reset'
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await apiClient.post("/auth/forgot-password", { email: email.trim() });
      showSuccess(res.data.message || "If an account exists for that email, a reset code has been sent.");
      setStep("reset");
    } catch (err) {
      showError(err.response?.data?.message || "Failed to send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!code.trim() || !newPassword) return;
    if (newPassword !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await apiClient.post("/auth/reset-password", {
        email: email.trim(),
        code: code.trim(),
        newPassword,
      });
      showSuccess("Password reset successfully. You can now log in.");
      navigate("/login", { replace: true });
    } catch (err) {
      showError(err.response?.data?.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-bg px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-left mb-8">
          <h1 className="font-family-poppins text-4xl font-semibold text-black mb-2">
            {step === "email" ? "Forgot Password?" : "Reset Password"}
          </h1>
          <p className="font-family-poppins text-sm text-gray">
            {step === "email"
              ? "Enter your email and we'll send you a reset code."
              : `Enter the code sent to ${email} and choose a new password.`}
          </p>
        </div>

        {step === "email" ? (
          <form onSubmit={handleRequestCode} className="flex flex-col gap-4">
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
              className="w-full rounded-full py-4 mt-2"
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <Input
              label="Reset Code"
              name="code"
              type="text"
              placeholder="Enter the 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Input
              label="New Password"
              name="newPassword"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
              className="w-full rounded-full py-4 mt-2"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
            <button
              type="button"
              onClick={() => setStep("email")}
              className="font-family-poppins text-sm text-teal hover:underline text-center"
            >
              Use a different email
            </button>
          </form>
        )}

        <p className="font-family-poppins text-sm text-gray text-center mt-6">
          Remembered your password?{" "}
          <Link to="/login" className="text-teal hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
