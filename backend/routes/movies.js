import express from "express";
import axios from "axios";
import auth from "../middleware/auth.js";
import Favorite from "../models/Favorite.js";
import Review from "../models/Review.js";
import User from "../models/User.js";

const router = express.Router();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Get popular movies with filters
router.get("/popular", async (req, res) => {
  try {
    const { page = 1, genre, minRating, maxRating, year, sortBy } = req.query;

    let url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&page=${page}`;

    if (genre) url += `&with_genres=${genre}`;
    if (minRating) url += `&vote_average.gte=${minRating}`;
    if (maxRating) url += `&vote_average.lte=${maxRating}`;
    if (year) url += `&year=${year}`;
    if (sortBy) url += `&sort_by=${sortBy}`;

    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching movies", error: error.message });
  }
});

// Search movies
router.get("/search", async (req, res) => {
  try {
    const { query, page = 1 } = req.query;
    const response = await axios.get(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`
    );
    res.json(response.data);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error searching movies", error: error.message });
  }
});

// Get trending movies
router.get("/trending", async (req, res) => {
  try {
    const { timeWindow = "week" } = req.query;
    const response = await axios.get(
      `${TMDB_BASE_URL}/trending/movie/${timeWindow}?api_key=${TMDB_API_KEY}`
    );
    res.json(response.data);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error fetching trending movies",
        error: error.message,
      });
  }
});

// Get movie details
router.get("/:id", async (req, res) => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/movie/${req.params.id}?api_key=${TMDB_API_KEY}`
    );
    res.json(response.data);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching movie details", error: error.message });
  }
});

// Get personalized recommendations (hybrid: collaborative + content-based)
router.get("/recommendations/personalized", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const userReviews = await Review.find({ user: req.userId });
    const userRatedMovieIds = userReviews.map((r) => r.movieId);
    const userWatched = user.watchedMovies || [];
    const favorites = await Favorite.find({ user: req.userId });
    const favoriteMovieIds = favorites.map((f) => f.movieId);
    const alreadySeen = new Set([
      ...userRatedMovieIds,
      ...userWatched,
      ...favoriteMovieIds,
    ]);

    // --- Collaborative Filtering ---
    // Find users who rated the same movies highly
    const highRated = userReviews
      .filter((r) => r.rating >= 4)
      .map((r) => r.movieId);
    let similarUsers = [];
    if (highRated.length > 0) {
      similarUsers = await Review.aggregate([
        {
          $match: {
            movieId: { $in: highRated },
            rating: { $gte: 4 },
            user: { $ne: user._id },
          },
        },
        { $group: { _id: "$user", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);
    }
    let collaborativeMovieIds = [];
    if (similarUsers.length > 0) {
      const similarUserIds = similarUsers.map((u) => u._id);
      const similarReviews = await Review.find({
        user: { $in: similarUserIds },
        rating: { $gte: 4 },
      });
      collaborativeMovieIds = similarReviews
        .map((r) => r.movieId)
        .filter((mid) => !alreadySeen.has(mid));
    }

    // --- Content-Based Filtering ---
    // Use TMDB similar movies and genres
    let contentBasedMovieIds = [];
    for (const review of userReviews.filter((r) => r.rating >= 4).slice(0, 3)) {
      try {
        const response = await axios.get(
          `${TMDB_BASE_URL}/movie/${review.movieId}/similar?api_key=${TMDB_API_KEY}`
        );
        const similar = response.data.results
          .map((m) => m.id)
          .filter((mid) => !alreadySeen.has(mid));
        contentBasedMovieIds.push(...similar.slice(0, 5));
      } catch {}
    }
    // Also recommend by favorite genres
    if (
      user.preferences.favoriteGenres &&
      user.preferences.favoriteGenres.length > 0
    ) {
      try {
        const genreIds = user.preferences.favoriteGenres.join(",");
        const response = await axios.get(
          `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreIds}&sort_by=vote_average.desc&vote_count.gte=100`
        );
        const genreMovies = response.data.results
          .map((m) => m.id)
          .filter((mid) => !alreadySeen.has(mid));
        contentBasedMovieIds.push(...genreMovies.slice(0, 10));
      } catch {}
    }

    // --- Hybrid: Merge, deduplicate, fetch details ---
    const allMovieIds = Array.from(
      new Set([...collaborativeMovieIds, ...contentBasedMovieIds])
    ).slice(0, 20);
    const movieDetails = [];
    for (const mid of allMovieIds) {
      try {
        const response = await axios.get(
          `${TMDB_BASE_URL}/movie/${mid}?api_key=${TMDB_API_KEY}`
        );
        movieDetails.push(response.data);
      } catch {}
    }
    res.json({ results: movieDetails, total_results: movieDetails.length });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error fetching personalized recommendations",
        error: error.message,
      });
  }
});

// Get genres
router.get("/genres/list", async (req, res) => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}`
    );
    res.json(response.data);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching genres", error: error.message });
  }
});

export default router;
