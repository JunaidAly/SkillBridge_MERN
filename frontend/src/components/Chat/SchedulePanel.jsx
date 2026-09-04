import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Wallet, Video, X, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CancelSessionModal from "../Modal/CancelSessionModal";
import { useToast } from "../../ui/Toast";
import { useDispatch, useSelector } from "react-redux";
import { fetchMeetings, cancelMeeting } from "../../store/meetingsSlice";
import { fetchWallet } from "../../store/creditsSlice";

// A call can be joined starting this many minutes before its scheduled start.
const JOIN_WINDOW_BEFORE_MINUTES = 10;

function SchedulePanel({ onScheduleClick }) {
  const [now, setNow] = useState(() => Date.now());
  const [cancellingId, setCancellingId] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { meetings } = useSelector((s) => s.meetings);
  const { wallet } = useSelector((s) => s.credits);

  useEffect(() => {
    dispatch(fetchMeetings());
    dispatch(fetchWallet());
  }, [dispatch]);

  // Re-check join-window eligibility periodically so the "Join" button enables
  // itself live once a session comes within the join window, without a page refresh.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const upcomingReminders = useMemo(() => {
    return (meetings || []).slice(0, 10).map((m) => {
      const other = (m.participants || []).find((p) => String(p._id || p.id) !== String(m.createdBy));
      const startsAtMs = new Date(m.startsAt).getTime();
      const endsAtMs = startsAtMs + (m.duration || 60) * 60 * 1000;
      const joinOpensAtMs = startsAtMs - JOIN_WINDOW_BEFORE_MINUTES * 60 * 1000;
      const canJoin = now >= joinOpensAtMs && now <= endsAtMs;

      return {
        id: m._id,
        title: m.title,
        date: new Date(m.startsAt).toLocaleString(),
        person: other?.name || "Participant",
        skill: m.skill,
        sessionType: m.sessionType,
        canJoin,
      };
    });
  }, [meetings, now]);

  const handleConfirmCancel = async () => {
    if (!cancellingId) return;
    setIsCancelling(true);
    try {
      await dispatch(cancelMeeting(cancellingId)).unwrap();
      toast.success("Session cancelled.");
      setCancellingId(null);
    } catch (err) {
      toast.error(err || "Failed to cancel session");
    } finally {
      setIsCancelling(false);
    }
  };

  const cancellingReminder = upcomingReminders.find((r) => r.id === cancellingId);

  return (
    <div className="w-full lg:w-80 bg-white border-l border-[#E5E5E5] flex flex-col h-full p-4">
      {/* Credit Balance */}
      <div className="mb-4 p-3 bg-teal/10 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="text-teal" size={18} />
          <span className="font-family-poppins text-sm text-gray">Balance</span>
        </div>
        <span className="font-family-poppins text-lg font-bold text-teal">
          {wallet?.balance ?? 0}
        </span>
      </div>

      <button
        onClick={onScheduleClick}
        className="mb-6 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-family-poppins text-sm font-semibold text-white bg-dark-blue hover:opacity-90 transition-all"
      >
        <Plus size={18} />
        Schedule New Session
      </button>

      {/* Upcoming Reminders */}
      <div className="flex-1 flex flex-col min-h-0">
        <h2 className="font-family-poppins text-lg font-semibold text-black mb-4">
          Upcoming Reminders
        </h2>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="space-y-3 pr-1">
            {upcomingReminders.length === 0 ? (
              <p className="font-family-poppins text-xs text-gray text-center py-4">
                No upcoming sessions scheduled
              </p>
            ) : (
              upcomingReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-all group ${
                    reminder.canJoin ? "hover:bg-gray-50 cursor-pointer" : "cursor-default opacity-70"
                  }`}
                  onClick={() => {
                    if (reminder.canJoin) {
                      navigate(`/meetings/${reminder.id}/call`);
                    } else {
                      toast.info(`You can join this call ${JOIN_WINDOW_BEFORE_MINUTES} minutes before it starts.`);
                    }
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-family-poppins text-sm font-medium text-black truncate">
                        {reminder.title}
                      </h3>
                      {reminder.sessionType && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                            reminder.sessionType === "teaching"
                              ? "bg-teal/20 text-teal"
                              : "bg-orange-100 text-orange-600"
                          }`}
                        >
                          {reminder.sessionType === "teaching" ? "Teaching" : "Learning"}
                        </span>
                      )}
                    </div>
                    <p className="font-family-poppins text-xs text-gray mt-1">
                      {reminder.date}
                    </p>
                    {reminder.skill && (
                      <p className="font-family-poppins text-xs text-teal mt-0.5">
                        {reminder.skill}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {reminder.canJoin && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-teal bg-teal/10 px-2.5 py-1.5 rounded-lg">
                        <Video size={14} />
                        Join
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCancellingId(reminder.id);
                      }}
                      className="p-1.5 rounded-lg text-gray hover:text-red-600 hover:bg-red-50 transition-colors"
                      aria-label="Cancel session"
                    >
                      <X size={16} />
                    </button>
                    {!reminder.canJoin && <ChevronRight className="text-gray transition-colors" size={18} />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <CancelSessionModal
        isOpen={!!cancellingId}
        onClose={() => setCancellingId(null)}
        onConfirm={handleConfirmCancel}
        title={cancellingReminder?.title}
        isCancelling={isCancelling}
      />
    </div>
  );
}

export default SchedulePanel;
