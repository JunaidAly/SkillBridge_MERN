import { useEffect, useState } from "react";
import { FileText, Check, X } from "lucide-react";
import apiClient from "../api/client";
import Pagination from "../ui/Pagination";
import { useToast } from "../ui/Toast";

const formatDate = (dateString) =>
  dateString
    ? new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "-";

function AdminVerifications() {
  const { success, error: showError } = useToast();

  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [decidingUserId, setDecidingUserId] = useState(null);
  const [rejectingUserId, setRejectingUserId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchVerifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get(`/admin/verifications?status=pending&page=${page}&limit=10`);
        if (cancelled) return;
        setUsers(res.data.users || []);
        setTotalPages(res.data.totalPages || 1);
      } catch {
        if (!cancelled) setError("Unable to load verification requests. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchVerifications();
    return () => {
      cancelled = true;
    };
  }, [page]);

  const removeFromList = (userId) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleApprove = async (userId) => {
    setDecidingUserId(userId);
    try {
      await apiClient.patch(`/admin/verifications/${userId}`, { decision: "approved" });
      success("Teacher verified.");
      removeFromList(userId);
    } catch (err) {
      showError(err.response?.data?.message || "Unable to approve verification.");
    } finally {
      setDecidingUserId(null);
    }
  };

  const handleReject = async (userId) => {
    if (!rejectionReason.trim()) return;
    setDecidingUserId(userId);
    try {
      await apiClient.patch(`/admin/verifications/${userId}`, {
        decision: "rejected",
        rejectionReason: rejectionReason.trim(),
      });
      success("Verification rejected.");
      removeFromList(userId);
      setRejectingUserId(null);
      setRejectionReason("");
    } catch (err) {
      showError(err.response?.data?.message || "Unable to reject verification.");
    } finally {
      setDecidingUserId(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-family-poppins text-2xl font-bold text-black mb-1">
          Teacher Verifications
        </h1>
        <p className="font-family-poppins text-sm text-gray">
          Review pending teacher verification requests
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="font-family-poppins text-sm text-gray text-center py-8">{error}</p>
        )}

        {!loading && !error && users.length === 0 && (
          <p className="font-family-poppins text-sm text-gray text-center py-8">
            No pending verification requests.
          </p>
        )}

        {!loading && !error && users.length > 0 && (
          <>
            <div className="space-y-4">
              {users.map((u) => (
                <div key={u.id} className="border border-[#E5E5E5] rounded-xl p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <p className="font-family-poppins font-semibold text-black">{u.name}</p>
                      <p className="font-family-poppins text-xs text-gray mb-1">{u.email}</p>
                      <p className="font-family-poppins text-xs text-gray">
                        Submitted {formatDate(u.verificationSubmittedAt)}
                      </p>
                      {u.skillsTeaching?.length > 0 && (
                        <p className="font-family-poppins text-xs text-gray mt-1">
                          Teaches:{" "}
                          {u.skillsTeaching
                            .map((s) => (typeof s === "string" ? s : s.name))
                            .join(", ")}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {(u.verificationDocs || []).map((url, i) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-xs text-teal border border-teal/30 rounded-lg px-2.5 py-1.5 hover:bg-teal/5"
                          >
                            <FileText size={12} />
                            Document {i + 1}
                          </a>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApprove(u.id)}
                        disabled={decidingUserId === u.id}
                        className="flex items-center gap-1 font-family-poppins text-sm font-semibold text-white bg-teal px-3 py-2 rounded-lg disabled:opacity-50"
                      >
                        <Check size={16} />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setRejectingUserId(rejectingUserId === u.id ? null : u.id);
                          setRejectionReason("");
                        }}
                        disabled={decidingUserId === u.id}
                        className="flex items-center gap-1 font-family-poppins text-sm font-semibold text-red border border-red/30 px-3 py-2 rounded-lg disabled:opacity-50"
                      >
                        <X size={16} />
                        Reject
                      </button>
                    </div>
                  </div>

                  {rejectingUserId === u.id && (
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Reason for rejection..."
                        className="flex-1 font-family-poppins text-sm border border-[#D0D0D0] rounded-lg px-3 py-2 focus:outline-none focus:border-teal"
                      />
                      <button
                        onClick={() => handleReject(u.id)}
                        disabled={!rejectionReason.trim() || decidingUserId === u.id}
                        className="font-family-poppins text-sm font-semibold text-white bg-red px-4 py-2 rounded-lg disabled:opacity-50"
                      >
                        Confirm Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
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

export default AdminVerifications;
