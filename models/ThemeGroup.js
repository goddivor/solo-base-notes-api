import mongoose from 'mongoose';

const themeGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  color: {
    type: String,
    default: '#3B82F6',
  },
  // Array of Theme IDs (mini-themes)
  themes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Theme',
  }],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update updatedAt on save
themeGroupSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const ThemeGroup = mongoose.model('ThemeGroup', themeGroupSchema);

export default ThemeGroup;
