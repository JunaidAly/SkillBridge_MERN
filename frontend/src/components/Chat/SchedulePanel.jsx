import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Wallet, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../ui/Button";
import { useToast } from "../../ui/Toast";
import { useDispatch, useSelector } from "react-redux";
import { createMeeting, fetchMeetings } from "../../store/meetingsSlice";
import { fetchWallet, processSessionCredits } from "../../store/creditsSlice";
import { fetchProfile } from "../../store/profileSlice";

// A call can be joined starting this many minutes before its scheduled start.
const JOIN_WINDOW_BEFORE_MINUTES = 10;

function SchedulePanel({ selectedChat }) {
  // Set default date to today
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedTime, setSelectedTime] = useState("15:00");
  const [sessionRole, setSessionRole] = useState("teaching"); // "teaching" or "learning"
  const [selectedSkill, setSelectedSkill] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { meetings } = useSelector((s) => s.meetings);
  const { wallet } = useSelector((s) => s.credits);
  const { profile } = useSelector((s) => s.profile);

  useEffect(() => {
    dispatch(fetchMeetings());
    dispatch(fetchWallet());
    dispatch(fetchProfile());
  }, [dispatch]);

  // Re-check join-window eligibility periodically so the "Join" button enables
  // itself live once a session comes within the join window, without a page refresh.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Get skills based on session role
  const availableSkills = useMemo(() => {
    if (!profile) return [];
    if (sessionRole === "teaching") {
      return (profile.skillsTeaching || []).map((s) => s.name);
    } else {
      return (profile.skillsLearning || []).map((s) => typeof s === 'string' ? s : s.name);
    }
  }, [profile, sessionRole]);

  // Reset selected skill when role changes
  useEffect(() => {
    setSelectedSkill(availableSkills[0] || "");
  }, [sessionRole, availableSkills]);

  const upcomingReminders = useMemo(() => {
    const list = (meetings || []).slice(0, 10).map((m) => {
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
    return list;
  }, [meetings, now]);

  const handlePropose = async () => {
    if (!selectedChat?.otherUserId) {
      toast.warning("Select a chat first to propose a session.");
      return;
    }

    // Check balance if learning
    if (sessionRole === "learning" && (!wallet || wallet.balance < 25)) {
      toast.error("Insufficient credits. You need 25 credits to schedule a learning session.");
      return;
    }

    setIsSubmitting(true);
    try {
      const startsAt = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
      const roleLabel = sessionRole === "teaching" ? "Teaching" : "Learning";
      const skillLabel = selectedSkill ? ` - ${selectedSkill}` : "";
      const title = `${roleLabel}${skillLabel} with ${selectedChat.name}`;

      const meetingResult = await dispatch(
        createMeeting({
          conversationId: selectedChat._id,
          otherUserId: selectedChat.otherUserId,
          title,
          startsAt,
          sessionType: sessionRole,
          skill: selectedSkill || null,
          duration: 60,
        })
      ).unwrap();

      // Process credits for both users using the new unified endpoint
      await dispatch(
        processSessionCredits({
          meetingId: meetingResult._id,
          otherUserId: selectedChat.otherUserId,
          sessionRole: sessionRole,
        })
      ).unwrap();

      // Refresh wallet and profile (for updated stats)
      dispatch(fetchWallet());
      dispatch(fetchProfile());
      toast.success("Session scheduled successfully! Credits processed for both users.");
    } catch (err) {
      toast.error(err || "Failed to schedule session");
    } finally {
      setIsSubmitting(false);
    }
  };

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

      {/* Schedule Session */}
      <div className="mb-6">
        <h2 className="font-family-poppins text-lg font-semibold text-black mb-1">
          Schedule Session
        </h2>
        <p className="font-family-poppins text-xs text-gray mb-4">
          Time Zone: UTC-5 (Auto-sync)
        </p>

        {/* Role Selector */}
        <div className="mb-4">
          <label className="font-family-poppins text-xs text-gray mb-2 block">
            I want to:
          </label>
          <div className="flex gap-2">
            <button
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

        {/* Skill Selector */}
        <div className="mb-4">
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

        {/* Date Picker */}
        <div className="mb-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-3 border border-[#D0D0D0] rounded-lg font-family-poppins text-sm outline-none focus:border-teal"
          />
        </div>

        <div className="mb-4">
          <input
            type="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="w-full px-4 py-3 border border-[#D0D0D0] rounded-lg font-family-poppins text-sm outline-none focus:border-teal"
          />
        </div>

        <Button
          variant="herobtn"
          className="w-full py-2.5"
          onClick={handlePropose}
          disabled={
            isSubmitting ||
            (sessionRole === "learning" && (!wallet || wallet.balance < 25)) ||
            availableSkills.length === 0
          }
        >
          {isSubmitting ? "Scheduling..." : "Propose New Session"}
        </Button>

        {sessionRole === "learning" && wallet && wallet.balance < 25 && (
          <p className="font-family-poppins text-xs text-red-500 mt-2 text-center">
            Insufficient credits for learning session
          </p>
        )}
      </div>

      {/* Upcoming Reminders */}
      <div className="flex-1 flex flex-col min-h-0">
        <h2 className="font-family-poppins text-lg font-semibold text-black mb-4">
          Upcoming Reminders
        </h2>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
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
                  {reminder.canJoin ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-teal bg-teal/10 px-2.5 py-1.5 rounded-lg shrink-0">
                      <Video size={14} />
                      Join
                    </span>
                  ) : (
                    <ChevronRight
                      className="text-gray transition-colors shrink-0"
                      size={18}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SchedulePanel;
