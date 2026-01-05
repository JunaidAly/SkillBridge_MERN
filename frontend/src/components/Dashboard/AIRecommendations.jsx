import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Sparkles, Star, Monitor, Brain, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import Button from "../../ui/Button";
import { createConversation } from "../../store/chatSlice";
import { fetchRecommendations } from "../../store/recommendationsSlice";

function AIRecommendations() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user } = useSelector((state) => state.auth);
  const { loading: chatLoading } = useSelector((state) => state.chat);
  const { recommendations, loading, error, method } = useSelector((state) => state.recommendations);

  useEffect(() => {
    // Only fetch if user is a student
    if (user?.role === 'student') {
      dispatch(fetchRecommendations({ limit: 10 }));
    }
  }, [dispatch, user]);

  const handleRefresh = () => {
    dispatch(fetchRecommendations({ limit: 10 }));
  };

  const handleMessage = async (teacherId) => {
    try {
      const result = await dispatch(createConversation(teacherId)).unwrap();
      navigate('/chat', { state: { conversationId: result._id } });
    } catch (error) {
      console.error('Failed to create conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  // Don't show for non-students
  if (user?.role !== 'student') {
    return null;
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="text-purple-600" size={24} />
          <h2 className="font-family-poppins text-xl font-semibold text-black">
            AI-Powered Recommendations
          </h2>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          title="Refresh recommendations"
        >
          <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Method Badge */}
      {method && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
          <Brain className="text-purple-600" size={16} />
          <span className="font-family-poppins text-sm text-gray-700">
            {method === 'hybrid' && 'Using AI Hybrid Model (Collaborative + Content-Based)'}
            {method === 'collaborative' && 'Based on Similar Students\' Choices'}
            {method === 'content-based' && 'Based on Your Learning Interests'}
          </span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
            <p className="font-family-poppins text-sm text-gray-600">
              Finding the best teachers for you...
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-family-poppins text-sm font-medium text-red-800">
              Unable to load recommendations
            </p>
            <p className="font-family-poppins text-sm text-red-600 mt-1">
              {error}
            </p>
            <button
              onClick={handleRefresh}
              className="mt-2 text-sm text-red-700 underline hover:text-red-800"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && recommendations.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-family-poppins text-gray-600">
            No recommendations available at the moment.
          </p>
          <p className="font-family-poppins text-sm text-gray-500 mt-1">
            Complete your profile to get personalized teacher recommendations.
          </p>
        </div>
      )}

      {/* Recommendations List */}
      {!loading && !error && recommendations.length > 0 && (
        <div className="space-y-4">
          {recommendations.map((teacher, index) => (
            <div
              key={teacher.teacher_id}
              className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Rank Badge */}
                <div className="shrink-0">
                  <div className="w-10 h-10 bg-linear-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="font-family-poppins text-white font-bold text-sm">
                      #{index + 1}
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Teacher Info */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-family-poppins text-lg font-semibold text-black truncate">
                        {teacher.name}
                      </h3>
                      {teacher.subjects && teacher.subjects.length > 0 && (
                        <p className="font-family-poppins text-sm text-gray-600 truncate">
                          {teacher.subjects.slice(0, 3).join(', ')}
                        </p>
                      )}
                    </div>

                    {/* Match Score */}
                    <div className="shrink-0 text-right">
                      <div className="flex items-center gap-1 text-purple-600">
                        <Brain size={16} />
                        <span className="font-family-poppins text-sm font-bold">
                          {Math.round(teacher.score)}%
                        </span>
                      </div>
                      <p className="font-family-poppins text-xs text-gray-500">
                        Match
                      </p>
                    </div>
                  </div>

                  {/* Reason */}
                  {teacher.reason && (
                    <p className="font-family-poppins text-sm text-gray-600 italic mb-3">
                      {teacher.reason}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                    {teacher.average_rating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="text-yellow-500 fill-yellow-500" size={14} />
                        <span className="font-family-poppins text-gray-700 font-medium">
                          {teacher.average_rating.toFixed(1)}
                        </span>
                      </span>
                    )}

                    {teacher.years_of_experience > 0 && (
                      <span className="flex items-center gap-1">
                        <Monitor className="text-gray-500" size={14} />
                        <span className="font-family-poppins text-gray-600">
                          {teacher.years_of_experience} years exp.
                        </span>
                      </span>
                    )}

                    {teacher.expertise && teacher.expertise.length > 0 && (
                      <span className="font-family-poppins text-gray-600">
                        {teacher.expertise.slice(0, 2).join(', ')}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 py-2"
                      onClick={() => navigate(`/profile/${teacher.teacher_id}`)}
                    >
                      View Profile
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1 py-2"
                      onClick={() => handleMessage(teacher.teacher_id)}
                      disabled={chatLoading}
                    >
                      {chatLoading ? 'Starting...' : 'Message'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Footer */}
      {!loading && recommendations.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="font-family-poppins text-xs text-gray-500 text-center">
            Recommendations are personalized based on your learning history, interests, and similar students' choices.
            Updated regularly as you interact with teachers.
          </p>
        </div>
      )}
    </div>
  );
}

export default AIRecommendations;
