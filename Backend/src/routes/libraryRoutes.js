import express from "express";
import ReadingList from "../models/ReadingList.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

// Add or update a book in the user's reading list
router.post("/", protectRoute, async (req, res) => {
  try {
    const { bookId, status } = req.body;

    if (!bookId || !status) {
      return res.status(400).json({ message: "bookId and status are required" });
    }

    if (!["want_to_read", "reading", "finished"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const item = await ReadingList.findOneAndUpdate(
      { user: req.user._id, book: bookId },
      { status },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate({
      path: "book",
      populate: { path: "user", select: "username profileImage" },
    });

    res.status(200).json(item);
  } catch (error) {
    console.error("Error updating reading list:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
});

// Update reading progress (lastPageRead and totalPages)
router.patch("/progress", protectRoute, async (req, res) => {
  try {
    const { bookId, lastPageRead, totalPages } = req.body;

    if (!bookId) {
      return res.status(400).json({ message: "bookId is required" });
    }

    const updateFields = {};
    if (lastPageRead !== undefined) updateFields.lastPageRead = Number(lastPageRead);
    if (totalPages !== undefined) updateFields.totalPages = Number(totalPages);

    const item = await ReadingList.findOneAndUpdate(
      { user: req.user._id, book: bookId },
      updateFields,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json(item);
  } catch (error) {
    console.error("Error updating reading progress:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get user's reading list (optional filter by status)
router.get("/", protectRoute, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { user: req.user._id };

    if (status && ["want_to_read", "reading", "finished"].includes(status)) {
      query.status = status;
    }

    const list = await ReadingList.find(query)
      .sort({ updatedAt: -1 })
      .populate({
        path: "book",
        populate: { path: "user", select: "username profileImage" },
      });

    const validList = list.filter((item) => item.book !== null);

    res.json(validList);
  } catch (error) {
    console.error("Error fetching reading list:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get single reading list entry for a book
router.get("/item/:bookId", protectRoute, async (req, res) => {
  try {
    const item = await ReadingList.findOne({ user: req.user._id, book: req.params.bookId });
    res.json(item || null);
  } catch (error) {
    console.error("Error fetching library item:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get user's reading list status map ({ [bookId]: status })
router.get("/status", protectRoute, async (req, res) => {
  try {
    const list = await ReadingList.find({ user: req.user._id }).select("book status");
    const statusMap = {};
    list.forEach((item) => {
      if (item.book) {
        statusMap[item.book.toString()] = item.status;
      }
    });
    res.json(statusMap);
  } catch (error) {
    console.error("Error fetching library status map:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Remove a book from the user's reading list
router.delete("/:bookId", protectRoute, async (req, res) => {
  try {
    const { bookId } = req.params;
    await ReadingList.deleteOne({ user: req.user._id, book: bookId });
    res.json({ message: "Removed from library", bookId });
  } catch (error) {
    console.error("Error removing from reading list:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
