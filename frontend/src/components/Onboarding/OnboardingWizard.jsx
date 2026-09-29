import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Camera, Check, GraduationCap, Loader2, LogOut, Plus, Sparkles, X } from "lucide-react";
import { logout } from "../../store/authSlice";
import {
  addLearningSkill,
  addTeachingSkill,
  completeOnboarding,
  removeLearningSkill,
  removeTeachingSkill,
  updateProfile,
  uploadAvatar,
} from "../../store/profileSlice";
import { useToast } from "../../ui/Toast/ToastContext";
import { skillSuggestions } from "../../utils/skillSuggestions";

// A compact skill input for use inside the wizard. AddSkillModal can't be
// reused as-is (it's a modal of its own), but nothing that matters is
// duplicated: both share the suggestion list and both save through the same
// addTeachingSkill/addLearningSkill thunks.
function SkillPicker({ placeholder, skills, onAdd, onRemove, busy }) {
  const [value, setValue] = useState("");

  const suggestions = useMemo(() => {
    if (!value.trim()) return [];
    const taken = new Set(skills.map((s) => (s.name || s).toLowerCase()));
    return skillSuggestions
      .filter((s) => s.toLowerCase().includes(value.toLowerCase()) && !taken.has(s.toLowerCase()))
      .slice(0, 5);
  }, [value, skills]);

  const submit = async (name) => {
    const trimmed = (name ?? value).trim();
    if (!trimmed) return;
    const added = await onAdd(trimmed);
    if (added) setValue("");
  };

  return (
    <div>
      <div className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={placeholder}
            className="flex-1 px-4 py-3 border border-[#D0D0D0] rounded-lg font-family-poppins text-sm outline-none focus:border-teal"
          />
          <button
            type="button"
            onClick={() => submit()}
            disabled={busy || !value.trim()}
            className="px-4 py-3 bg-teal text-white rounded-lg font-family-poppins text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={16} />}
            Add
          </button>
        </div>

        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E5E5] rounded-lg shadow-lg z-10 max-h-44 overflow-y-auto">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => submit(s)}
                className="w-full px-4 py-2 text-left font-family-poppins text-sm hover:bg-teal/10 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {skills.map((skill) => (
            <span
              key={skill._id || skill.name}
              className="inline-flex items-center gap-1.5 bg-teal/10 text-teal font-family-poppins text-sm px-3 py-1.5 rounded-full"
            >
              {skill.name}
              <button
                type="button"
                onClick={() => onRemove(skill._id)}
                className="hover:text-red-500 transition-colors"
                aria-label={`Remove ${skill.name}`}
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const STEP_LABELS = {
  intent: "Your Goals",
  teaching: "Skills You Teach",
  learning: "Skills You Learn",
  profile: "Your Profile",
};

function OnboardingWizard({ profile }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [wantsToTeach, setWantsToTeach] = useState(false);
  const [wantsToLearn, setWantsToLearn] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar || null);
  const [busy, setBusy] = useState(false);

  const skillsTeaching = profile?.skillsTeaching || [];
  const skillsLearning = profile?.skillsLearning || [];

  // The welcome screen is folded into the intent step rather than being its own
  // click-through - the signup form already introduced the product, so a pure
  // "click Next" screen would just be friction.
  const steps = useMemo(() => {
    const list = ["intent"];
    if (wantsToTeach) list.push("teaching");
    if (wantsToLearn) list.push("learning");
    list.push("profile", "done");
    return list;
  }, [wantsToTeach, wantsToLearn]);

  const step = steps[Math.min(stepIndex, steps.length - 1)];
  // "done" is a confirmation screen, not something to number in the tracker.
  const trackedSteps = steps.filter((s) => s !== "done");
  const isDone = step === "done";

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const finish = async () => {
    setBusy(true);
    try {
      await dispatch(completeOnboarding()).unwrap();
    } catch {
      // Non-fatal: worst case the wizard shows once more. Don't trap the user
      // behind a failed bookkeeping call.
    } finally {
      setBusy(false);
      navigate("/dashboard");
    }
  };

  // Deliberately does NOT touch onboardingCompleted - it stays false, so the
  // wizard greets them again on their next login.
  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const addSkill = async (type, name) => {
    setBusy(true);
    try {
      await dispatch(type === "teaching" ? addTeachingSkill(name) : addLearningSkill(name)).unwrap();
      return true;
    } catch (err) {
      toast.error(err || "Failed to add skill");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const removeSkill = async (type, skillId) => {
    try {
      await dispatch(
        type === "teaching" ? removeTeachingSkill(skillId) : removeLearningSkill(skillId)
      ).unwrap();
    } catch (err) {
      toast.error(err || "Failed to remove skill");
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const saveProfileStep = async () => {
    setBusy(true);
    try {
      if (avatarFile) await dispatch(uploadAvatar(avatarFile)).unwrap();
      if (bio.trim() !== (profile?.bio || "")) {
        await dispatch(updateProfile({ bio: bio.trim() })).unwrap();
      }
      setStepIndex((i) => i + 1);
    } catch (err) {
      toast.error(err || "Failed to save your details");
    } finally {
      setBusy(false);
    }
  };

  const cardTitles = {
    intent: `Welcome to SkillBridge${profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}!`,
    teaching: "What can you teach?",
    learning: "What do you want to learn?",
    profile: "Finish your profile",
  };

  const cardSubtitles = {
    intent: "What brings you here? Pick whatever fits — you can choose both.",
    teaching: "Add the skills you're confident helping others with.",
    learning: "We'll use these to recommend teachers for you.",
    profile: "A photo and a short intro help people decide to book you.",
  };

  return (
    <div className="fixed inset-0 z-60 bg-light-bg overflow-y-auto">
      <div className="min-h-full flex flex-col">
        <div className="px-4 py-5 lg:px-8 flex items-center justify-between gap-4">
          <img src="/assets/logo.png" alt="SkillBridge" className="h-8" />
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 font-family-poppins text-sm font-medium text-gray hover:text-teal transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

       
        <div className="px-4 lg:px-8">
          <div className="max-w-4xl mx-auto overflow-x-auto">
            <div className="flex items-stretch min-w-max sm:min-w-0 bg-white border border-[#E5E5E5] rounded-xl overflow-hidden">
              {trackedSteps.map((s, i) => {
                const currentIndex = isDone ? trackedSteps.length : stepIndex;
                const isComplete = i < currentIndex;
                const isActive = i === currentIndex;
                return (
                  <div
                    key={s}
                    className={`flex-1 flex items-center gap-3 px-4 py-4 sm:px-5 ${
                      i > 0 ? "border-l border-[#E5E5E5]" : ""
                    }`}
                  >
                    <span
                      className={`w-8 h-8 shrink-0 rounded-full border-2 flex items-center justify-center font-family-poppins text-xs font-semibold transition-all ${
                        isComplete
                          ? "bg-teal border-teal text-white"
                          : isActive
                          ? "border-teal text-teal"
                          : "border-[#D0D0D0] text-gray"
                      }`}
                    >
                      {isComplete ? <Check size={14} /> : String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`font-family-poppins text-sm font-medium whitespace-nowrap ${
                        isActive || isComplete ? "text-teal" : "text-gray"
                      }`}
                    >
                      {STEP_LABELS[s]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step card */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 lg:px-8">
          <div className="w-full max-w-xl bg-white border border-[#E5E5E5] rounded-xl p-6 sm:p-8">
            {!isDone && (
              <div className="mb-6">
                <h2 className="font-family-poppins text-xl sm:text-2xl font-bold text-black mb-1">
                  {cardTitles[step]}
                </h2>
                <p className="font-family-poppins text-sm text-gray">{cardSubtitles[step]}</p>
              </div>
            )}

            {step === "intent" && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setWantsToTeach((v) => !v)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                    wantsToTeach ? "border-teal bg-teal/5" : "border-[#E5E5E5] hover:border-[#D0D0D0]"
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center shrink-0">
                    <GraduationCap className="text-teal" size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-family-poppins text-sm font-semibold text-black">
                      I want to teach others
                    </p>
                    <p className="font-family-poppins text-xs text-gray">
                      Share what you know and earn credits.
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                      wantsToTeach ? "bg-teal border-teal" : "border-[#D0D0D0]"
                    }`}
                  >
                    {wantsToTeach && <Check className="text-white" size={14} />}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setWantsToLearn((v) => !v)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                    wantsToLearn ? "border-teal bg-teal/5" : "border-[#E5E5E5] hover:border-[#D0D0D0]"
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center shrink-0">
                    <Sparkles className="text-teal" size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-family-poppins text-sm font-semibold text-black">
                      I want to learn from others
                    </p>
                    <p className="font-family-poppins text-xs text-gray">
                      Find a mentor for the skills you want next.
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                      wantsToLearn ? "bg-teal border-teal" : "border-[#D0D0D0]"
                    }`}
                  >
                    {wantsToLearn && <Check className="text-white" size={14} />}
                  </div>
                </button>
              </div>
            )}

            {step === "teaching" && (
              <SkillPicker
                placeholder="e.g., React Development"
                skills={skillsTeaching}
                busy={busy}
                onAdd={(name) => addSkill("teaching", name)}
                onRemove={(id) => removeSkill("teaching", id)}
              />
            )}

            {step === "learning" && (
              <SkillPicker
                placeholder="e.g., UI/UX Design"
                skills={skillsLearning}
                busy={busy}
                onAdd={(name) => addSkill("learning", name)}
                onRemove={(id) => removeSkill("learning", id)}
              />
            )}

            {step === "profile" && (
              <>
                <div className="flex items-center gap-4 mb-5">
                  <div className="relative w-20 h-20 shrink-0">
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray text-2xl font-medium">
                          {profile?.name?.charAt(0)?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-7 h-7 bg-teal rounded-full flex items-center justify-center hover:opacity-90 transition-all"
                      aria-label="Upload profile photo"
                    >
                      <Camera className="text-white" size={14} />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                  <p className="font-family-poppins text-sm text-gray">
                    Add a profile photo
                    <span className="block text-xs">Optional, but recommended.</span>
                  </p>
                </div>

                <label className="font-family-poppins text-sm font-medium text-gray block mb-2">
                  Short bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write a short bio about yourself..."
                  maxLength={500}
                  rows={4}
                  className="w-full p-3 text-sm text-black border border-[#D0D0D0] rounded-lg resize-none font-family-poppins outline-none focus:border-teal"
                />
                <p className="text-xs text-gray mt-1">{bio.length}/500 characters</p>
              </>
            )}

            {isDone && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="text-teal" size={32} />
                </div>
                <h2 className="font-family-poppins text-2xl font-bold text-black mb-2">
                  You're all set!
                </h2>
                <p className="font-family-poppins text-sm text-gray">
                  Your profile is ready. You can change any of this later from your profile page.
                </p>
              </div>
            )}

            {/* Card actions */}
            <div className="flex items-center justify-between gap-3 mt-8">
              {stepIndex > 0 && !isDone ? (
                <button
                  type="button"
                  onClick={() => setStepIndex((i) => i - 1)}
                  disabled={busy}
                  className="font-family-poppins text-sm font-medium text-gray hover:text-black transition-colors disabled:opacity-50"
                >
                  Back
                </button>
              ) : (
                <span />
              )}

              {step === "intent" && (
                <button
                  type="button"
                  onClick={() => setStepIndex(1)}
                  disabled={!wantsToTeach && !wantsToLearn}
                  className="font-family-poppins text-sm font-semibold text-white bg-teal px-6 py-2.5 rounded-lg hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              )}

              {(step === "teaching" || step === "learning") && (
                <button
                  type="button"
                  onClick={() => setStepIndex((i) => i + 1)}
                  disabled={busy}
                  className="font-family-poppins text-sm font-semibold text-white bg-teal px-6 py-2.5 rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                >
                  Continue
                </button>
              )}

              {step === "profile" && (
                <button
                  type="button"
                  onClick={saveProfileStep}
                  disabled={busy}
                  className="font-family-poppins text-sm font-semibold text-white bg-teal px-6 py-2.5 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                  Continue
                </button>
              )}

              {isDone && (
                <button
                  type="button"
                  onClick={finish}
                  disabled={busy}
                  className="font-family-poppins text-sm font-semibold text-white bg-teal px-6 py-2.5 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2 ml-auto"
                >
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                  Go to Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingWizard;
