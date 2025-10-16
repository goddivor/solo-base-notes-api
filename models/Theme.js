import mongoose from 'mongoose';

const themeSchema = new mongoose.Schema({
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
themeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Theme = mongoose.model('Theme', themeSchema);

export default Theme;
