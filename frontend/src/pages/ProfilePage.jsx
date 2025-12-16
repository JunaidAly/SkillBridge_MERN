import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Mail, MapPin, Globe, Clock, Star, Pencil, Plus, X, Award, Loader2, FileText } from "lucide-react";
import Button from "../ui/Button";
import EditProfileModal from "../components/Modal/EditProfileModal";
import AddSkillModal from "../components/Modal/AddSkillModal";
import AddCertificationModal from "../components/Modal/AddCertificationModal";
import apiClient from "../api/client";
import { downloadBlob } from "../utils/downloadBlob";
import {
  fetchProfile,
  removeTeachingSkill,
  removeLearningSkill,
  removeCertification,
} from "../store/profileSlice";

function ProfilePage() {
  const dispatch = useDispatch();
  const { profile, loading, error } = useSelector((state) => state.profile);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddTeachingSkillOpen, setIsAddTeachingSkillOpen] = useState(false);
  const [isAddLearningSkillOpen, setIsAddLearningSkillOpen] = useState(false);
  const [isAddCertificationOpen, setIsAddCertificationOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  const handleRemoveTeachingSkill = (skillId) => {
    dispatch(removeTeachingSkill(skillId));
  };

  const handleRemoveLearningSkill = (skillName) => {
    dispatch(removeLearningSkill(skillName));
  };

  const handleRemoveCertification = (certId) => {
    dispatch(removeCertification(certId));
  };

  const handleDownloadCertification = async (cert) => {
    try {
      const res = await apiClient.get(`/users/me/certifications/${cert._id}/download`, {
        responseType: "blob",
      });
      // Prefer backend-provided Content-Disposition filename (most reliable)
      const cd = res.headers?.["content-disposition"] || "";
      const matchStar = cd.match(/filename\*\=UTF-8''([^;]+)/i);
      const match = cd.match(/filename=\"?([^\";]+)\"?/i);
      let filename = matchStar ? decodeURIComponent(matchStar[1]) : match ? match[1] : "";
      if (!filename) filename = cert.fileName || `${cert.name || "certificate"}`;
      // If backend didn't provide extension in fileName, try to infer from mime
      if (!filename.includes(".") && cert.fileMimeType) {
        const map = {
          "application/pdf": "pdf",
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
          "image/gif": "gif",
          "application/msword": "doc",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
        };
        const ext = map[cert.fileMimeType];
        if (ext) filename = `${filename}.${ext}`;
      }
      downloadBlob(res.data, filename);
    } catch (e) {
      console.error(e);
      alert("Failed to download certificate");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-teal" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => dispatch(fetchProfile())}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-gray text-3xl font-medium">
                  {profile.name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="absolute bottom-18 right-0 w-8 h-8 bg-teal rounded-full flex items-center justify-center hover:bg-teal/90 transition-colors"
            >
              <Pencil className="text-white" size={14} />
            </button>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <h1 className="font-family-poppins text-2xl font-bold text-black">
                {profile.name}
              </h1>
              <Button
                variant="outline"
                className="flex items-center gap-2 px-4 py-2"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Pencil size={16} />
                Edit Profile
              </Button>
            </div>

            {profile.bio && (
              <p className="font-family-poppins text-sm text-gray mb-4 max-w-xl">
                {profile.bio}
              </p>
            )}

            {/* Contact Info */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              {profile.email && (
                <span className="flex items-center gap-2">
                  <Mail className="text-gray" size={16} />
                  <span className="font-family-poppins text-gray">{profile.email}</span>
                </span>
              )}
              {profile.location && (
                <span className="flex items-center gap-2">
                  <MapPin className="text-gray" size={16} />
                  <span className="font-family-poppins text-gray">{profile.location}</span>
                </span>
              )}
              {profile.languages?.length > 0 && (
                <span className="flex items-center gap-2">
                  <Globe className="text-gray" size={16} />
                  <span className="font-family-poppins text-gray">
                    {profile.languages.join(", ")}
                  </span>
                </span>
              )}
              {profile.timezone && (
                <span className="flex items-center gap-2">
                  <Clock className="text-gray" size={16} />
                  <span className="font-family-poppins text-gray">{profile.timezone}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 mt-8 pt-6 border-t border-[#E5E5E5]">
          <div className="text-center">
            <p className="font-family-poppins text-3xl font-bold text-black">
              {profile.stats?.sessionsTaught || 0}
            </p>
            <p className="font-family-poppins text-sm text-gray">Sessions Taught</p>
          </div>
          <div className="text-center">
            <p className="font-family-poppins text-3xl font-bold text-black">
              {profile.stats?.sessionsLearned || 0}
            </p>
            <p className="font-family-poppins text-sm text-gray">Sessions Learned</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="text-yellow-500 fill-yellow-500" size={24} />
              <p className="font-family-poppins text-3xl font-bold text-black">
                {profile.stats?.avgRating?.toFixed(1) || "0.0"}
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
            <button
              onClick={() => setIsAddTeachingSkillOpen(true)}
              className="flex items-center gap-1 text-teal font-family-poppins text-sm font-medium hover:underline"
            >
              <Plus size={16} />
              Add Skills
            </button>
          </div>

          <div className="space-y-3">
            {profile.skillsTeaching?.length > 0 ? (
              profile.skillsTeaching.map((skill) => (
                <div
                  key={skill._id}
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
                          {skill.rating?.toFixed(1) || "0.0"}
                        </span>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveTeachingSkill(skill._id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="text-gray" size={18} />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray text-sm text-center py-4">
                No skills added yet. Click "Add Skills" to get started.
              </p>
            )}
          </div>
        </div>

        {/* Skills I'm Learning */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-family-poppins text-lg font-semibold text-black">
              Skills I'm Learning
            </h2>
            <button
              onClick={() => setIsAddLearningSkillOpen(true)}
              className="flex items-center gap-1 text-teal font-family-poppins text-sm font-medium hover:underline"
            >
              <Plus size={16} />
              Add Goal
            </button>
          </div>

          <div className="space-y-3">
            {profile.skillsLearning?.length > 0 ? (
              profile.skillsLearning.map((skill, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-5 bg-teal/10 shadow-xl rounded-2xl"
                >
                  <p className="font-family-poppins font-medium text-black">
                    {skill}
                  </p>
                  <button
                    onClick={() => handleRemoveLearningSkill(skill)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="text-gray" size={18} />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray text-sm text-center py-4">
                No learning goals added yet. Click "Add Goal" to get started.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Certifications Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-family-poppins text-lg font-semibold text-black">
            Certifications
          </h2>
          <button
            onClick={() => setIsAddCertificationOpen(true)}
            className="flex items-center gap-1 text-teal font-family-poppins text-sm font-medium hover:underline"
          >
            <Plus size={16} />
            Add Certification
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.certifications?.length > 0 ? (
            profile.certifications.map((cert) => (
              <div
                key={cert._id}
                className="flex items-center gap-4 p-6 bg-teal/10 shadow-xl rounded-3xl"
              >
                <div className="w-12 h-12 bg-teal/20 rounded-full flex items-center justify-center shrink-0">
                  <Award className="text-teal" size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-family-poppins font-medium text-black truncate">
                    {cert.name}
                  </p>
                  <p className="font-family-poppins text-xs text-gray">
                    {cert.issuer} {cert.year && `(${cert.year})`}
                  </p>
                  {cert.fileUrl && (
                    <div className="flex items-center gap-3 mt-1">
                      <button
                        onClick={() => handleDownloadCertification(cert)}
                        className="flex items-center gap-1 text-teal text-xs hover:underline"
                      >
                        <FileText size={12} />
                        Download
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveCertification(cert._id)}
                  className="p-1 hover:bg-gray-100 rounded shrink-0"
                >
                  <X className="text-gray" size={18} />
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray text-sm text-center py-4 col-span-2">
              No certifications added yet. Click "Add Certification" to get started.
            </p>
          )}
        </div>
      </div>

      {/* Modals */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={profile}
      />

      <AddSkillModal
        isOpen={isAddTeachingSkillOpen}
        onClose={() => setIsAddTeachingSkillOpen(false)}
        type="teaching"
        title="Add Skill to Teach"
      />

      <AddSkillModal
        isOpen={isAddLearningSkillOpen}
        onClose={() => setIsAddLearningSkillOpen(false)}
        type="learning"
        title="Add Learning Goal"
      />

      <AddCertificationModal
        isOpen={isAddCertificationOpen}
        onClose={() => setIsAddCertificationOpen(false)}
      />
    </div>
  );
}

export default ProfilePage;
