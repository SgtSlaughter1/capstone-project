import React from "react";
import { Link } from "react-router-dom";
import { Movie } from "@/contexts/MovieContext";
import { useMovies } from "@/contexts/MovieContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Heart, Plus, Star, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import WatchlistSelectorModal from "@/components/WatchlistSelectorModal";

interface MovieCardProps {
  movie: Movie;
  size?: "small" | "medium" | "large";
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, size = "medium" }) => {
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
  const [showWatchlistModal, setShowWatchlistModal] = React.useState(false);

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to add movies to your favorites",
        variant: "destructive",
      });
      return;
    }

    if (isFavorite(movie.id)) {
      await removeFromFavorites(movie.id);
      toast({
        title: "Removed from favorites",
        description: `${movie.title} has been removed from your favorites`,
      });
    } else {
      await addToFavorites(movie);
      toast({
        title: "Added to favorites",
        description: `${movie.title} has been added to your favorites`,
      });
    }
  };

  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "/placeholder.svg";

  const cardSizes = {
    small: "w-40",
    medium: "w-48",
    large: "w-56",
  };

  return (
    <div className={`${cardSizes[size]} group relative`}>
      <Link to={`/movie/${movie.id}`} className='block'>
        <div className='relative overflow-hidden rounded-lg bg-gray-800 shadow-lg transition-transform duration-300 group-hover:scale-105'>
          <img
            src={imageUrl}
            alt={movie.title}
            className='w-full h-64 sm:h-72 object-cover'
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder.svg";
            }}
          />

          {/* Overlay */}
          <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300'>
            <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
              <div className='flex space-x-2'>
                <Button
                  size='sm'
                  variant='secondary'
                  onClick={handleFavoriteToggle}
                  className={`${isFavorite(movie.id) ? "bg-red-600 hover:bg-red-700" : "bg-gray-800/80 hover:bg-gray-700/80"}`}
                >
                  <Heart
                    className={`h-4 w-4 ${isFavorite(movie.id) ? "fill-white" : ""}`}
                  />
                </Button>
                <Button
                  size='sm'
                  variant='secondary'
                  onClick={(e) => {
                    e.preventDefault();
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
                  className={`${isInWatchlist(movie.id) ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-800/80 hover:bg-gray-700/80"}`}
                >
                  <Plus className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </div>

          {/* Rating Badge */}
          <div className='absolute top-2 right-2 bg-black/80 rounded-full px-2 py-1 flex items-center space-x-1'>
            <Star className='h-3 w-3 text-yellow-400 fill-yellow-400' />
            <span className='text-xs font-medium'>
              {movie.vote_average.toFixed(1)}
            </span>
          </div>
        </div>

        <div className='mt-3 space-y-1'>
          <h3 className='text-sm font-medium text-white group-hover:text-red-400 transition-colors line-clamp-2'>
            {movie.title}
          </h3>
          <div className='flex items-center space-x-2 text-xs text-gray-400'>
            <Calendar className='h-3 w-3' />
            <span>{new Date(movie.release_date).getFullYear()}</span>
          </div>
        </div>
      </Link>
      {isAuthenticated && (
        <WatchlistSelectorModal
          open={showWatchlistModal}
          onClose={() => setShowWatchlistModal(false)}
          movieId={movie.id}
          onMovieAdded={() => setShowWatchlistModal(false)}
        />
      )}
    </div>
  );
};

export default MovieCard;
