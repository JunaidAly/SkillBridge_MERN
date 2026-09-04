import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Sparkles, Search, Star, Monitor, MapPin, Clock, Brain, Loader2, AlertCircle, Globe, BadgeCheck, CalendarPlus } from "lucide-react";
import Button from "../../ui/Button";
import Pagination from "../../ui/Pagination";
import { createConversation } from "../../store/chatSlice";
import { fetchRecommendations } from "../../store/recommendationsSlice";
import { fetchUsers } from "../../store/usersSlice";

function AIRecommendations() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { profile } = useSelector((state) => state.profile);
  const { recommendations, loading: recommendationsLoading, error, method } = useSelector((state) => state.recommendations);
  const { users, loading: usersLoading } = useSelector((state) => state.users);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [startingChatWith, setStartingChatWith] = useState(null);
  const [viewMode, setViewMode] = useState("recommended"); // "recommended" | "all"
  const hasDefaultedViewMode = useRef(false);
  const ITEMS_PER_PAGE = 3;

  // Land on "All Users" by default for anyone with no learning skills set yet -
  // "Recommended" would just be permanently empty for them otherwise. Only do
  // this once, so it doesn't fight a manual tab click later.
  useEffect(() => {
    if (hasDefaultedViewMode.current || !profile) return;
    hasDefaultedViewMode.current = true;
    if (!profile.skillsLearning || profile.skillsLearning.length === 0) {
      setViewMode("all");
    }
  }, [profile]);

  // Create a map of teacher data for quick lookup
  const teacherMap = users.reduce((acc, user) => {
    acc[user.id || user._id] = user;
    return acc;
  }, {});

  // "All Users" mode normalizes every teaching user into the same shape the
  // recommendation cards expect, minus an AI score (there isn't one).
  const allTeachers = users
    .filter((u) => u.role !== "admin" && (u.skillsTeaching || []).length > 0)
    .map((u) => ({
      teacher_id: u.id,
      name: u.name,
      subjects: (u.skillsTeaching || []).map((s) => s.name),
      expertise: [],
      score: null,
      average_rating: u.stats?.avgRating || 0,
      reason: null,
    }));

  const sourceList = viewMode === "recommended" ? recommendations : allTeachers;
  const loading = viewMode === "recommended" ? recommendationsLoading : usersLoading;
  const activeError = viewMode === "recommended" ? error : null;

  // Sort recommendations by match score (highest first) - "all" mode has no
  // score to sort by, so leave it in the order it came in.
  const sortedRecommendations = viewMode === "recommended"
    ? [...sourceList].sort((a, b) => b.score - a.score)
    : sourceList;

  // Filter recommendations based on search query and exclude current user
  const filteredRecommendations = sortedRecommendations.filter((teacher) => {
    // Exclude current logged-in user
    if (teacher.teacher_id === user?.userId || teacher.teacher_id === user?.id) {
      return false;
    }
    
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name = teacher.name?.toLowerCase() || "";
    const skills = teacher.subjects?.join(" ").toLowerCase() || "";
    const expertise = teacher.expertise?.join(" ").toLowerCase() || "";
    return name.includes(query) || skills.includes(query) || expertise.includes(query);
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredRecommendations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedRecommendations = filteredRecommendations.slice(startIndex, endIndex);

  // Reset to page 1 when search query or view mode changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, viewMode]);

  useEffect(() => {
    // Fetch all users for teacher details
    dispatch(fetchUsers());
    
    // Only fetch if user has skills they want to learn (is a learner/student)
    if (profile?.skillsLearning && profile.skillsLearning.length > 0) {
      dispatch(fetchRecommendations({ limit: 10 }));
    }
  }, [dispatch, profile]);

  const handleMessage = async (teacherId) => {
    try {
      setStartingChatWith(teacherId);
      const result = await dispatch(createConversation(teacherId)).unwrap();
      navigate('/chat', { state: { conversationId: result._id } });
    } catch (error) {
      console.error('Failed to create conversation:', error);
      alert('Failed to start conversation. Please try again.');
    } finally {
      setStartingChatWith(null);
    }
  };

  const handleSchedule = async (teacherId) => {
    try {
      setStartingChatWith(teacherId);
      const result = await dispatch(createConversation(teacherId)).unwrap();
      navigate('/chat', { state: { conversationId: result._id, openSchedule: true } });
    } catch (error) {
      console.error('Failed to start scheduling:', error);
      alert('Failed to start scheduling. Please try again.');
    } finally {
      setStartingChatWith(null);
    }
  };

  // Wait for the profile to load before rendering - not a "no learning
  // skills" gate anymore, since "All Users" browsing works without any.
  if (!profile) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="text-black" size={20} />
          <h2 className="font-family-poppins text-xl font-semibold text-black">
            AI Recommended Matches
          </h2>
        </div>

        {/* View mode toggle */}
        <div className="inline-flex w-fit rounded-lg bg-light-gray p-1">
          <button
            onClick={() => setViewMode("recommended")}
            className={`px-4 py-1.5 rounded-md font-family-poppins text-sm font-medium transition-all ${
              viewMode === "recommended" ? "bg-white text-black shadow-sm" : "text-gray"
            }`}
          >
            Recommended
          </button>
          <button
            onClick={() => setViewMode("all")}
            className={`px-4 py-1.5 rounded-md font-family-poppins text-sm font-medium transition-all ${
              viewMode === "all" ? "bg-white text-black shadow-sm" : "text-gray"
            }`}
          >
            All Users
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray" size={18} />
          <input
            type="text"
            placeholder="Search by skill or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-[#D0D0D0] rounded-lg font-family-poppins text-sm outline-none focus:border-teal transition-all"
          />
        </div>
        <button className="px-4 py-2.5 border border-[#D0D0D0] rounded-lg font-family-josefin font-bold text-sm text-gray hover:bg-gray-50 transition-all">
          Highly Rated
        </button>
      </div>

      {/* AI Match Score Badge */}
      {viewMode === "recommended" && (
        <div className="flex items-center gap-2 mb-6 px-2 py-3 border border-teal bg-light-teal rounded-full">
          <span className="flex items-center gap-1.5 px-3 py-1.5 ">
            <Brain className="text-teal" size={14} />
            <span className="font-family-poppins text-sm font-medium text-black">
              AI Match Score
            </span>
          </span>
          <span className="font-family-poppins text-sm text-gray">
            {method === 'content-based' && 'Based on Skills | Ratings | Feedbacks'}
            {method === 'collaborative' && 'Based on Similar Students'}
            {method === 'hybrid' && 'Based on Skills & Similar Students'}
          </span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-teal" />
        </div>
      )}

      {/* Error State */}
      {activeError && !loading && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="font-family-poppins text-sm font-medium text-amber-900">
              AI Recommendations Temporarily Unavailable
            </p>
            <p className="font-family-poppins text-sm text-amber-700 mt-1">
              {activeError}
            </p>
            <p className="font-family-poppins text-sm text-amber-600 mt-2">
              💡 In the meantime, you can browse teachers manually or contact support.
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !activeError && filteredRecommendations.length === 0 && (
        <div className="text-center py-12">
          <p className="font-family-poppins text-gray">
            {searchQuery
              ? "No teachers found matching your search."
              : viewMode === "recommended"
              ? "No recommendations available yet."
              : "No teachers available yet."}
          </p>
        </div>
      )}

      {/* Match Cards */}
      {!loading && !activeError && filteredRecommendations.length > 0 && (
        <>
          <div className="space-y-4">
            {paginatedRecommendations.map((teacher) => {
            // Get full teacher data from users store
            const teacherData = teacherMap[teacher.teacher_id];
            
            // Get primary skill being taught
            const primarySkill = teacher.subjects?.[0] || teacher.expertise?.[0] || "Available for Teaching";

            return (
              <div
                key={teacher.teacher_id}
                className="border border-[#E5E5E5] rounded-xl p-5"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Avatar */}
                  <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                    {teacherData?.avatar ? (
                      <img
                        src={teacherData.avatar}
                        alt={teacher.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-gray text-xl font-medium">
                        {teacher.name?.charAt(0) || 'T'}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="font-family-poppins text-lg font-semibold text-black flex items-center gap-1.5">
                      {teacher.name}
                      {teacherData?.verificationStatus === "verified" && (
                        <BadgeCheck className="text-teal shrink-0" size={16} aria-label="Verified teacher" />
                      )}
                    </h3>
                    <p className="font-family-poppins text-sm text-gray mb-2">
                      {primarySkill}
                    </p>
                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                      
                      {/* AI Match Score */}
                      {teacher.score !== null && (
                        <span className="flex items-center gap-1">
                          <Brain className="text-teal" size={14} />
                          <span className="font-family-poppins text-teal font-medium">
                            {Math.round(teacher.score)}% Match
                          </span>
                        </span>
                      )}

                      {/* Sessions Taught */}
                      <span className="flex items-center gap-1">
                        <Monitor className="text-gray" size={14} />
                        <span className="font-family-poppins text-gray">
                          {teacherData?.stats?.sessionsTaught || 0} Sessions Taught
                        </span>
                      </span>

                      {/* Location */}
                      {teacherData?.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="text-gray" size={14} />
                          <span className="font-family-poppins text-gray">{teacherData.location}</span>
                        </span>
                      )}

                      {/* Timezone */}
                      {teacherData?.timezone && (
                        <span className="flex items-center gap-1">
                          <Clock className="text-gray" size={14} />
                          <span className="font-family-poppins text-gray">{teacherData.timezone}</span>
                        </span>
                      )}

                      {/* Rating */}
                      <span className="flex items-center gap-1">
                        <Star className="text-yellow-500 fill-yellow-500" size={14} />
                        <span className="font-family-poppins text-gray">
                          {teacher.average_rating && teacher.average_rating > 0 
                            ? `${teacher.average_rating.toFixed(1)}` 
                            : "No ratings yet"}
                        </span>
                      </span>

                    </div>

                    {/* Reason */}
                    {teacher.reason && (
                      <p className="font-family-poppins text-xs text-gray-500 italic mt-2">
                        {teacher.reason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-5">
                  <Button
                    variant="outline"
                    className="flex-1 py-2.5"
                    onClick={() => navigate(`/profile/${teacher.teacher_id}`)}
                  >
                    View Profile
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1 py-2.5"
                    onClick={() => handleMessage(teacher.teacher_id)}
                    disabled={startingChatWith === teacher.teacher_id}
                  >
                    {startingChatWith === teacher.teacher_id ? 'Starting...' : 'Message'}
                  </Button>
                  <button
                    onClick={() => handleSchedule(teacher.teacher_id)}
                    disabled={startingChatWith === teacher.teacher_id}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg font-family-poppins font-medium text-sm text-white bg-dark-blue hover:opacity-90 transition-all disabled:opacity-50 shrink-0"
                    aria-label="Schedule session"
                    title="Schedule session"
                  >
                    <CalendarPlus size={16} />
                    <span className="hidden sm:inline">Schedule</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </>
      )}
    </div>
  );
}

export default AIRecommendations;
