import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../../ui/Toast";
import { createMeeting, fetchMeetings } from "../../store/meetingsSlice";
import { fetchWallet } from "../../store/creditsSlice";
import { fetchProfile } from "../../store/profileSlice";

// Rounds up to the next 15-minute mark so the default doesn't land in the past.
function getDefaultDateTime() {
  const d = new Date();
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
  const pad = (n) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function ScheduleSessionModal({ isOpen, onClose, selectedChat }) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [sessionRole, setSessionRole] = useState("teaching");
  const [selectedSkill, setSelectedSkill] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const dispatch = useDispatch();
  const toast = useToast();
  const { profile } = useSelector((s) => s.profile);
  const { conversations } = useSelector((s) => s.chat);
  const { user } = useSelector((s) => s.auth);

  const contacts = useMemo(() => {
    const meId = user?.id;
    return (conversations || []).map((c) => {
      const other = (c.participants || []).find((p) => String(p._id || p.id) !== String(meId));
      return {
        conversationId: c._id,
        otherUserId: other?._id || other?.id,
        name: other?.name || "Conversation",
      };
    }).filter((c) => c.otherUserId);
  }, [conversations, user]);

  const recipient = contacts.find((c) => c.otherUserId === recipientId);

  // Reset the form defaults (including current-time-based date/time) every
  // time the modal opens, and pre-fill the recipient if one was pre-selected.
  useEffect(() => {
    if (!isOpen) return;
    const { date, time } = getDefaultDateTime();
    setSelectedDate(date);
    setSelectedTime(time);
    setRecipientId(selectedChat?.otherUserId || "");
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, selectedChat]);

  const availableSkills = useMemo(() => {
    if (!profile) return [];
    if (sessionRole === "teaching") {
      return (profile.skillsTeaching || []).map((s) => s.name);
    }
    return (profile.skillsLearning || []).map((s) => (typeof s === "string" ? s : s.name));
  }, [profile, sessionRole]);

  useEffect(() => {
    setSelectedSkill(availableSkills[0] || "");
  }, [sessionRole, availableSkills]);

  const handleClose = () => {
    if (isSubmitting) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  const handlePropose = async () => {
    if (!recipient) {
      toast.warning("Choose who to schedule this session with.");
      return;
    }

    setIsSubmitting(true);
    try {
      const startsAt = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
      const roleLabel = sessionRole === "teaching" ? "Teaching" : "Learning";
      const skillLabel = selectedSkill ? ` - ${selectedSkill}` : "";
      const title = `${roleLabel}${skillLabel} with ${recipient.name}`;

      await dispatch(
        createMeeting({
          conversationId: recipient.conversationId,
          otherUserId: recipient.otherUserId,
          title,
          startsAt,
          sessionType: sessionRole,
          skill: selectedSkill || null,
          duration: 60,
        })
      ).unwrap();

      dispatch(fetchWallet());
      dispatch(fetchProfile());
      dispatch(fetchMeetings());
      toast.success("Session scheduled! Credits are exchanged once the session is completed.");
      handleClose();
    } catch (err) {
      toast.error(err || "Failed to schedule session");
    } finally {
      setIsSubmitting(false);
    }
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
        className={`relative bg-white shadow-xl rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto ${
          isClosing ? "modal-content-exit" : "modal-content-enter"
        }`}
      >
        <div className="p-6 pb-4 border-b border-[#E5E5E5] flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
          <h2 className="font-family-poppins text-xl font-bold text-black">
            Schedule Session
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-all"
            disabled={isSubmitting}
          >
            <X className="text-gray" size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="font-family-poppins text-xs text-gray mb-2 block">
              Schedule with:
            </label>
            {contacts.length > 0 ? (
              <select
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="w-full px-4 py-3 border border-[#D0D0D0] rounded-lg font-family-poppins text-sm outline-none focus:border-teal bg-white"
              >
                <option value="" disabled>
                  Select a person...
                </option>
                {contacts.map((c) => (
                  <option key={c.otherUserId} value={c.otherUserId}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="font-family-poppins text-xs text-orange-500 p-2 bg-orange-50 rounded-lg">
                Start a conversation first to schedule a session with someone.
              </p>
            )}
          </div>

          <div>
            <label className="font-family-poppins text-xs text-gray mb-2 block">
              I want to:
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSessionRole("teaching")}
                className={`flex-1 py-2 px-3 rounded-lg font-family-poppins text-sm transition-all ${
                  sessionRole === "teaching"
                    ? "bg-teal text-white"
                    : "bg-gray-100 text-gray hover:bg-gray-200"
                }`}
              >
                Teach (+25)
              </button>
              <button
                type="button"
                onClick={() => setSessionRole("learning")}
                className={`flex-1 py-2 px-3 rounded-lg font-family-poppins text-sm transition-all ${
                  sessionRole === "learning"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray hover:bg-gray-200"
                }`}
              >
                Learn (-25)
              </button>
            </div>
          </div>

          <div>
            <label className="font-family-poppins text-xs text-gray mb-2 block">
              {sessionRole === "teaching" ? "Skill to teach:" : "Skill to learn:"}
            </label>
            {availableSkills.length > 0 ? (
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="w-full px-4 py-3 border border-[#D0D0D0] rounded-lg font-family-poppins text-sm outline-none focus:border-teal bg-white"
              >
                {availableSkills.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill}
                  </option>
                ))}
              </select>
            ) : (
              <p className="font-family-poppins text-xs text-orange-500 p-2 bg-orange-50 rounded-lg">
                No {sessionRole === "teaching" ? "teaching" : "learning"} skills added.{" "}
                <a href="/profile" className="underline text-teal">
                  Add skills in your profile
                </a>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-family-poppins text-xs text-gray mb-2 block">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 border border-[#D0D0D0] rounded-lg font-family-poppins text-sm outline-none focus:border-teal"
              />
            </div>
            <div>
              <label className="font-family-poppins text-xs text-gray mb-2 block">Time</label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-4 py-3 border border-[#D0D0D0] rounded-lg font-family-poppins text-sm outline-none focus:border-teal"
              />
            </div>
          </div>

          <p className="font-family-poppins text-xs text-gray bg-gray-50 rounded-lg p-2.5">
            Credits are only exchanged once the session actually completes - not at booking time.
          </p>

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
              onClick={handlePropose}
              disabled={isSubmitting || availableSkills.length === 0 || !recipient}
              className="font-family-poppins font-medium px-6 py-2.5 rounded-lg transition-all bg-dark-blue text-white hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? "Scheduling..." : "Propose New Session"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScheduleSessionModal;
