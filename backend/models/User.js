import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  sessions: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
});

const learningSkillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
});

const certificationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  issuer: {
    type: String,
    trim: true,
  },
  year: {
    type: String,
  },
  fileUrl: {
    type: String,
  },
  filePublicId: {
    type: String,
  },
  fileName: {
    type: String,
  },
  fileMimeType: {
    type: String,
  },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function() {
        return !this.googleId && !this.facebookId;
      },
      minlength: 6,
      select: false,
    },
    googleId: {
      type: String,
      sparse: true,
    },
    facebookId: {
      type: String,
      sparse: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // Platform-level suspension, distinct from the user-to-user `blockedUsers`
    // relationship below - set by an admin (typically off the back of a
    // report) to cut off login/chat access entirely.
    isSuspended: {
      type: Boolean,
      default: false,
    },
    suspendedAt: {
      type: Date,
      default: null,
    },
    suspendedReason: {
      type: String,
      default: null,
    },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified',
    },
    verificationDocs: [{
      type: String,
    }],
    verificationSubmittedAt: {
      type: Date,
    },
    verificationReviewedAt: {
      type: Date,
    },
    verificationRejectionReason: {
      type: String,
    },
    bio: {
      type: String,
      maxlength: 500,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    languages: [{
      type: String,
      trim: true,
    }],
    timezone: {
      type: String,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    avatarPublicId: {
      type: String,
      default: '',
    },
    skillsTeaching: [skillSchema],
    skillsLearning: [learningSkillSchema],
    certifications: [certificationSchema],
    stats: {
      sessionsTaught: {
        type: Number,
        default: 0,
      },
      sessionsLearned: {
        type: Number,
        default: 0,
      },
      avgRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
    },
    // Users this account has blocked. Blocking prevents messages in either
    // direction between the two accounts.
    blockedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    // Updated when a user's last socket disconnects; used to show "last seen" text.
    lastSeen: {
      type: Date,
      default: null,
    },
    // True once this user has booked their one free trial session as a
    // student - set at booking time, not completion, and never reset by any
    // in-app action. See Meeting.isFreeTrialSession.
    freeTrialSessionUsed: {
      type: Boolean,
      default: false,
    },
    // Teacher-side opt-in: off by default, since accepting a free-trial
    // booking means this user earns nothing for that session.
    acceptsFreeTrialSessions: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);


