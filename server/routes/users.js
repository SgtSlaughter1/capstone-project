import express from "express";
import auth from "../middleware/auth.js";
import User from "../models/User.js";
import Favorite from "../models/Favorite.js";
import Watchlist from "../models/Watchlist.js";
import Review from "../models/Review.js";
import multer from "multer";
import fs from "fs";
import path from "path";

const router = express.Router();

// Multer setup for avatar uploads
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads/avatars");
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, req.userId + "_" + Date.now() + ext);
  },
});
const upload = multer({
  storage: avatarStorage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
});

// Get user profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching profile", error: error.message });
  }
});

// Update user profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { username, avatar_url, preferences } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { username, avatar_url, preferences },
      { new: true, runValidators: true }
    ).select("-password");

    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating profile", error: error.message });
  }
});

// Favorites
router.get("/favorites", auth, async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.userId }).sort({
      createdAt: -1,
    });
    res.json(favorites);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching favorites", error: error.message });
  }
});

router.post("/favorites", auth, async (req, res) => {
  try {
    const { movieId } = req.body;

    const existingFavorite = await Favorite.findOne({
      user: req.userId,
      movieId,
    });
    if (existingFavorite) {
      return res.status(400).json({ message: "Movie already in favorites" });
    }

    const favorite = new Favorite({ user: req.userId, movieId });
    await favorite.save();

    res.status(201).json(favorite);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding to favorites", error: error.message });
  }
});

router.delete("/favorites/:movieId", auth, async (req, res) => {
  try {
    await Favorite.findOneAndDelete({
      user: req.userId,
      movieId: req.params.movieId,
    });
    res.json({ message: "Removed from favorites" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error removing from favorites", error: error.message });
  }
});

router.get("/favorites/:movieId/check", auth, async (req, res) => {
  try {
    const favorite = await Favorite.findOne({
      user: req.userId,
      movieId: req.params.movieId,
    });
    res.json({ isFavorite: !!favorite });
  } catch (error) {
    res.status(500).json({
      message: "Error checking favorite status",
      error: error.message,
    });
  }
});

// Watchlists
router.get("/watchlists", auth, async (req, res) => {
  try {
    const watchlists = await Watchlist.find({ user: req.userId }).sort({
      createdAt: -1,
    });
    res.json(watchlists);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching watchlists", error: error.message });
  }
});

router.post("/watchlists", auth, async (req, res) => {
  try {
    const { name, description } = req.body;

    const watchlist = new Watchlist({
      user: req.userId,
      name,
      description,
      movies: [],
    });

    await watchlist.save();
    res.status(201).json(watchlist);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating watchlist", error: error.message });
  }
});

router.delete("/watchlists/:id", auth, async (req, res) => {
  try {
    await Watchlist.findOneAndDelete({ _id: req.params.id, user: req.userId });
    res.json({ message: "Watchlist deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting watchlist", error: error.message });
  }
});

router.post("/watchlists/:id/movies", auth, async (req, res) => {
  try {
    const { movieId } = req.body;

    const watchlist = await Watchlist.findOne({
      _id: req.params.id,
      user: req.userId,
    });
    if (!watchlist) {
      return res.status(404).json({ message: "Watchlist not found" });
    }

    const existingMovie = watchlist.movies.find((m) => m.movieId === movieId);
    if (existingMovie) {
      return res.status(400).json({ message: "Movie already in watchlist" });
    }

    watchlist.movies.push({ movieId });
    await watchlist.save();

    res.json(watchlist);
  } catch (error) {
    res.status(500).json({
      message: "Error adding movie to watchlist",
      error: error.message,
    });
  }
});

router.delete("/watchlists/:id/movies/:movieId", auth, async (req, res) => {
  try {
    const watchlist = await Watchlist.findOne({
      _id: req.params.id,
      user: req.userId,
    });
    if (!watchlist) {
      return res.status(404).json({ message: "Watchlist not found" });
    }

    watchlist.movies = watchlist.movies.filter(
      (m) => m.movieId !== parseInt(req.params.movieId)
    );
    await watchlist.save();

    res.json(watchlist);
  } catch (error) {
    res.status(500).json({
      message: "Error removing movie from watchlist",
      error: error.message,
    });
  }
});

// Reviews
router.get("/reviews/movie/:movieId", async (req, res) => {
  try {
    const reviews = await Review.find({ movieId: req.params.movieId })
      .populate("user", "username avatar_url")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching reviews", error: error.message });
  }
});

router.get("/reviews/user/:movieId", auth, async (req, res) => {
  try {
    const review = await Review.findOne({
      user: req.userId,
      movieId: req.params.movieId,
    });
    res.json(review);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user review", error: error.message });
  }
});

router.post("/reviews", auth, async (req, res) => {
  try {
    const { movieId, rating, content } = req.body;

    const existingReview = await Review.findOne({ user: req.userId, movieId });
    if (existingReview) {
      return res
        .status(400)
        .json({ message: "Review already exists for this movie" });
    }

    const review = new Review({
      user: req.userId,
      movieId,
      rating,
      content,
    });

    await review.save();
    await review.populate("user", "username avatar_url");

    res.status(201).json(review);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating review", error: error.message });
  }
});

router.put("/reviews/:id", auth, async (req, res) => {
  try {
    const { rating, content } = req.body;

    const review = await Review.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { rating, content },
      { new: true, runValidators: true }
    ).populate("user", "username avatar_url");

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json(review);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating review", error: error.message });
  }
});

router.delete("/reviews/:id", auth, async (req, res) => {
  try {
    await Review.findOneAndDelete({ _id: req.params.id, user: req.userId });
    res.json({ message: "Review deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting review", error: error.message });
  }
});

// Avatar upload endpoint
router.post("/avatar", auth, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { avatar_url: avatarUrl },
      { new: true, runValidators: true }
    ).select("-password");
    res.json({ avatar_url: avatarUrl, user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error uploading avatar", error: error.message });
  }
});

// Follow or unfollow a user
router.post("/:id/follow", auth, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.userId;
    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: "You cannot follow yourself." });
    }
    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);
    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: "User not found." });
    }
    const isFollowing = currentUser.following.includes(targetUserId);
    if (isFollowing) {
      // Unfollow
      currentUser.following.pull(targetUserId);
      targetUser.followers.pull(currentUserId);
      await currentUser.save();
      await targetUser.save();
      return res.json({ following: false });
    } else {
      // Follow
      currentUser.following.addToSet(targetUserId);
      targetUser.followers.addToSet(currentUserId);
      await currentUser.save();
      await targetUser.save();
      return res.json({ following: true });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error following user", error: error.message });
  }
});

// Get followers of a user
router.get("/:id/followers", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "followers",
      "_id username avatar_url"
    );
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ followers: user.followers });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching followers", error: error.message });
  }
});

// Get following of a user
router.get("/:id/following", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "following",
      "_id username avatar_url"
    );
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ following: user.following });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching following", error: error.message });
  }
});

// Get a user's public profile by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user", error: error.message });
  }
});

// Mark a movie as watched
router.post("/watched/:movieId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (!user.watchedMovies.includes(Number(req.params.movieId))) {
      user.watchedMovies.push(Number(req.params.movieId));
      await user.save();
    }
    res.json({ watchedMovies: user.watchedMovies });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating watched movies", error: error.message });
  }
});

// Get watched movies
router.get("/watched", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ watchedMovies: user.watchedMovies });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching watched movies", error: error.message });
  }
});

export default router;
