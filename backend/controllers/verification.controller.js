import User from '../models/User.js';

export const submitVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.skillsTeaching || user.skillsTeaching.length === 0) {
      return res.status(403).json({
        message: 'Add at least one skill you teach before submitting for verification.',
      });
    }

    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ message: 'At least one document is required.' });
    }

    const docUrls = files.map((f) => f.path);

    user.verificationDocs = docUrls;
    user.verificationStatus = 'pending';
    user.verificationSubmittedAt = new Date();
    user.verificationRejectionReason = undefined;
    await user.save();

    res.json({
      success: true,
      verificationStatus: user.verificationStatus,
      verificationDocs: user.verificationDocs,
      verificationSubmittedAt: user.verificationSubmittedAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
