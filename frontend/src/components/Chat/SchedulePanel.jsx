import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import Button from "../../ui/Button";
import { useDispatch, useSelector } from "react-redux";
import { createMeeting, fetchMeetings } from "../../store/meetingsSlice";

function SchedulePanel({ selectedChat }) {
  const [selectedDate, setSelectedDate] = useState("2025-12-02");
  const [selectedTime, setSelectedTime] = useState("15:00");
  const dispatch = useDispatch();
  const { meetings } = useSelector((s) => s.meetings);

  useEffect(() => {
    dispatch(fetchMeetings());
  }, [dispatch]);

  const upcomingReminders = useMemo(() => {
    const list = (meetings || []).slice(0, 10).map((m) => {
      const other = (m.participants || []).find((p) => String(p._id || p.id) !== String(m.createdBy));
      return {
        id: m._id,
        title: m.title,
        date: new Date(m.startsAt).toLocaleString(),
        person: other?.name || "Participant",
        joinUrl: m.joinUrl,
      };
    });
    return list;
  }, [meetings]);

  const handlePropose = async () => {
    if (!selectedChat?.otherUserId) {
      alert("Select a chat first to propose a session.");
      return;
    }
    const startsAt = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
    const title = `Session with ${selectedChat.name}`;
    await dispatch(
      createMeeting({
        conversationId: selectedChat._id,
        otherUserId: selectedChat.otherUserId,
        title,
        startsAt,
      })
    ).unwrap();
  };

  return (
    <div className="w-full lg:w-80 bg-white border-l border-[#E5E5E5] flex flex-col h-full p-4">
      {/* Schedule Session */}
      <div className="mb-6">
        <h2 className="font-family-poppins text-lg font-semibold text-black mb-1">
          Schedule Session
        </h2>
        <p className="font-family-poppins text-xs text-gray mb-4">
          Time Zone: UTC-5 (Auto-sync)
        </p>

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

        <Button variant="herobtn" className="w-full py-2.5" onClick={handlePropose}>
          Propose New Session
        </Button>
      </div>

      {/* Upcoming Reminders */}
      <div className="flex-1">
        <h2 className="font-family-poppins text-lg font-semibold text-black mb-4">
          Upcoming Reminders
        </h2>

        <div className="space-y-3">
          {upcomingReminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-all group"
              onClick={() => reminder.joinUrl && window.open(reminder.joinUrl, "_blank", "noopener,noreferrer")}
            >
              <div>
                <h3 className="font-family-poppins text-sm font-medium text-black">
                  {reminder.title}
                </h3>
                <p className="font-family-poppins text-xs text-gray mt-1">
                  {reminder.date} with {reminder.person}
                </p>
              </div>
              <ChevronRight
                className="text-gray group-hover:text-teal transition-colors"
                size={18}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SchedulePanel;
