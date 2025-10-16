import mongoose from 'mongoose';

const characterSchema = new mongoose.Schema({
  malId: {
    type: Number,
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

const timingSchema = new mongoose.Schema({
  start: {
    type: String,
    required: true,
  },
  end: {
    type: String,
    required: true,
  },
}, { _id: false });

const extractSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  characters: {
    type: [characterSchema],
    default: [],
  },
  animeId: {
    type: Number,
    required: true,
  },
  animeTitle: {
    type: String,
    required: true,
  },
  animeImage: {
    type: String,
  },
  apiSource: {
    type: String,
    enum: ['MAL', 'JIKAN'],
    default: 'JIKAN',
  },
  timing: {
    type: timingSchema,
    required: true,
  },
  season: {
    type: Number,
  },
  episode: {
    type: Number,
  },
  themeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Theme',
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
extractSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Extract = mongoose.model('Extract', extractSchema);

export default Extract;
