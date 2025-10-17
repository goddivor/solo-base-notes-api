import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  // We use a fixed _id to ensure only one settings document exists
  _id: {
    type: String,
    default: 'global-settings',
  },
  youtubeChannelUrl: {
    type: String,
    default: null,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
});

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
