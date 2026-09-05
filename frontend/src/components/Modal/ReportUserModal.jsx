import { useEffect, useState } from "react";
import { X } from "lucide-react";

const REPORT_REASONS = [
  "Harassment or abuse",
  "Spam",
  "Inappropriate content",
  "Scam or fraud",
  "Impersonation",
  "Other",
];

function ReportUserModal({ isOpen, onClose, onSubmit, userName, isSubmitting }) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleClose = () => {
    if (isSubmitting) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setReason(REPORT_REASONS[0]);
      setDetails("");
      onClose();
    }, 200);
  };

  const handleSubmit = () => {
    const fullReason = details.trim() ? `${reason} - ${details.trim()}` : reason;
    onSubmit(fullReason);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        isClosing ? "modal-overlay-exit" : "modal-overlay-enter"
      }`}
    >
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      <div
        className={`relative bg-white shadow-xl rounded-2xl w-full max-w-md ${
          isClosing ? "modal-content-exit" : "modal-content-enter"
        }`}
      >
        <div className="p-6 pb-4 border-b border-[#E5E5E5] flex items-center justify-between">
          <h2 className="font-family-poppins text-xl font-bold text-black">Report User</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-all"
            disabled={isSubmitting}
          >
            <X className="text-gray" size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="font-family-poppins text-sm text-gray">
            Report <span className="font-semibold text-black">{userName}</span> to the SkillBridge team for review.
          </p>

          <div>
            <label className="font-family-poppins text-xs text-gray mb-2 block">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 border border-[#D0D0D0] rounded-lg font-family-poppins text-sm outline-none focus:border-teal bg-white"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-family-poppins text-xs text-gray mb-2 block">
              Additional details (optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              placeholder="Anything that would help us review this..."
              className="w-full px-4 py-3 border border-[#D0D0D0] rounded-lg font-family-poppins text-sm outline-none focus:border-teal resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="font-family-poppins font-medium px-6 py-2.5 rounded-lg transition-all border border-gray text-black hover:bg-dark-blue hover:text-white disabled:opacity-50 disabled:pointer-events-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="font-family-poppins font-medium px-6 py-2.5 rounded-lg transition-all bg-red-600 text-white hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportUserModal;
