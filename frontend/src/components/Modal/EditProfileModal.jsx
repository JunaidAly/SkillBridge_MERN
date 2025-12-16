import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Camera, Loader2 } from "lucide-react";
import Button from "../../ui/Button";
import { updateProfile, uploadAvatar } from "../../store/profileSlice";

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

            <div className="flex flex-col md:items-end">
              <label className="font-family-poppins text-sm font-medium text-gray block mb-2">
                Languages
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableLanguages.map((lang) => (
                  <label
                    key={lang}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div
                      onClick={() => handleLanguageToggle(lang)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer ${
                        formData.languages.includes(lang)
                          ? "border-teal bg-teal"
                          : "border-gray"
                      }`}
                    >
                      {formData.languages.includes(lang) && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
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
