import User from '../models/User.js';
import { notifyAdmins, emitToAdmins } from '../utils/notify.js';
import { isValidDocType, DEFAULT_VERIFICATION_DOC_TYPE } from '../config/verificationDocTypes.js';

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

    // docTypes arrives parallel to the files (same order). Multipart text
    // fields come through as a string when there's only one, so it's
    // normalised to an array before pairing. Anything unrecognised falls back
    // rather than rejecting the whole upload.
    const rawTypes = req.body.docTypes;
    const docTypes = Array.isArray(rawTypes) ? rawTypes : rawTypes ? [rawTypes] : [];

    const docs = files.map((file, i) => ({
      url: file.path,
      docType: isValidDocType(docTypes[i]) ? docTypes[i] : DEFAULT_VERIFICATION_DOC_TYPE,
      fileName: file.originalname || '',
    }));

    user.verificationDocs = docs;
    user.verificationStatus = 'pending';
    user.verificationSubmittedAt = new Date();
    user.verificationRejectionReason = undefined;
    await user.save();

    // Tell the admins: a bell notification each, plus a live event so an open
    // Verifications screen gains the row without a refresh.
    await notifyAdmins({
      type: 'verification_submitted',
      title: 'New verification request',
      body: `${user.name} submitted ${docs.length} document${docs.length === 1 ? '' : 's'} for teacher verification.`,
      link: '/admin/verifications',
    });

    emitToAdmins('verificationSubmitted', {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        skillsTeaching: user.skillsTeaching,
        verificationDocs: user.verificationDocs,
        verificationSubmittedAt: user.verificationSubmittedAt,
        verificationStatus: user.verificationStatus,
      },
    });

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
