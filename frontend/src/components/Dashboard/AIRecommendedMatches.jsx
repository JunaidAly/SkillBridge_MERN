import { Sparkles, Search, Star, Monitor, MapPin, Clock, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../ui/Button";

const matches = [
  {
    id: 1,
    name: "Alex Thompson",
    skill: "Python Programming",
    rating: 4.9,
    matchScore: 95,
    sessions: 50,
    location: "San Francisco, CA",
    timezone: "PST (GMT-8)",
    avatar: null,
  },
  {
    id: 2,
    name: "Maria Garcia",
    skill: "Data Science",
    rating: 4.8,
    matchScore: 92,
    sessions: 40,
    location: "New York, NY",
    timezone: "EST (GMT-5)",
    avatar: null,
  },
  {
    id: 3,
    name: "Liam Wong",
    skill: "Web Development",
    rating: 4.7,
    matchScore: 90,
    sessions: 60,
    location: "Toronto, ON",
    timezone: "EST (GMT-5)",
    avatar: null,
  },
];

function AIRecommendedMatches() {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="text-black" size={20} />
        <h2 className="font-family-poppins text-xl font-semibold text-black">
          AI Recommended Matches
        </h2>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray" size={18} />
          <input
            type="text"
            placeholder="Search by skill or name..."
            className="w-full pl-10 pr-4 py-3 border border-[#D0D0D0] rounded-lg font-family-poppins text-sm outline-none focus:border-teal transition-all"
          />
        </div>
        <button className="px-4 py-2.5 border border-[#D0D0D0] rounded-lg font-family-josefin font-bold text-sm text-gray hover:bg-gray-50 transition-all">
          Highly Rated
        </button>
      </div>

      {/* AI Match Score Badge */}
      <div className="flex items-center gap-2 mb-6 px-2 py-3 border border-teal bg-light-teal rounded-full">
        <span className="flex items-center gap-1.5 px-3 py-1.5 ">
          <Brain className="text-teal" size={14} />
          <span className="font-family-poppins text-sm font-medium text-black">
            AI Match Score
          </span>
        </span>
        <span className="font-family-poppins text-sm text-gray">
          Based on Skills | Ratings | Learning Style
        </span>
      </div>

      {/* Match Cards */}
      <div className="space-y-4">
        {matches.map((match) => (
          <div
            key={match.id}
            className="border border-[#E5E5E5] rounded-xl p-5"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                {match.avatar ? (
                  <img
                    src={match.avatar}
                    alt={match.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-gray text-xl font-medium">
                    {match.name.charAt(0)}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h3 className="font-family-poppins text-lg font-semibold text-black">
                  {match.name}
                </h3>
                <p className="font-family-poppins text-sm text-gray mb-3">
                  {match.skill}
                </p>

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <span className="flex items-center gap-1">
                    <Star className="text-yellow-500 fill-yellow-500 " size={14} />
                    <span className="font-family-poppins text-gray">{match.rating}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Brain className="text-teal" size={14} />
                    <span className="font-family-poppins text-teal font-medium">
                      {match.matchScore}% Match
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Monitor className="text-gray" size={14} />
                    <span className="font-family-poppins text-gray">
                      {match.sessions} Sessions Taught
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="text-gray" size={14} />
                    <span className="font-family-poppins text-gray">{match.location}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="text-gray" size={14} />
                    <span className="font-family-poppins text-gray">{match.timezone}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-5">
              <Button
                variant="outline"
                className="flex-1 py-2.5"
                onClick={() => navigate(`/profile/${match.id}`)}
              >
                View Profile
              </Button>
              <Button variant="primary" className="flex-1 py-2.5">
                Message
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AIRecommendedMatches;
