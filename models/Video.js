import mongoose from 'mongoose';

const videoSegmentSchema = new mongoose.Schema({
  extractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Extract',
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  order: {
    type: Number,
    required: true,
  },
}, { _id: false });

const spotifyArtistSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
}, { _id: false });

const spotifyAlbumSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
}, { _id: false });

const spotifyTrackSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  artists: {
    type: [spotifyArtistSchema],
    required: true,
  },
  album: {
    type: spotifyAlbumSchema,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  previewUrl: {
    type: String,
  },
  spotifyUrl: {
    type: String,
    required: true,
  },
  uri: {
    type: String,
    required: true,
  },
}, { _id: false });

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  tags: {
    type: String,
    required: true,
  },
  segments: {
    type: [videoSegmentSchema],
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one segment is required',
    },
  },
  musicTracks: {
    type: [spotifyTrackSchema],
    default: [],
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  youtubeVideoId: {
    type: String,
    default: null,
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
videoSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add index for efficient querying
videoSchema.index({ userId: 1, createdAt: -1 });

const Video = mongoose.model('Video', videoSchema);

export default Video;
