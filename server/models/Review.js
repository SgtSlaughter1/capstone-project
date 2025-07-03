import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  movieId: {
    type: Number,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  content: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 1000
  }
}, {
  timestamps: true
});

reviewSchema.index({ user: 1, movieId: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);