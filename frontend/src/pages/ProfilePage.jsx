import { useState } from "react";
import { Mail, MapPin, Globe, Clock, Star, Pencil, Plus, X, Award } from "lucide-react";
import Button from "../ui/Button";
import EditProfileModal from "../components/Modal/EditProfileModal";

function ProfilePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const user = {
    name: "Jane Doe",
    bio: "Full-stack developer passionate about sharing knowledge and learning new technologies. Love teaching React and learning data science.",
    email: "jane@example.com",
    location: "San Francisco, CA",
    languages: "English, Urdu",
    timezone: "PST (GMT-8)",
    avatar: null,
    stats: {
      sessionsTaught: 95,
      sessionsLearned: 42,
      avgRating: 4.9,
    },
  };

  const skillsTeaching = [
    { name: "React Development", sessions: 45, rating: 4.9 },
    { name: "TypeScript", sessions: 45, rating: 4.9 },
    { name: "UI/UX", sessions: 45, rating: 4.9 },
  ];

  const skillsLearning = [
    { name: "Machine Learning" },
    { name: "Social Media Marketing" },
    { name: "Data Science" },
    { name: "Data Mining" },
  ];

  const certifications = [
    { name: "AWS Solution Architect", issuer: "Amazon 2023" },
    { name: "Google UI/UX Design", issuer: "Google 2022" },
    { name: "AWS Solution Architect", issuer: "Amazon 2023" },
    { name: "Google UI/UX Design", issuer: "Google 2022" },
  ];

  return (
    <div className="space-y-6">
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
               <div className="absolute bottom-10 right-0 w-8 h-8 bg-teal rounded-full flex items-center justify-center">
              <Pencil className="text-white" size={14} />
            </div>
            </div>
           
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <h1 className="font-family-poppins text-2xl font-bold text-black">
                {user.name}
              </h1>
              <Button
                variant="outline"
                className="flex items-center gap-2 px-4 py-2"
                onClick={() => setIsModalOpen(true)}
              >
                <Pencil size={16} />
                Edit Profile
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-family-poppins text-lg font-semibold text-black">
              Skills I Teach
            </h2>
            <button className="flex items-center gap-1 text-teal font-family-poppins text-sm font-medium hover:underline">
              <Plus size={16} />
              Add Skills
            </button>
          </div>

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
                  <div className="flex items-center gap-2 mt-1">
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
                <button className="p-1 hover:bg-gray-100 rounded">
                  <X className="text-gray" size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Skills I'm Learning */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-family-poppins text-lg font-semibold text-black">
              Skills I'm Learning
            </h2>
            <button className="flex items-center gap-1 text-teal font-family-poppins text-sm font-medium hover:underline">
              <Plus size={16} />
              Add Goal
            </button>
          </div>

          <div className="space-y-3">
            {skillsLearning.map((skill, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-5 bg-teal/10 shadow-xl rounded-2xl"
              >
                <p className="font-family-poppins font-medium text-black">
                  {skill.name}
                </p>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <X className="text-gray" size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Certifications Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-family-poppins text-lg font-semibold text-black">
            Certifications
          </h2>
          <button className="flex items-center gap-1 text-teal font-family-poppins text-sm font-medium hover:underline">
            <Plus size={16} />
            Add Certification
          </button>
        </div>

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

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
      />
    </div>
  );
}

export default ProfilePage;
