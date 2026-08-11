import express from "express";
import cloudinary from "../lib/cloudinary.js";
import Book from "../models/Book.js";
import Notification from "../models/Notification.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const validateImagePayload = (imageStr) => {
  if (!imageStr || typeof imageStr !== "string") {
    return { valid: false, message: "Cover image is required" };
  }
  if (imageStr.startsWith("http://") || imageStr.startsWith("https://")) {
    return { valid: true };
  }
  if (!imageStr.startsWith("data:image/")) {
    return { valid: false, message: "Invalid image format. Supported formats: JPEG, PNG, WEBP" };
  }
  const base64Data = imageStr.split(",")[1] || "";
  const sizeInBytes = (base64Data.length * 3) / 4;
  if (sizeInBytes > MAX_IMAGE_SIZE_BYTES) {
    return { valid: false, message: "Cover image file size exceeds the 5MB limit" };
  }
  return { valid: true };
};

const validatePdfPayload = (pdfStr) => {
  if (!pdfStr || typeof pdfStr !== "string" || pdfStr.trim() === "") {
    return { valid: true };
  }
  if (pdfStr.startsWith("http://") || pdfStr.startsWith("https://")) {
    return { valid: true };
  }
  if (!pdfStr.startsWith("data:application/pdf")) {
    return { valid: false, message: "Invalid document format. Only PDF files are allowed" };
  }
  const base64Data = pdfStr.split(",")[1] || "";
  const sizeInBytes = (base64Data.length * 3) / 4;
  if (sizeInBytes > MAX_PDF_SIZE_BYTES) {
    return { valid: false, message: "PDF file size exceeds the 10MB limit" };
  }
  return { valid: true };
};

// Create book recommendation (with optional PDF upload)
router.post("/", protectRoute, async (req, res) => {
  try {
    const { title, caption, rating, image, pdf } = req.body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ message: "Book title is required" });
    }
    if (title.trim().length > 150) {
      return res.status(400).json({ message: "Book title cannot exceed 150 characters" });
    }

    if (!caption || typeof caption !== "string" || caption.trim().length === 0) {
      return res.status(400).json({ message: "Book review caption is required" });
    }
    if (caption.trim().length > 2000) {
      return res.status(400).json({ message: "Caption cannot exceed 2000 characters" });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: "Rating must be a number between 1 and 5" });
    }

    const imageCheck = validateImagePayload(image);
    if (!imageCheck.valid) {
      return res.status(400).json({ message: imageCheck.message });
    }

    const pdfCheck = validatePdfPayload(pdf);
    if (!pdfCheck.valid) {
      return res.status(400).json({ message: pdfCheck.message });
    }

    let imageUrl = image;
    if (image.startsWith("data:")) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    let pdfUrl = "";
    if (pdf && pdf.trim() !== "") {
      if (pdf.startsWith("data:")) {
        try {
          const pdfUpload = await cloudinary.uploader.upload(pdf, {
            resource_type: "raw",
            folder: "book_pdfs",
          });
          pdfUrl = pdfUpload.secure_url;
        } catch (pdfErr) {
          console.error("PDF upload Cloudinary error:", pdfErr.message);
          pdfUrl = pdf;
        }
      } else {
        pdfUrl = pdf;
      }
    }

    const newBook = new Book({
      title: title.trim(),
      caption: caption.trim(),
      rating: Math.round(numRating),
      image: imageUrl,
      pdfUrl,
      user: req.user._id,
      likes: [],
      comments: [],
    });

    await newBook.save();
    res.status(201).json(newBook);
  } catch (error) {
    console.error("Error creating book:", error);
    res.status(500).json({ message: "Failed to create recommendation" });
  }
});

// Pagination, Search & Filter books
router.get("/", protectRoute, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const search = req.query.search;
    const minRating = req.query.minRating;

    const query = {};

    if (search && typeof search === "string" && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ title: searchRegex }, { caption: searchRegex }];
    }

    if (minRating && !isNaN(Number(minRating))) {
      query.rating = { $gte: Number(minRating) };
    }

    const books = await Book.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username profileImage")
      .populate("comments.user", "username profileImage");

    const totalBooks = await Book.countDocuments(query);

    const formattedBooks = books.map((book) => {
      const bookObj = book.toObject();
      return {
        ...bookObj,
        likesCount: book.likes ? book.likes.length : 0,
        commentsCount: book.comments ? book.comments.length : 0,
        isLiked: book.likes ? book.likes.some((id) => id.toString() === req.user._id.toString()) : false,
      };
    });

    res.json({
      books: formattedBooks,
      currentPage: page,
      totalBooks,
      totalPages: Math.ceil(totalBooks / limit),
    });
  } catch (error) {
    console.error("Error in get all books route:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get recommended books by the logged-in user
router.get("/user", protectRoute, async (req, res) => {
  try {
    const books = await Book.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(books);
  } catch (error) {
    console.error("Get user books error:", error.message);
    res.status(500).json({ message: "Failed to load user recommendations" });
  }
});

// Get single book details
router.get("/:id", protectRoute, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate("user", "username profileImage")
      .populate("comments.user", "username profileImage");

    if (!book) return res.status(404).json({ message: "Book not found" });

    const bookObj = book.toObject();
    const formattedBook = {
      ...bookObj,
      likesCount: book.likes ? book.likes.length : 0,
      commentsCount: book.comments ? book.comments.length : 0,
      isLiked: book.likes ? book.likes.some((id) => id.toString() === req.user._id.toString()) : false,
    };

    res.json(formattedBook);
  } catch (error) {
    console.error("Error fetching single book:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Toggle Like / Unlike a book
router.post("/:id/like", protectRoute, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const userIdStr = req.user._id.toString();
    const existingIndex = book.likes.findIndex((id) => id.toString() === userIdStr);

    let isLiked = false;
    if (existingIndex > -1) {
      book.likes.splice(existingIndex, 1);
      isLiked = false;
    } else {
      book.likes.push(req.user._id);
      isLiked = true;

      if (book.user.toString() !== userIdStr) {
        await Notification.create({
          recipient: book.user,
          sender: req.user._id,
          type: "like",
          book: book._id,
        });
      }
    }

    await book.save();

    res.json({
      likesCount: book.likes.length,
      isLiked,
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Add a comment to a book
router.post("/:id/comment", protectRoute, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string" || text.trim() === "") {
      return res.status(400).json({ message: "Comment text cannot be empty" });
    }
    if (text.trim().length > 1000) {
      return res.status(400).json({ message: "Comment cannot exceed 1000 characters" });
    }

    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const newComment = {
      user: req.user._id,
      text: text.trim(),
      createdAt: new Date(),
    };

    book.comments.push(newComment);
    await book.save();

    if (book.user.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: book.user,
        sender: req.user._id,
        type: "comment",
        book: book._id,
        commentText: text.trim(),
      });
    }

    const updatedBook = await Book.findById(req.params.id).populate(
      "comments.user",
      "username profileImage"
    );

    res.status(201).json(updatedBook.comments);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete a comment (Ownership check)
router.delete("/:id/comment/:commentId", protectRoute, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const comment = book.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const isCommentOwner = comment.user.toString() === req.user._id.toString();
    const isBookOwner = book.user.toString() === req.user._id.toString();

    if (!isCommentOwner && !isBookOwner) {
      return res.status(403).json({ message: "Unauthorized to delete this comment" });
    }

    comment.deleteOne();
    await book.save();

    const updatedBook = await Book.findById(req.params.id).populate(
      "comments.user",
      "username profileImage"
    );

    res.json(updatedBook.comments);
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete a book (Strict Ownership check)
router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (book.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized: You can only delete your own books" });
    }

    if (book.image && book.image.includes("cloudinary")) {
      try {
        const publicId = book.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.error("Error deleting image from Cloudinary:", deleteError);
      }
    }

    await book.deleteOne();
    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("Error deleting book:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;