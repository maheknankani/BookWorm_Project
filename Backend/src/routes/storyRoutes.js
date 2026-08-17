import express from "express";
import Story from "../models/Story.js";
import Notification from "../models/Notification.js";
import protectRoute from "../middleware/auth.middleware.js";
import cloudinary from "../lib/cloudinary.js";

const router = express.Router();

// 1. Create a story (supports media upload to Cloudinary or quotes)
router.post("/", protectRoute, async (req, res) => {
  try {
    const {
      media,
      mediaType = "image",
      caption = "",
      bookId = null,
      bookTitle = "",
      bookCover = "",
      quote = "",
      pageNumber = "",
      cardStyle = "forest",
    } = req.body;

    let mediaUrl = "";

    // Upload photo/video to Cloudinary if media payload is provided
    if (media) {
      if (media.startsWith("http://") || media.startsWith("https://")) {
        mediaUrl = media;
      } else {
        try {
          const uploadRes = await cloudinary.uploader.upload(media, {
            resource_type: mediaType === "video" ? "video" : "image",
            folder: "bookworm_stories",
          });
          mediaUrl = uploadRes.secure_url;
        } catch (uploadErr) {
          console.error("Cloudinary story upload error:", uploadErr.message);
          return res.status(500).json({ message: "Failed to upload story media to Cloudinary." });
        }
      }
    }

    if (!mediaUrl && !quote && !bookTitle) {
      return res.status(400).json({ message: "Story requires media, quote, or book info." });
    }

    const story = new Story({
      user: req.user._id,
      mediaUrl,
      mediaType: mediaUrl ? (mediaType === "video" ? "video" : "image") : "quote",
      caption: caption.trim(),
      book: bookId || null,
      bookTitle: bookTitle.trim(),
      bookCover: bookCover.trim(),
      quote: quote.trim(),
      pageNumber: pageNumber.trim(),
      cardStyle: cardStyle || "forest",
      likes: [],
      comments: [],
      viewers: [{ user: req.user._id, viewedAt: new Date() }],
    });

    await story.save();
    await story.populate("user", "username profileImage");

    res.status(201).json({
      message: "Story published successfully!",
      story,
    });
  } catch (error) {
    console.error("Error creating story:", error);
    res.status(500).json({ message: "Failed to create story." });
  }
});

// 2. Get active 24-hour stories grouped by author
router.get("/", protectRoute, async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const stories = await Story.find({ expiresAt: { $gt: new Date() } })
      .sort({ createdAt: 1 })
      .populate("user", "username profileImage")
      .populate("comments.user", "username profileImage");

    const storyGroupsMap = new Map();

    stories.forEach((story) => {
      if (!story.user) return;
      const authorId = story.user._id.toString();

      if (!storyGroupsMap.has(authorId)) {
        storyGroupsMap.set(authorId, {
          user: story.user,
          stories: [],
          hasUnviewed: false,
          isCurrentUser: authorId === currentUserId.toString(),
        });
      }

      const group = storyGroupsMap.get(authorId);
      group.stories.push(story);

      const viewed = story.viewers.some((v) => v.user.toString() === currentUserId.toString());
      if (!viewed) {
        group.hasUnviewed = true;
      }
    });

    const storyGroups = Array.from(storyGroupsMap.values()).sort((a, b) => {
      if (a.isCurrentUser) return -1;
      if (b.isCurrentUser) return 1;
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      return 0;
    });

    res.json({ storyGroups });
  } catch (error) {
    console.error("Error fetching stories:", error);
    res.status(500).json({ message: "Failed to fetch stories." });
  }
});

// 3. Record story view
router.post("/:id/view", protectRoute, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: "Story not found or expired." });
    }

    const userIdStr = req.user._id.toString();
    const alreadyViewed = story.viewers.some((v) => v.user.toString() === userIdStr);

    if (!alreadyViewed) {
      story.viewers.push({ user: req.user._id, viewedAt: new Date() });
      await story.save();
    }

    res.json({ message: "View recorded.", viewerCount: story.viewers.length });
  } catch (error) {
    console.error("Error recording view:", error);
    res.status(500).json({ message: "Failed to record view." });
  }
});

// 4. Like / React to a story
router.post("/:id/like", protectRoute, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: "Story not found or expired." });
    }

    const userIdStr = req.user._id.toString();
    const likeIndex = story.likes.findIndex((id) => id.toString() === userIdStr);

    let liked = false;
    if (likeIndex > -1) {
      story.likes.splice(likeIndex, 1);
    } else {
      story.likes.push(req.user._id);
      liked = true;

      if (story.user.toString() !== userIdStr) {
        try {
          const notification = new Notification({
            recipient: story.user,
            sender: req.user._id,
            type: "like",
            book: story.book || req.user._id,
            commentText: `liked your story`,
          });
          await notification.save();
        } catch (notifErr) {
          console.error("Notif warning:", notifErr.message);
        }
      }
    }

    await story.save();
    res.json({ liked, likesCount: story.likes.length, likes: story.likes });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ message: "Failed to update like status." });
  }
});

// 5. Comment on a story
router.post("/:id/comments", protectRoute, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required." });
    }

    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: "Story not found or expired." });
    }

    const newComment = {
      user: req.user._id,
      text: text.trim(),
      createdAt: new Date(),
    };

    story.comments.push(newComment);
    await story.save();
    await story.populate("comments.user", "username profileImage");

    if (story.user.toString() !== req.user._id.toString()) {
      try {
        const notification = new Notification({
          recipient: story.user,
          sender: req.user._id,
          type: "comment",
          book: story.book || req.user._id,
          commentText: `replied to your story: "${text.trim()}"`,
        });
        await notification.save();
      } catch (notifErr) {
        console.error("Notif warning:", notifErr.message);
      }
    }

    res.status(201).json({
      message: "Comment added.",
      comments: story.comments,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Failed to add comment." });
  }
});

// 6. Get story viewers list (author only)
router.get("/:id/viewers", protectRoute, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id).populate("viewers.user", "username profileImage");
    if (!story) {
      return res.status(404).json({ message: "Story not found or expired." });
    }

    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only author can view analytics." });
    }

    res.json({ viewers: story.viewers, count: story.viewers.length });
  } catch (error) {
    console.error("Error fetching viewers:", error);
    res.status(500).json({ message: "Failed to fetch viewers." });
  }
});

// 7. Delete story (author only)
router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: "Story not found." });
    }

    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    await Story.findByIdAndDelete(req.params.id);
    res.json({ message: "Story deleted successfully." });
  } catch (error) {
    console.error("Error deleting story:", error);
    res.status(500).json({ message: "Failed to delete story." });
  }
});

export default router;
