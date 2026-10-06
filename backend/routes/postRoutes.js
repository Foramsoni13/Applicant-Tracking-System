import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Post from "../models/Post.js";
import User from "../models/User.js";

const router = express.Router();

// Configure Multer for Post Media Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "posts");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `post_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only image and document files are allowed"));
    }
  },
});

// GET ALL POSTS (Global Feed)
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "name headline profilePicture")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error("Fetch posts error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET CANDIDATE POSTS
router.get("/candidate/:candidateId", async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.candidateId })
      .populate("author", "name headline profilePicture")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error("Fetch candidate posts error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// CREATE POST
router.post("/", upload.single("media"), async (req, res) => {
  try {
    const { authorId, content, tags, attachedProject, attachedCertificate } = req.body;

    if (!authorId || !content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Author and content are required.",
      });
    }

    const user = await User.findById(authorId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    let mediaPath = "";
    if (req.file) {
      mediaPath = `/uploads/posts/${req.file.filename}`;
    }

    let parsedTags = [];
    if (tags) {
      if (typeof tags === "string") {
        parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
      } else if (Array.isArray(tags)) {
        parsedTags = tags;
      }
    }

    let parsedProj = {};
    if (attachedProject) {
      try {
        parsedProj = typeof attachedProject === "string" ? JSON.parse(attachedProject) : attachedProject;
      } catch (e) {}
    }

    let parsedCert = {};
    if (attachedCertificate) {
      try {
        parsedCert = typeof attachedCertificate === "string" ? JSON.parse(attachedCertificate) : attachedCertificate;
      } catch (e) {}
    }

    const post = new Post({
      author: user._id,
      authorName: user.name,
      authorHeadline: user.headline || "",
      authorPicture: user.profilePicture || "",
      content: content.trim(),
      media: mediaPath,
      attachedProject: parsedProj,
      attachedCertificate: parsedCert,
      tags: parsedTags,
    });

    await post.save();

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      post,
    });
  } catch (error) {
    console.error("Create post error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// EDIT POST
router.put("/:id", async (req, res) => {
  try {
    const { content, tags } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    if (content) post.content = content.trim();
    if (tags) {
      post.tags = typeof tags === "string" ? tags.split(",").map((t) => t.trim()).filter(Boolean) : tags;
    }

    await post.save();

    return res.status(200).json({
      success: true,
      message: "Post updated successfully",
      post,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE POST
router.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }
    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// TOGGLE LIKE POST
router.post("/:id/like", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID required" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    const index = post.likes.indexOf(userId);
    if (index === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(index, 1);
    }

    await post.save();

    return res.status(200).json({
      success: true,
      likes: post.likes,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ADD COMMENT TO POST
router.post("/:id/comment", async (req, res) => {
  try {
    const { userId, text } = req.body;
    if (!userId || !text || !text.trim()) {
      return res.status(400).json({ success: false, message: "User ID and comment text required." });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    const user = await User.findById(userId);

    post.comments.push({
      user: userId,
      userName: user ? user.name : "User",
      userPicture: user ? user.profilePicture || "" : "",
      text: text.trim(),
      createdAt: new Date(),
    });

    await post.save();

    return res.status(200).json({
      success: true,
      comments: post.comments,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
