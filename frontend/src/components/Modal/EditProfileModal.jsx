import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Camera, Loader2, Search, Check } from "lucide-react";
import Button from "../../ui/Button";
import {
  updateProfile,
  uploadAvatar,
  addTeachingSkill,
  removeTeachingSkill,
  addLearningSkill,
  removeLearningSkill,
  addCertification,
  removeCertification,
} from "../../store/profileSlice";

// Skill suggestions list
const skillSuggestions = [
  "React Development",
  "JavaScript",
  "TypeScript",
  "Node.js",
  "Python",
  "Machine Learning",
  "Data Science",
  "UI/UX Design",
  "Graphic Design",
  "Digital Marketing",
  "Social Media Marketing",
  "Content Writing",
  "SEO",
  "AWS",
  "DevOps",
  "Docker",
  "Kubernetes",
  "MongoDB",
  "PostgreSQL",
  "Java",
  "C++",
  "Go",
  "Rust",
  "Swift",
  "iOS Development",
  "Android Development",
  "Flutter",
  "React Native",
  "Vue.js",
  "Angular",
  "PHP",
  "Laravel",
  "Django",
  "FastAPI",
  "GraphQL",
  "REST API",
  "Blockchain",
  "Web3",
  "Solidity",
  "Cybersecurity",
  "Network Security",
  "Cloud Computing",
  "Azure",
  "Google Cloud",
  "Linux",
  "Git",
  "Agile",
  "Scrum",
  "Project Management",
  "Product Management",
];

// Certification suggestions list
const certificationSuggestions = [
  "AWS Solutions Architect",
  "AWS Developer Associate",
  "AWS Cloud Practitioner",
  "Google Cloud Professional",
  "Google UI/UX Design",
  "Google Data Analytics",
  "Microsoft Azure Administrator",
  "Cisco CCNA",
  "CompTIA Security+",
  "CompTIA Network+",
  "PMP Certification",
  "Scrum Master",
  "Kubernetes Administrator",
  "Docker Certified Associate",
  "Meta Frontend Developer",
  "IBM Data Science",
  "Salesforce Administrator",
  "Oracle Java Certification",
];

function EditProfileModal({ isOpen, onClose, user }) {
  const dispatch = useDispatch();
  const { updateLoading } = useSelector((state) => state.profile);
  const fileInputRef = useRef(null);

  const [isClosing, setIsClosing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    location: "",
    timezone: "",
    languages: [],
  });

  // Skills and certifications state
  const [skillsTeaching, setSkillsTeaching] = useState([]);
  const [skillsLearning, setSkillsLearning] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [teachingSearch, setTeachingSearch] = useState("");
  const [learningSearch, setLearningSearch] = useState("");
  const [certificationSearch, setCertificationSearch] = useState("");

  // Suggestions state
  const [teachingSuggestions, setTeachingSuggestions] = useState([]);
  const [learningSuggestions, setLearningSuggestions] = useState([]);
  const [certSuggestions, setCertSuggestions] = useState([]);

  const availableLanguages = ["Urdu", "English", "Arabic", "Spanish", "French", "German", "Chinese"];
  const timezones = [
    "PST (GMT-8)",
    "MST (GMT-7)",
    "CST (GMT-6)",
    "EST (GMT-5)",
    "GMT (GMT+0)",
    "CET (GMT+1)",
    "IST (GMT+5:30)",
    "PKT (GMT+5)",
  ];

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || "",
        bio: user.bio || "",
        location: user.location || "",
        timezone: user.timezone || "",
        languages: user.languages || [],
      });
      setAvatarPreview(user.avatar || null);
      setAvatarFile(null);
      setSkillsTeaching(user.skillsTeaching || []);
      setSkillsLearning(user.skillsLearning || []);
      setCertifications(user.certifications || []);
      setTeachingSearch("");
      setLearningSearch("");
      setCertificationSearch("");
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Filter teaching skill suggestions
  useEffect(() => {
    if (teachingSearch.trim()) {
      const filtered = skillSuggestions.filter(
        (skill) =>
          skill.toLowerCase().includes(teachingSearch.toLowerCase()) &&
          !skillsTeaching.some((s) => s.name?.toLowerCase() === skill.toLowerCase())
      );
      setTeachingSuggestions(filtered.slice(0, 6));
    } else {
      setTeachingSuggestions([]);
    }
  }, [teachingSearch, skillsTeaching]);

  // Filter learning skill suggestions
  useEffect(() => {
    if (learningSearch.trim()) {
      const filtered = skillSuggestions.filter(
        (skill) =>
          skill.toLowerCase().includes(learningSearch.toLowerCase()) &&
          !skillsLearning.some((s) => s.name?.toLowerCase() === skill.toLowerCase())
      );
      setLearningSuggestions(filtered.slice(0, 6));
    } else {
      setLearningSuggestions([]);
    }
  }, [learningSearch, skillsLearning]);

  // Filter certification suggestions
  useEffect(() => {
    if (certificationSearch.trim()) {
      const filtered = certificationSuggestions.filter(
        (cert) =>
          cert.toLowerCase().includes(certificationSearch.toLowerCase()) &&
          !certifications.some((c) => c.name?.toLowerCase() === cert.toLowerCase())
      );
      setCertSuggestions(filtered.slice(0, 6));
    } else {
      setCertSuggestions([]);
    }
  }, [certificationSearch, certifications]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  const handleLanguageToggle = (lang) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Skills handlers
  const handleAddTeachingSkill = async (e) => {
    if (e.key === "Enter" && teachingSearch.trim()) {
      e.preventDefault();
      const skillName = teachingSearch.trim();
      const exists = skillsTeaching.some(
        (s) => s.name?.toLowerCase() === skillName.toLowerCase()
      );
      if (!exists) {
        try {
          const updatedSkills = await dispatch(addTeachingSkill(skillName)).unwrap();
          setSkillsTeaching(updatedSkills);
        } catch (error) {
          console.error("Failed to add teaching skill:", error);
        }
      }
      setTeachingSearch("");
      setTeachingSuggestions([]);
    }
  };

  const handleRemoveTeachingSkill = async (skillId) => {
    try {
      const updatedSkills = await dispatch(removeTeachingSkill(skillId)).unwrap();
      setSkillsTeaching(updatedSkills);
    } catch (error) {
      console.error("Failed to remove teaching skill:", error);
    }
  };

  const handleAddLearningSkill = async (e) => {
    if (e.key === "Enter" && learningSearch.trim()) {
      e.preventDefault();
      const skillName = learningSearch.trim();
      if (
        !skillsLearning.some(
          (s) => s.name?.toLowerCase() === skillName.toLowerCase()
        )
      ) {
        try {
          const updatedSkills = await dispatch(addLearningSkill(skillName)).unwrap();
          setSkillsLearning(updatedSkills);
        } catch (error) {
          console.error("Failed to add learning skill:", error);
        }
      }
      setLearningSearch("");
      setLearningSuggestions([]);
    }
  };

  const handleRemoveLearningSkill = async (skillId) => {
    try {
      const updatedSkills = await dispatch(removeLearningSkill(skillId)).unwrap();
      setSkillsLearning(updatedSkills);
    } catch (error) {
      console.error("Failed to remove learning skill:", error);
    }
  };

  const handleAddCertification = async (e) => {
    if (e.key === "Enter" && certificationSearch.trim()) {
      e.preventDefault();
      const certName = certificationSearch.trim();
      const exists = certifications.some(
        (c) => c.name?.toLowerCase() === certName.toLowerCase()
      );
      if (!exists) {
        try {
          const updatedCerts = await dispatch(addCertification({ name: certName })).unwrap();
          setCertifications(updatedCerts);
        } catch (error) {
          console.error("Failed to add certification:", error);
        }
      }
      setCertificationSearch("");
      setCertSuggestions([]);
    }
  };

  const handleRemoveCertification = async (certId) => {
    try {
      const updatedCerts = await dispatch(removeCertification(certId)).unwrap();
      setCertifications(updatedCerts);
    } catch (error) {
      console.error("Failed to remove certification:", error);
    }
  };

  // Handle suggestion clicks
  const handleTeachingSuggestionClick = async (suggestion) => {
    try {
      const updatedSkills = await dispatch(addTeachingSkill(suggestion)).unwrap();
      setSkillsTeaching(updatedSkills);
      setTeachingSearch("");
      setTeachingSuggestions([]);
    } catch (error) {
      console.error("Failed to add teaching skill:", error);
    }
  };

  const handleLearningSuggestionClick = async (suggestion) => {
    try {
      const updatedSkills = await dispatch(addLearningSkill(suggestion)).unwrap();
      setSkillsLearning(updatedSkills);
      setLearningSearch("");
      setLearningSuggestions([]);
    } catch (error) {
      console.error("Failed to add learning skill:", error);
    }
  };

  const handleCertSuggestionClick = async (suggestion) => {
    try {
      const updatedCerts = await dispatch(addCertification({ name: suggestion })).unwrap();
      setCertifications(updatedCerts);
      setCertificationSearch("");
      setCertSuggestions([]);
    } catch (error) {
      console.error("Failed to add certification:", error);
    }
  };

  const handleSave = async () => {
    try {
      // Upload avatar if changed
      if (avatarFile) {
        await dispatch(uploadAvatar(avatarFile)).unwrap();
      }

      // Update profile data
      await dispatch(updateProfile(formData)).unwrap();
      handleClose();
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        isClosing ? "modal-overlay-exit" : "modal-overlay-enter"
      }`}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal Content */}
      <div
        className={`relative bg-white shadow-xl rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto scrollbar-hide ${
          isClosing ? "modal-content-exit" : "modal-content-enter"
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 z-50 bg-white p-6 pb-4 border-b border-[#E5E5E5] flex items-start gap-4">
          {/* Avatar */}
          <div className="relative w-16 h-16 shrink-0">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={formData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray text-2xl font-medium">
                  {formData.name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>
            <button
              onClick={handleAvatarClick}
              className="absolute bottom-0 right-0 w-6 h-6 bg-teal rounded-full flex items-center justify-center hover:bg-teal/90 transition-colors"
            >
              <Camera className="text-white" size={12} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          <div className="flex-1">
            <h2 className="font-family-poppins text-xl font-bold text-black">
              {formData.name || "Your Name"}
            </h2>
            <textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, bio: e.target.value }))
              }
              placeholder="Write a short bio about yourself..."
              maxLength={500}
              className="w-full mt-2 p-2 text-sm text-gray border border-[#E5E5E5] rounded-lg resize-none font-family-poppins outline-none focus:border-teal"
              rows={3}
            />
            <p className="text-xs text-gray mt-1">
              {formData.bio.length}/500 characters
            </p>
          </div>

          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-all"
          >
            <X className="text-gray" size={24} />
          </button>
        </div>

        {/* Form Content */}
        <div className="py-6 px-10 max-w-5xl mx-auto space-y-6">
          {/* Name and Language */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="max-w-md">
              <label className="font-family-poppins text-sm font-medium text-gray block mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-4 py-3 border border-[#D0D0D0] rounded-lg font-family-poppins text-sm outline-none focus:border-teal"
              />
            </div>

            <div>
              <label className="font-family-poppins text-sm font-medium text-gray block mb-3">
                Languages
              </label>
              <div className="flex flex-wrap gap-2">
                {availableLanguages.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleLanguageToggle(lang)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-family-poppins text-sm transition-all ${
                      formData.languages.includes(lang)
                        ? "bg-teal text-white"
                        : "bg-gray-100 text-gray hover:bg-gray-200"
                    }`}
                  >
                    {formData.languages.includes(lang) && (
                      <Check size={14} />
                    )}
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="max-w-md">
            <label className="font-family-poppins text-sm font-medium text-gray block mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, location: e.target.value }))
              }
              placeholder="e.g., San Francisco, CA"
              className="w-full px-4 py-3 border border-[#D0D0D0] rounded-lg font-family-poppins text-sm outline-none focus:border-teal"
            />
          </div>

          {/* Timezone */}
          <div className="max-w-md">
            <label className="font-family-poppins text-sm font-medium text-gray block mb-2">
              Timezone
            </label>
            <select
              value={formData.timezone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, timezone: e.target.value }))
              }
              className="w-full px-4 py-3 border border-[#D0D0D0] rounded-lg font-family-poppins text-sm outline-none focus:border-teal bg-white"
            >
              <option value="">Select timezone</option>
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          {/* Skills I Teach */}
          <div>
            <label className="font-family-poppins text-sm font-bold text-black block mb-3">
              Skills I Teach
            </label>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray" size={16} />
              <input
                type="text"
                value={teachingSearch}
                onChange={(e) => setTeachingSearch(e.target.value)}
                onKeyDown={handleAddTeachingSkill}
                placeholder="Search skills..."
                className="w-full max-w-md pl-10 pr-4 py-2.5 border border-[#D0D0D0] rounded-lg font-family-poppins text-sm outline-none focus:border-teal"
              />
              {/* Suggestions Dropdown */}
              {teachingSuggestions.length > 0 && (
                <div className="absolute top-full max-w-md left-0 right-0 mt-1 bg-white border border-[#E5E5E5] rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {teachingSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleTeachingSuggestionClick(suggestion)}
                      className="w-full px-4 py-2 text-left font-family-poppins text-sm hover:bg-teal/10 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {skillsTeaching.map((skill) => (
                <span
                  key={skill._id || skill.name}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-full font-family-poppins text-sm"
                >
                  {skill.name}
                  <button
                    onClick={() => handleRemoveTeachingSkill(skill._id)}
                    className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
              {skillsTeaching.length === 0 && (
                <p className="font-family-poppins text-sm text-gray">
                  No teaching skills added yet. Search and select or press Enter to add.
                </p>
              )}
            </div>
          </div>

          {/* Skills I'm Learning */}
          <div>
            <label className="font-family-poppins text-sm font-bold text-black block mb-3">
              Skills I'm Learning
            </label>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray" size={16} />
              <input
                type="text"
                value={learningSearch}
                onChange={(e) => setLearningSearch(e.target.value)}
                onKeyDown={handleAddLearningSkill}
                placeholder="Search skills..."
                className="w-full max-w-md pl-10 pr-4 py-2.5 border border-[#D0D0D0] rounded-lg font-family-poppins text-sm outline-none focus:border-teal"
              />
              {/* Suggestions Dropdown */}
              {learningSuggestions.length > 0 && (
                <div className="absolute  max-w-md top-full left-0 right-0 mt-1 bg-white border border-[#E5E5E5] rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {learningSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleLearningSuggestionClick(suggestion)}
                      className="w-full px-4 py-2 text-left font-family-poppins text-sm hover:bg-teal/10 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {skillsLearning.map((skill) => (
                <span
                  key={skill._id || skill.name}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-full font-family-poppins text-sm"
                >
                  {skill.name}
                  <button
                    onClick={() => handleRemoveLearningSkill(skill._id)}
                    className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
              {skillsLearning.length === 0 && (
                <p className="font-family-poppins text-sm text-gray">
                  No learning goals added yet. Search and select or press Enter to add.
                </p>
              )}
            </div>
          </div>

          {/* Certifications */}
          <div>
            <label className="font-family-poppins text-sm font-bold text-black block mb-3">
              Certifications
            </label>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray" size={16} />
              <input
                type="text"
                value={certificationSearch}
                onChange={(e) => setCertificationSearch(e.target.value)}
                onKeyDown={handleAddCertification}
                placeholder="Search certifications..."
                className="w-full max-w-md pl-10 pr-4 py-2.5 border border-[#D0D0D0] rounded-lg font-family-poppins text-sm outline-none focus:border-teal"
              />
              {/* Suggestions Dropdown */}
              {certSuggestions.length > 0 && (
                <div className="absolute max-w-md top-full left-0 right-0 mt-1 bg-white border border-[#E5E5E5] rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {certSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleCertSuggestionClick(suggestion)}
                      className="w-full px-4 py-2 text-left font-family-poppins text-sm hover:bg-teal/10 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {certifications.map((cert) => (
                <span
                  key={cert._id || cert.name}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-full font-family-poppins text-sm"
                >
                  {cert.name}
                  <button
                    onClick={() => handleRemoveCertification(cert._id)}
                    className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
              {certifications.length === 0 && (
                <p className="font-family-poppins text-sm text-gray">
                  No certifications added yet. Search and select or press Enter to add.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-50 bg-white p-6 pt-4 border-t border-[#E5E5E5] flex justify-end gap-3">
          <Button
            variant="outline"
            className="px-6 py-2.5"
            onClick={handleClose}
            disabled={updateLoading}
          >
            Cancel
          </Button>
          <Button
            variant="herobtn"
            className="px-6 py-2.5 bg-dark-blue flex items-center gap-2"
            onClick={handleSave}
            disabled={updateLoading}
          >
            {updateLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {updateLoading ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EditProfileModal;
