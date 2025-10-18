import mongoose from 'mongoose';

const publishedVideoSchema = new mongoose.Schema({
  youtubeVideoId: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  thumbnail: {
    type: String,
  },
  publishedAt: {
    type: String,
  },
  duration: {
    type: String,
  },
  viewCount: {
    type: Number,
  },
  likeCount: {
    type: Number,
  },
  commentCount: {
    type: Number,
  },
  extractIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Extract',
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
publishedVideoSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add index for efficient querying
publishedVideoSchema.index({ userId: 1, createdAt: -1 });
publishedVideoSchema.index({ youtubeVideoId: 1 });

const PublishedVideo = mongoose.model('PublishedVideo', publishedVideoSchema);

export default PublishedVideo;
