import mongoose from "mongoose";

const storyCommentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const storyViewerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  viewedAt: {
    type: Date,
    default: Date.now,
  },
});

const storySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mediaUrl: {
      type: String,
      default: "",
    },
    mediaType: {
      type: String,
      enum: ["image", "video", "quote"],
      default: "image",
    },
    caption: {
      type: String,
      default: "",
      trim: true,
    },
    bookTitle: {
      type: String,
      default: "",
      trim: true,
    },
    bookCover: {
      type: String,
      default: "",
    },
    quote: {
      type: String,
      default: "",
      trim: true,
    },
    pageNumber: {
      type: String,
      default: "",
      trim: true,
    },
    cardStyle: {
      type: String,
      default: "forest",
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [storyCommentSchema],
    viewers: [storyViewerSchema],
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours TTL
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);

// Safeguard filter for unexpired stories
storySchema.pre(/^find/, function (next) {
  this.where({ expiresAt: { $gt: new Date() } });
  next();
});

const Story = mongoose.model("Story", storySchema);

export default Story;
