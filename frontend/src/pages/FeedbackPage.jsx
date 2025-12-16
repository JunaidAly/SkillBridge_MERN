import { useState } from "react";
import { Star } from "lucide-react";
import Button from "../ui/Button";

const feedbackReceived = [
  {
    id: 1,
    name: "Alex Johnson",
    type: "Rated you",
    rating: 5,
    date: "2024-10-22",
    comment:
      "Jane is an outstanding teacher! Her explanations were incredibly clear, and she made complex topics easy to understand. Highly recommended!",
    skill: "Introduction to Data Science",
    avatar: null,
  },
  {
    id: 2,
    name: "Chris Miller",
    type: "Rated you",
    rating: 5,
    date: "2024-11-15",
    comment:
      "Jane is an outstanding teacher! Her explanations were incredibly clear, and she made complex topics easy to understand. Highly recommended!",
    skill: "Digital Marketing Strategies",
    avatar: null,
  },
  {
    id: 3,
    name: "Jessica Brown",
    type: "Rated you",
    rating: 4,
    date: "2024-10-12",
    comment:
      "Jane clarified all my doubts and provided excellent examples. The session was very engaging and I learned a lot.",
    skill: "Advanced Excel Techniques",
    avatar: null,
  },
];

const feedbackGiven = [
  {
    id: 1,
    name: "Michael Chen",
    type: "You rated",
    rating: 5,
    date: "2024-10-20",
    comment:
      "Michael was an excellent mentor. His approach to teaching React was very practical and hands-on.",
    skill: "Advanced React Development",
    avatar: null,
  },
  {
    id: 2,
    name: "Sarah Wilson",
    type: "You rated",
    rating: 4,
    date: "2024-09-28",
    comment:
      "Great session on Python basics. Sarah explained concepts clearly and patiently.",
    skill: "Python Programming",
    avatar: null,
  },
];

function FeedbackPage() {
  const [rating, setRating] = useState(1);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [activeTab, setActiveTab] = useState("received");

  const session = {
    person: "Michael Chen",
    skill: "Advanced React Development",
    date: "2025-10-26",
    avatar: null,
  };

  const handleSubmit = () => {
    // Handle feedback submission
    console.log({ rating, feedback });
  };

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <h1 className="font-family-poppins text-2xl font-bold text-black mb-6">
        Feedback & Ratings
      </h1>

      {/* Feedback Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        {/* Section Title */}
        <h2 className="font-family-poppins text-xl font-bold text-black mb-2">
          Provide Feedback
        </h2>
        <p className="font-family-poppins text-sm text-gray mb-6">
          Rate your recent session with {session.person} on {session.skill}.
        </p>

        <hr className="border-[#E5E5E5] mb-6" />

        {/* Session Info Card */}
        <div className="border border-[#E5E5E5] rounded-xl p-5 mb-6">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
              {session.avatar ? (
                <img
                  src={session.avatar}
                  alt={session.person}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-gray text-xl font-medium">
                  {session.person.charAt(0)}
                </span>
              )}
            </div>

            {/* Info */}
            <div>
              <h3 className="font-family-poppins text-base font-semibold text-black">
                {session.person}
              </h3>
              <p className="font-family-poppins text-sm text-gray">
                {session.skill} - {session.date}
              </p>
            </div>
          </div>
        </div>

        {/* Rating Section */}
        <div className="mb-6">
          <h3 className="font-family-poppins text-base font-semibold text-black mb-3">
            Your Rating
          </h3>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  size={28}
                  className={`${
                    star <= (hoveredRating || rating)
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-gray-300"
                  } transition-colors`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Feedback */}
        <div className="mb-6">
          <h3 className="font-family-poppins text-base font-semibold text-black mb-3">
            Detailed Feedback
          </h3>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your detailed feedback on the session experience, what went well, and areas for improvement..."
            className="w-full px-4 py-3 border border-[#D0D0D0] rounded-xl font-family-poppins text-sm outline-none focus:border-teal resize-none h-32"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            variant="herobtn"
            className="px-6 py-2.5"
            onClick={handleSubmit}
          >
            Submit Feedback
          </Button>
        </div>
      </div>

      {/* Feedback History Section */}
      <div className="mt-8">
        <h2 className="font-family-poppins text-xl font-bold text-black mb-6">
          Feedback History
        </h2>

        {/* Tabs */}
        <div className="flex justify-center max-w-88 mx-auto px-1 py-1.5 bg-light-teal rounded-lg items-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab("received")}
            className={`px-5 py-3 rounded-lg font-family-poppins text-sm font-medium transition-all ${
              activeTab === "received"
                ? "bg-dark-blue text-white"
                : "text-black "
            }`}
          >
            Feedback Received
          </button>
          <button
            onClick={() => setActiveTab("given")}
            className={`px-5 py-3 rounded-lg font-family-poppins text-sm font-medium transition-all ${
              activeTab === "given"
                ? "bg-dark-blue text-white"
                : "text-black "
            }`}
          >
            Feedback Given
          </button>
        </div>

        {/* Feedback Cards */}
        <div className="space-y-4">
          {(activeTab === "received" ? feedbackReceived : feedbackGiven).map(
            (item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl p-6 shadow-sm"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                      {item.avatar ? (
                        <img
                          src={item.avatar}
                          alt={item.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-gray text-lg font-medium">
                          {item.name.charAt(0)}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div>
                      <h3 className="font-family-poppins text-base font-semibold text-black">
                        {item.name}
                      </h3>
                      <p className="font-family-poppins text-xs text-gray">
                        {item.type}
                      </p>
                    </div>
                  </div>

                  {/* Rating and Date */}
                  <div className="text-right">
                    <div className="flex items-center gap-0.5 justify-end mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={18}
                          className={`${
                            star <= item.rating
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="font-family-poppins text-xs text-gray">
                      {item.date}
                    </p>
                  </div>
                </div>

                {/* Comment */}
                <p className="font-family-poppins text-sm text-gray mb-4">
                  {item.comment}
                </p>

                {/* Skill Tag */}
                <span className="inline-block px-4 py-2 bg-light-teal rounded-full font-family-poppins text-xs text-gray">
                  {item.skill}
                </span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default FeedbackPage;
