import { useState } from "react";
import { ChevronRight } from "lucide-react";
import Button from "../../ui/Button";

const upcomingReminders = [
  {
    id: 1,
    title: "Python Advanced Session",
    date: "Today, 3:00 PM",
    person: "Alice Johnson",
  },
  {
    id: 2,
    title: "Machine Learning Session",
    date: "Tomorrow, 10:00 AM",
    person: "Bob Smith",
  },
  {
    id: 3,
    title: "Database Design Session",
    date: "Fri, Aug 23, 1:00 PM",
    person: "Charlie Brown",
  },
];

function SchedulePanel() {
  const [selectedDate, setSelectedDate] = useState("2025-12-02");

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

        <Button variant="herobtn" className="w-full py-2.5">
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
