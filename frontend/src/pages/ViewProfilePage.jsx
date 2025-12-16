import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Mail, MapPin, Globe, Clock, Star, ArrowLeft, Award } from "lucide-react";
import Button from "../ui/Button";

function ViewProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock user data - in real app, fetch based on id
  const user = {
    id: 1,
    name: "Alex Thompson",
    bio: "Full-stack developer passionate about sharing knowledge and learning new technologies. Love teaching React and learning data science.",
    email: "alex@example.com",
    location: "San Francisco, CA",
    languages: "English, Spanish",
    timezone: "PST (GMT-8)",
    avatar: null,
    stats: {
      sessionsTaught: 95,
      sessionsLearned: 42,
      avgRating: 4.9,
    },
  };

  const skillsTeaching = [
    { name: "React Development", sessions: 45, rating: 4.9, level: "Expert" },
    { name: "TypeScript", sessions: 38, rating: 4.8, level: "Advanced" },
    { name: "UI/UX", sessions: 12, rating: 4.7, level: "Advanced" },
  ];

  const skillsLearning = [
    { name: "Machine Learning", progress: 40 },
    { name: "Social Media Marketing", progress: 60 },
    { name: "Data Science", progress: 90 },
  ];

  const certifications = [
    { name: "AWS Solution Architect", issuer: "Amazon 2023" },
    { name: "Google UI/UX Design", issuer: "Google 2022" },
    { name: "AWS Solution Architect", issuer: "Amazon 2023" },
    { name: "Google UI/UX Design", issuer: "Google 2022" },
  ];

  const getLevelBadgeColor = (level) => {
    if (level === "Expert") {
      return "bg-teal text-white";
    }
    return "bg-dark-blue text-white";
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray hover:text-black transition-colors font-family-poppins text-sm"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      {/* Profile Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-gray text-3xl font-medium">
                  {user.name.charAt(0)}
                </span>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <h1 className="font-family-poppins text-2xl font-bold text-black">
                {user.name}
              </h1>
              <Button
                variant="primary"
                className="flex items-center gap-2 px-6 py-2.5"
              >
                Message
              </Button>
            </div>

            <p className="font-family-poppins text-sm text-gray mb-4 max-w-xl">
              {user.bio}
            </p>

            {/* Contact Info */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span className="flex items-center gap-2">
                <Mail className="text-gray" size={16} />
                <span className="font-family-poppins text-gray">{user.email}</span>
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="text-gray" size={16} />
                <span className="font-family-poppins text-gray">{user.location}</span>
              </span>
              <span className="flex items-center gap-2">
                <Globe className="text-gray" size={16} />
                <span className="font-family-poppins text-gray">{user.languages}</span>
              </span>
              <span className="flex items-center gap-2">
                <Clock className="text-gray" size={16} />
                <span className="font-family-poppins text-gray">{user.timezone}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 mt-8 pt-6 border-t border-[#E5E5E5]">
          <div className="text-center">
            <p className="font-family-poppins text-3xl font-bold text-black">
              {user.stats.sessionsTaught}
            </p>
            <p className="font-family-poppins text-sm text-gray">Sessions Taught</p>
          </div>
          <div className="text-center">
            <p className="font-family-poppins text-3xl font-bold text-black">
              {user.stats.sessionsLearned}
            </p>
            <p className="font-family-poppins text-sm text-gray">Sessions Learned</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="text-yellow-500 fill-yellow-500" size={24} />
              <p className="font-family-poppins text-3xl font-bold text-black">
                {user.stats.avgRating}
              </p>
            </div>
            <p className="font-family-poppins text-sm text-gray">Average Rating</p>
          </div>
        </div>
      </div>

      {/* Skills Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills I Teach */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-family-poppins text-lg font-semibold text-black mb-4">
            Skills I Teach
          </h2>

          <div className="space-y-3">
            {skillsTeaching.map((skill, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-5 bg-teal/10 shadow-xl rounded-2xl"
              >
                <div>
                  <p className="font-family-poppins font-medium text-black">
                    {skill.name}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-family-poppins text-xs text-gray">
                      {skill.sessions} sessions
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="text-yellow-500 fill-yellow-500" size={12} />
                      <span className="font-family-poppins text-xs text-gray">
                        {skill.rating}
                      </span>
                    </span>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full font-family-poppins text-xs font-medium ${getLevelBadgeColor(
                    skill.level
                  )}`}
                >
                  {skill.level}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Skills I'm Learning */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-family-poppins text-lg font-semibold text-black mb-4">
            Skills I'm Learning
          </h2>

          <div className="space-y-4">
            {skillsLearning.map((skill, index) => (
              <div key={index} className="p-5 bg-teal/10 shadow-xl rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-family-poppins font-medium text-black">
                    {skill.name}
                  </p>
                  <span className="font-family-poppins text-sm font-medium text-teal">
                    {skill.progress}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal rounded-full transition-all duration-300"
                    style={{ width: `${skill.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Certifications Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="font-family-poppins text-lg font-semibold text-black mb-4">
          Certifications
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certifications.map((cert, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-6 bg-teal/10 shadow-xl rounded-3xl"
            >
              <div className="w-12 h-12 bg-teal/20 rounded-full flex items-center justify-center shrink-0">
                <Award className="text-teal" size={24} />
              </div>
              <div>
                <p className="font-family-poppins font-medium text-black">
                  {cert.name}
                </p>
                <p className="font-family-poppins text-xs text-gray">
                  {cert.issuer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ViewProfilePage;
