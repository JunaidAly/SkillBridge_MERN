import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Mail, MapPin, Globe, Clock, Star, ArrowLeft, Award, Loader2 } from "lucide-react";
import Button from "../ui/Button";
import apiClient from "../api/client";
import { createConversation } from "../store/chatSlice";

function ViewProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading: chatLoading } = useSelector((state) => state.chat);
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get(`/users/${id}`);
        setUser(res.data.user);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserProfile();
    }
  }, [id]);

  const handleMessage = async () => {
    try {
      const result = await dispatch(createConversation(id)).unwrap();
      navigate('/chat', { state: { conversationId: result._id } });
    } catch (error) {
      console.error('Failed to create conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-teal" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'User not found'}</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

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
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
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
                onClick={handleMessage}
                disabled={chatLoading}
              >
                {chatLoading ? 'Starting...' : 'Message'}
              </Button>
            </div>

            {user.bio && (
              <p className="font-family-poppins text-sm text-gray mb-4 max-w-xl">
                {user.bio}
              </p>
            )}

            {/* Contact Info */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              {user.location && (
                <span className="flex items-center gap-2">
                  <MapPin className="text-gray" size={16} />
                  <span className="font-family-poppins text-gray">{user.location}</span>
                </span>
              )}
              {user.languages?.length > 0 && (
                <span className="flex items-center gap-2">
                  <Globe className="text-gray" size={16} />
                  <span className="font-family-poppins text-gray">
                    {Array.isArray(user.languages) ? user.languages.join(", ") : user.languages}
                  </span>
                </span>
              )}
              {user.timezone && (
                <span className="flex items-center gap-2">
                  <Clock className="text-gray" size={16} />
                  <span className="font-family-poppins text-gray">{user.timezone}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 mt-8 pt-6 border-t border-[#E5E5E5]">
          <div className="text-center">
            <p className="font-family-poppins text-3xl font-bold text-black">
              {user.stats?.sessionsTaught || 0}
            </p>
            <p className="font-family-poppins text-sm text-gray">Sessions Taught</p>
          </div>
          <div className="text-center">
            <p className="font-family-poppins text-3xl font-bold text-black">
              {user.stats?.sessionsLearned || 0}
            </p>
            <p className="font-family-poppins text-sm text-gray">Sessions Learned</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="text-yellow-500 fill-yellow-500" size={24} />
              <p className="font-family-poppins text-3xl font-bold text-black">
                {user.stats?.avgRating?.toFixed(1) || "0.0"}
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
            {user.skillsTeaching?.length > 0 ? (
              user.skillsTeaching.map((skill) => (
                <div
                  key={skill._id}
                  className="flex items-center justify-between p-5 bg-teal/10 shadow-xl rounded-2xl"
                >
                  <div>
                    <p className="font-family-poppins font-medium text-black">
                      {typeof skill === 'string' ? skill : skill.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      {skill.sessions && (
                        <span className="font-family-poppins text-xs text-gray">
                          {skill.sessions} sessions
                        </span>
                      )}
                      {skill.rating && (
                        <span className="flex items-center gap-1">
                          <Star className="text-yellow-500 fill-yellow-500" size={12} />
                          <span className="font-family-poppins text-xs text-gray">
                            {skill.rating.toFixed(1)}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray text-sm text-center py-4">
                No skills added yet.
              </p>
            )}
          </div>
        </div>

        {/* Skills I'm Learning */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-family-poppins text-lg font-semibold text-black mb-4">
            Skills I'm Learning
          </h2>

          <div className="space-y-4">
            {user.skillsLearning?.length > 0 ? (
              user.skillsLearning.map((skill, index) => (
                <div key={index} className="p-5 bg-teal/10 shadow-xl rounded-2xl">
                  <p className="font-family-poppins font-medium text-black">
                    {typeof skill === 'string' ? skill : skill.name}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray text-sm text-center py-4">
                No learning goals added yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Certifications Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="font-family-poppins text-lg font-semibold text-black mb-4">
          Certifications
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user.certifications?.length > 0 ? (
            user.certifications.map((cert) => (
              <div
                key={cert._id}
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
                    {cert.issuer} {cert.year && `(${cert.year})`}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray text-sm text-center py-4 col-span-2">
              No certifications added yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ViewProfilePage;
