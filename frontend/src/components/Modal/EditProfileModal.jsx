import { useState, useEffect } from "react";
import { X, Search , Pencil} from "lucide-react";
import Button from "../../ui/Button";

function EditProfileModal({ isOpen, onClose, user }) {
  const [isClosing, setIsClosing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    email: user?.email || "",
    location: user?.location || "",
    languages: ["Urdu", "English"],
  });

  const [skillsTeaching, setSkillsTeaching] = useState([
    "React Development",
    "TypeScript",
    "UI/UX",
  ]);

  const [skillsLearning, setSkillsLearning] = useState([
    "Machine Learning",
    "Social Media Marketing",
    "Data Science",
  ]);

  const [certifications, setCertifications] = useState([
    "AWS Solution Architect",
    "Google UI/UX Design",
  ]);

  const availableLanguages = ["Urdu", "English", "Arabic"];

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

  const removeSkillTeaching = (skill) => {
    setSkillsTeaching((prev) => prev.filter((s) => s !== skill));
  };

  const removeSkillLearning = (skill) => {
    setSkillsLearning((prev) => prev.filter((s) => s !== skill));
  };

  const removeCertification = (cert) => {
    setCertifications((prev) => prev.filter((c) => c !== cert));
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        isClosing ? "modal-overlay-exit" : "modal-overlay-enter"
      }`}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div
        className={`relative bg-white shadow-xl rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto scrollbar-hide ${
          isClosing ? "modal-content-exit" : "modal-content-enter"
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 z-50 bg-white p-6 pb-4 border-b border-[#E5E5E5] flex items-start gap-4">
          {/* Avatar */}
          <div className=" relative w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
            <span className="text-gray text-2xl font-medium">
              {formData.name.charAt(0)}
            </span>
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-teal rounded-full flex items-center justify-center">
              <Pencil className="text-white" size={12} />
            </div>
          </div>

          <div className="flex-1">
            <h2 className="font-family-poppins text-xl font-bold text-black">
              {formData.name}
            </h2>
            <textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, bio: e.target.value }))
              }
              className="w-full mt-2 p-2 text-sm text-gray border border-[#E5E5E5] rounded-lg resize-none font-family-poppins outline-none focus:border-teal"
              rows={3}
            />
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

            <div className="flex flex-col  md:items-end">
              <label className="font-family-poppins text-sm font-medium text-gray block mb-2">
                Language
              </label>
              <div className="space-y-2">
                {availableLanguages.map((lang) => (
                  <label
                    key={lang}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        formData.languages.includes(lang)
                          ? "border-teal bg-teal"
                          : "border-gray"
                      }`}
                    >
                      {formData.languages.includes(lang) && (
                        <div className="w-2 h-2 bg-teal rounded-full" />
                      )}
                    </div>
                    <span className="font-family-poppins text-sm text-black">
                      {lang}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="max-w-md">
            <label className="font-family-poppins text-sm font-medium text-gray block mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full px-4 py-3 border border-[#D0D0D0] rounded-lg font-family-poppins text-sm outline-none focus:border-teal"
            />
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
              className="w-full px-4 py-3 border border-[#D0D0D0] rounded-lg font-family-poppins text-sm outline-none focus:border-teal"
            />
          </div>

          {/* Skills I Teach */}
          <div className="relative max-w-md">
            <label className="font-family-poppins text-sm font-medium text-black block mb-2">
              Skills I Teach
            </label>
            <div className="relative mb-3">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray z-10"
                size={18}
              />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-4 py-3 bg-light-gray rounded-full font-family-poppins text-sm  relative z-0"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {skillsTeaching.map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-full font-family-poppins text-sm"
                >
                  {skill}
                  <button onClick={() => removeSkillTeaching(skill)}>
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Skills I'm Learning */}
          <div className="relative max-w-md">
            <label className="font-family-poppins text-sm font-medium text-black block mb-2">
              Skills I'm Learning
            </label>
            <div className="relative mb-3">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray z-10"
                size={18}
              />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-4 py-3 bg-light-gray rounded-full font-family-poppins text-sm  relative z-0"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {skillsLearning.map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-full font-family-poppins text-sm"
                >
                  {skill}
                  <button onClick={() => removeSkillLearning(skill)}>
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div className="relative max-w-md">
            <label className="font-family-poppins text-sm font-medium text-black block mb-2">
              Certifications
            </label>
            <div className="relative mb-3">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray z-10"
                size={18}
              />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-4 py-3 bg-light-gray rounded-full font-family-poppins text-sm  relative z-0"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {certifications.map((cert) => (
                <span
                  key={cert}
                  className="flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-full font-family-poppins text-sm"
                >
                  {cert}
                  <button onClick={() => removeCertification(cert)}>
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-50 bg-white p-6 pt-4 border-t border-[#E5E5E5] flex justify-end gap-3">
          <Button
            variant="outline"
            className="px-6 py-2.5"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button variant="herobtn" className="px-6 py-2.5 bg-dark-blue">
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EditProfileModal;
