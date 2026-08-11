import mongoose from "mongoose";

const readingListSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    status: {
      type: String,
      enum: ["want_to_read", "reading", "finished"],
      default: "want_to_read",
      required: true,
    },
    lastPageRead: {
      type: Number,
      default: 1,
      min: 1,
    },
    totalPages: {
      type: Number,
      default: 100,
      min: 1,
    },
  },
  { timestamps: true }
);

// Ensure a user can only have one reading list entry per book
readingListSchema.index({ user: 1, book: 1 }, { unique: true });

const ReadingList = mongoose.model("ReadingList", readingListSchema);

export default ReadingList;
