/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { useMovies } from "@/contexts/MovieContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Plus,
  Star,
  Calendar,
  Clock,
  ArrowLeft,
  Play,
  Share2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/utils";
import { Movie } from "@/contexts/MovieContext";
import WatchlistSelectorModal from "@/components/WatchlistSelectorModal";

interface Review {
  _id: string;
  user: { username: string; avatar_url?: string };
  rating: number;
  content: string;
}

const MovieDetails = () => {
  const { id } = useParams<{ id: string }>();
  const {
    addToFavorites,
    removeFromFavorites,
    addToWatchlist,
    removeFromWatchlist,
    isFavorite,
    isInWatchlist,
  } = useMovies();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    const fetchMovie = async () => {
      if (!id) return;
      try {
        const apiKey = import.meta.env.VITE_TMDB_API_KEY;
        const res = await fetch(
          `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=en-US`
        );
        if (!res.ok) return;
        const data = await res.json();
        setMovie(data);
        // Fetch trailer
        const videoRes = await fetch(
          `https://api.themoviedb.org/3/movie/${id}/videos?api_key=${apiKey}`
        );
        if (videoRes.ok) {
          const videoData = await videoRes.json();
          const trailer = videoData.results?.find(
            (v: any) => v.site === "YouTube" && v.type === "Trailer"
          );
          setTrailerKey(trailer ? trailer.key : null);
        }
      } catch (e) {
        /* ignore */
      }
    };
    fetchMovie();
  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        const apiKey = import.meta.env.VITE_TMDB_API_KEY;
        const res = await api.get(`/users/reviews/movie/${movie?.id}`);
        setReviews(res.data);
      } catch (e) {
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };
    const fetchUserReview = async () => {
      try {
        const apiKey = import.meta.env.VITE_TMDB_API_KEY;
        const res = await api.get(`/users/reviews/user/${movie?.id}`);
        if (res.data) {
          setUserReview(res.data);
          setReviewContent(res.data.content);
          setReviewRating(res.data.rating);
        }
      } catch (e) {
        setUserReview(null);
      }
    };
    fetchReviews();
    if (isAuthenticated) fetchUserReview();
  }, [movie?.id, isAuthenticated]);

  const handleFavoriteToggle = () => {
    if (!isAuthenticated || !movie) return;
    if (isFavorite(movie.id)) {
      removeFromFavorites(movie.id);
      toast({
        title: "Removed from favorites",
        description: `${movie.title} has been removed from your favorites`,
      });
    } else {
      addToFavorites({
        id: movie.id,
        title: movie.title,
        overview: movie.overview,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        vote_count: movie.vote_count,
        genre_ids:
          ((movie as any).genres as Array<{ id: number }>)?.map((g) => g.id) ||
          [],
        popularity: movie.popularity || 0,
        adult: (movie as any).adult || false,
        video: (movie as any).video || false,
        original_language: movie.original_language || "",
        original_title: movie.original_title || "",
      });
      toast({
        title: "Added to favorites",
        description: `${movie.title} has been added to your favorites`,
      });
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (userReview) {
        // Update review
        await api.put(`/users/reviews/${userReview._id}`, {
          rating: reviewRating,
          content: reviewContent,
        });
        toast({ title: "Review updated!" });
      } else {
        // Create review
        await api.post("/users/reviews", {
          movieId: movie?.id,
          rating: reviewRating,
          content: reviewContent,
        });
        toast({ title: "Review submitted!" });
      }
      // Refresh reviews
      const res = await api.get(`/users/reviews/movie/${movie?.id}`);
      setReviews(res.data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to submit review",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;
    try {
      await api.delete(`/users/reviews/${userReview._id}`);
      setUserReview(null);
      setReviewContent("");
      setReviewRating(0);
      const res = await api.get(`/users/reviews/movie/${movie?.id}`);
      setReviews(res.data);
      toast({ title: "Review deleted!" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete review",
        variant: "destructive",
      });
    }
  };

  const backdropUrl = `https://image.tmdb.org/t/p/original${movie?.backdrop_path}`;
  const posterUrl = `https://image.tmdb.org/t/p/w500${movie?.poster_path}`;

  if (!movie)
    return (
      <Layout>
        <div className='text-center text-white py-20'>Loading movie...</div>
      </Layout>
    );

  return (
    <Layout>
      <div className='bg-gray-900 min-h-screen'>
        {/* Hero Section */}
        <div className='relative'>
          <div className='absolute inset-0 h-96 md:h-[500px]'>
            <img
              src={backdropUrl}
              alt={movie.title}
              className='w-full h-full object-cover'
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder.svg";
              }}
            />
            <div className='absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent' />
          </div>

          <div className='relative z-10 pt-8'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
              {/* Back Button */}
              <Link
                to='/'
                className='inline-flex items-center text-white hover:text-gray-300 mb-8'
              >
                <ArrowLeft className='h-4 w-4 mr-2' />
                Back to Home
              </Link>

              <div className='flex flex-col lg:flex-row lg:items-end lg:space-x-8 pt-32 md:pt-40'>
                {/* Poster */}
                <div className='flex-shrink-0 mb-6 lg:mb-0'>
                  <img
                    src={posterUrl}
                    alt={movie.title}
                    className='w-64 h-96 object-cover rounded-lg shadow-2xl mx-auto lg:mx-0'
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder.svg";
                    }}
                  />
                </div>

                {/* Movie Info */}
                <div className='flex-1 text-center lg:text-left'>
                  <h1 className='text-4xl md:text-5xl font-bold text-white mb-4'>
                    {movie.title}
                  </h1>

                  {(movie as any).tagline && (
                    <p className='text-xl text-gray-300 italic mb-4'>
                      "{(movie as any).tagline}"
                    </p>
                  )}

                  <div className='flex flex-wrap justify-center lg:justify-start items-center gap-4 mb-6'>
                    <div className='flex items-center space-x-1'>
                      <Star className='h-5 w-5 text-yellow-400 fill-yellow-400' />
                      <span className='text-white font-medium'>
                        {movie.vote_average?.toFixed(1) || "N/A"}
                      </span>
                      <span className='text-gray-400'>
                        ({movie.vote_count?.toLocaleString() || "N/A"} votes)
                      </span>
                    </div>

                    <div className='flex items-center space-x-1'>
                      <Calendar className='h-5 w-5 text-gray-400' />
                      <span className='text-gray-300'>
                        {new Date(movie.release_date || "").getFullYear() ||
                          "N/A"}
                      </span>
                    </div>

                    <div className='flex items-center space-x-1'>
                      <Clock className='h-5 w-5 text-gray-400' />
                      <span className='text-gray-300'>
                        {(movie as any).runtime || "N/A"} min
                      </span>
                    </div>
                  </div>

                  {/* Genres */}
                  <div className='flex flex-wrap justify-center lg:justify-start gap-2 mb-6'>
                    {(movie as any).genres?.map((genre: any) => (
                      <Badge
                        key={genre.id}
                        variant='secondary'
                        className='bg-gray-700 text-gray-300'
                      >
                        {genre.name}
                      </Badge>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className='flex flex-wrap justify-center lg:justify-start gap-4'>
                    <Button
                      size='lg'
                      className='bg-red-600 hover:bg-red-700'
                      onClick={() => setShowTrailer(true)}
                      disabled={!trailerKey}
                    >
                      <Play className='h-5 w-5 mr-2' />
                      Watch Trailer
                    </Button>

                    <Button
                      size='lg'
                      variant='outline'
                      onClick={handleFavoriteToggle}
                      className={`border-gray-600 ${
                        isFavorite(movie.id)
                          ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
                          : "text-gray-300 hover:bg-gray-800"
                      }`}
                    >
                      <Heart
                        className={`h-5 w-5 mr-2 ${isFavorite(movie.id) ? "fill-white" : ""}`}
                      />
                      {isFavorite(movie.id) ? "Favorited" : "Add to Favorites"}
                    </Button>

                    <Button
                      size='lg'
                      variant='outline'
                      onClick={() => {
                        if (!isAuthenticated) {
                          toast({
                            title: "Login Required",
                            description:
                              "Please login to add movies to your watchlist",
                            variant: "destructive",
                          });
                          return;
                        }
                        setShowWatchlistModal(true);
                      }}
                      className={`border-gray-600 ${
                        isInWatchlist(movie.id)
                          ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                          : "text-gray-300 hover:bg-gray-800"
                      }`}
                    >
                      <Plus className='h-5 w-5 mr-2' />
                      {isInWatchlist(movie.id)
                        ? "In Watchlist"
                        : "Add to Watchlist"}
                    </Button>

                    <Button
                      size='lg'
                      variant='outline'
                      className='border-gray-600 text-gray-300 hover:bg-gray-800'
                    >
                      <Share2 className='h-5 w-5 mr-2' />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* Overview */}
            <div className='lg:col-span-2'>
              <h2 className='text-2xl font-bold text-white mb-4'>Overview</h2>
              <p className='text-gray-300 text-lg leading-relaxed mb-8'>
                {movie.overview}
              </p>

              {/* Director & Cast */}
              <div className='space-y-6'>
                <div>
                  <h3 className='text-xl font-semibold text-white mb-2'>
                    Director
                  </h3>
                  <p className='text-gray-300'>
                    {(movie as any).director || "N/A"}
                  </p>
                </div>

                <div>
                  <h3 className='text-xl font-semibold text-white mb-3'>
                    Cast
                  </h3>
                  <div className='space-y-2'>
                    {(movie as any).cast?.map((actor: any, index: number) => (
                      <div
                        key={index}
                        className='flex justify-between items-center'
                      >
                        <span className='text-gray-300'>{actor.name}</span>
                        <span className='text-gray-500'>{actor.character}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Info */}
            <div className='space-y-6'>
              <div className='bg-gray-800 rounded-lg p-6'>
                <h3 className='text-xl font-semibold text-white mb-4'>
                  Movie Info
                </h3>
                <div className='space-y-3'>
                  <div>
                    <span className='text-gray-400'>Release Date:</span>
                    <span className='text-white ml-2'>
                      {new Date(movie.release_date || "").toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className='text-gray-400'>Runtime:</span>
                    <span className='text-white ml-2'>
                      {(movie as any).runtime || "N/A"} minutes
                    </span>
                  </div>
                  <div>
                    <span className='text-gray-400'>Budget:</span>
                    <span className='text-white ml-2'>
                      {(movie as any).budget
                        ? `$${((movie as any).budget / 1000000).toFixed(0)}M`
                        : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className='text-gray-400'>Revenue:</span>
                    <span className='text-white ml-2'>
                      {(movie as any).revenue
                        ? `$${((movie as any).revenue / 1000000).toFixed(0)}M`
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add this section after movie info and actions */}
        <div className='mt-12'>
          <h2 className='text-2xl font-bold text-white mb-4'>Reviews</h2>
          {loadingReviews ? (
            <p className='text-gray-400'>Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className='text-gray-400'>
              No reviews yet. Be the first to review!
            </p>
          ) : (
            <div className='space-y-6 mb-8'>
              {reviews.map((review) => (
                <div key={review._id} className='bg-gray-800 rounded-lg p-4'>
                  <div className='flex items-center mb-2'>
                    <span className='font-semibold text-white mr-2'>
                      {review.user?.username || "User"}
                    </span>
                    <span className='text-yellow-400'>
                      {"★".repeat(review.rating)}
                    </span>
                  </div>
                  <p className='text-gray-300'>{review.content}</p>
                </div>
              ))}
            </div>
          )}
          {isAuthenticated && (
            <form
              onSubmit={handleReviewSubmit}
              className='bg-gray-800 rounded-lg p-6'
            >
              <h3 className='text-lg font-semibold text-white mb-2'>
                {userReview ? "Edit Your Review" : "Write a Review"}
              </h3>
              <div className='flex items-center mb-4'>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type='button'
                    key={star}
                    className={`text-2xl ${reviewRating >= star ? "text-yellow-400" : "text-gray-500"}`}
                    onClick={() => setReviewRating(star)}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                className='w-full p-2 rounded bg-gray-900 text-white mb-4'
                rows={3}
                placeholder='Share your thoughts...'
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                required
              />
              <div className='flex space-x-2'>
                <Button type='submit' className='bg-red-600 hover:bg-red-700'>
                  {userReview ? "Update Review" : "Submit Review"}
                </Button>
                {userReview && (
                  <Button
                    type='button'
                    variant='destructive'
                    onClick={handleDeleteReview}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </form>
          )}
        </div>
        {isAuthenticated && (
          <WatchlistSelectorModal
            open={showWatchlistModal}
            onClose={() => setShowWatchlistModal(false)}
            movieId={movie.id}
            onMovieAdded={() => setShowWatchlistModal(false)}
          />
        )}
        {showTrailer && trailerKey && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80'>
            <div className='relative w-full max-w-2xl aspect-video'>
              <button
                className='absolute top-2 right-2 z-10 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-80'
                onClick={() => setShowTrailer(false)}
              >
                ✕
              </button>
              <iframe
                width='100%'
                height='100%'
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
                title='Movie Trailer'
                allow='autoplay; encrypted-media'
                allowFullScreen
                className='rounded-lg w-full h-full'
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MovieDetails;
