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
    skillsLearning: [{
      type: String,
      trim: true,
    }],
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

