import React, { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import MovieCard from "@/components/MovieCard";
import { useMovies } from "@/contexts/MovieContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Heart, Search, Plus, List, Edit3, Trash2, Move } from "lucide-react";
import { Link } from "react-router-dom";
import { Movie } from "@/contexts/MovieContext";

const Favorites = () => {
  const {
    favorites,
    watchlists,
    fetchWatchlists,
    createWatchlist,
    addMovieToWatchlist,
    removeMovieFromWatchlist,
    deleteWatchlist,
    fetchFavorites,
  } = useMovies();
  const { isAuthenticated } = useAuth();
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [newWatchlistDesc, setNewWatchlistDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [watchlistMovies, setWatchlistMovies] = useState<{
    [movieId: number]: Movie;
  }>({});
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [movingMovie, setMovingMovie] = useState<{
    movieId: number;
    fromId: string;
  } | null>(null);
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;

  useEffect(() => {
    if (isAuthenticated) {
      fetchWatchlists();
      fetchFavorites();
    }
  }, [isAuthenticated, fetchWatchlists, fetchFavorites]);

  useEffect(() => {
    const fetchMovieDetails = async (movieId: number) => {
      if (watchlistMovies[movieId]) return;
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&language=en-US`
        );
        if (!res.ok) return;
        const data = await res.json();
        setWatchlistMovies((prev) => ({ ...prev, [movieId]: data }));
      } catch {
        /* ignore error */
      }
    };
    watchlists.forEach((watchlist) => {
      watchlist.movies.forEach((m) => {
        fetchMovieDetails(m.movieId);
      });
    });
    // eslint-disable-next-line
  }, [watchlists]);

  const handleCreateWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWatchlistName) return;
    setCreating(true);
    await createWatchlist(newWatchlistName, newWatchlistDesc);
    setNewWatchlistName("");
    setNewWatchlistDesc("");
    setCreating(false);
  };

  const handleDeleteWatchlist = async (id: string) => {
    await deleteWatchlist(id);
  };

  const handleRenameWatchlist = async (id: string) => {
    // For demo, just update name locally. In production, call backend.
    // You can add a backend endpoint for renaming if needed.
    setRenamingId(null);
  };

  const handleMoveMovie = async (
    movieId: number,
    fromId: string,
    toId: string
  ) => {
    await addMovieToWatchlist(toId, movieId);
    await removeMovieFromWatchlist(fromId, movieId);
    setMovingMovie(null);
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className='bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
            <div className='text-center py-20'>
              <div className='relative mb-8'>
                <div className='w-32 h-32 bg-gradient-to-r from-red-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl'>
                  <Heart className='h-16 w-16 text-white' />
                </div>
                <div className='absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-full animate-pulse'></div>
              </div>
              <h2 className='text-4xl md:text-5xl font-bold text-white mb-6'>
                Your Movie Collection
                <span className='text-red-500 ml-2'>Awaits</span>
              </h2>
              <p className='text-gray-300 mb-8 max-w-2xl mx-auto text-lg leading-relaxed'>
                Create an account to save your favorite movies, build custom
                watchlists, and never lose track of what you want to watch next.
              </p>
              <div className='flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6'>
                <Link to='/login'>
                  <Button className='bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 w-full sm:w-auto'>
                    Login to Continue
                  </Button>
                </Link>
                <Link to='/register'>
                  <Button
                    variant='outline'
                    className='border-2 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white backdrop-blur-sm px-8 py-3 text-lg font-semibold transition-all duration-200 transform hover:scale-105 w-full sm:w-auto'
                  >
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className='bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          {/* Header */}
          <div className='mb-12 text-center'>
            <div className='inline-block p-3 bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl mb-4'>
              <Heart className='h-8 w-8 text-white' />
            </div>
            <h1 className='text-4xl md:text-5xl font-bold text-white mb-4'>
              My Movie <span className='text-red-500'>Collection</span>
            </h1>
            <p className='text-gray-300 max-w-2xl mx-auto text-lg'>
              Your curated collection of favorite movies and personalized
              watchlists
            </p>
          </div>

          {/* Favorites Section */}
          <section className='mb-16'>
            <div className='bg-gradient-to-r from-red-600/10 to-pink-600/10 rounded-3xl p-8 mb-8 border border-red-500/20 backdrop-blur-sm'>
              <div className='flex items-center justify-between mb-6'>
                <div className='flex items-center space-x-3'>
                  <div className='p-2 bg-red-600/20 rounded-xl backdrop-blur-sm'>
                    <Heart className='h-7 w-7 text-red-500 fill-red-500' />
                  </div>
                  <div>
                    <h2 className='text-2xl md:text-3xl font-bold text-white'>
                      Favorite Movies
                    </h2>
                    <p className='text-gray-300 text-sm'>
                      Movies you absolutely love
                    </p>
                  </div>
                  <div className='bg-gradient-to-r from-red-600 to-pink-600 text-white text-sm px-3 py-1 rounded-full font-semibold'>
                    {favorites.length}
                  </div>
                </div>
              </div>

              {favorites.length > 0 ? (
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6'>
                  {favorites.map((movie, index) => (
                    <div
                      key={movie.id}
                      className='transform hover:scale-105 transition-all duration-300 hover:z-10'
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <MovieCard movie={movie} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-16 bg-gray-800/50 rounded-2xl backdrop-blur-sm border border-gray-700/50'>
                  <div className='w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6'>
                    <Heart className='h-10 w-10 text-red-500' />
                  </div>
                  <h3 className='text-2xl font-semibold text-white mb-4'>
                    No Favorites Yet
                  </h3>
                  <p className='text-gray-400 mb-6 max-w-md mx-auto'>
                    Start building your collection by clicking the heart icon on
                    movies you love
                  </p>
                  <Link to='/search'>
                    <Button className='bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105'>
                      <Search className='h-4 w-4 mr-2' />
                      Discover Movies
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* Watchlists Section */}
          <section className='mb-12'>
            <div className='bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-3xl p-8 border border-blue-500/20 backdrop-blur-sm'>
              <div className='flex items-center justify-between mb-8'>
                <div className='flex items-center space-x-3'>
                  <div className='p-2 bg-blue-600/20 rounded-xl backdrop-blur-sm'>
                    <List className='h-7 w-7 text-blue-500' />
                  </div>
                  <div>
                    <h2 className='text-2xl md:text-3xl font-bold text-white'>
                      My Watchlists
                    </h2>
                    <p className='text-gray-300 text-sm'>
                      Organize your movies by mood or genre
                    </p>
                  </div>
                  <div className='bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm px-3 py-1 rounded-full font-semibold'>
                    {watchlists.length}
                  </div>
                </div>
              </div>

              {/* Create Watchlist Form */}
              <div className='bg-gray-800/50 rounded-2xl p-6 mb-8 backdrop-blur-sm border border-gray-700/50'>
                <h3 className='text-lg font-semibold text-white mb-4 flex items-center'>
                  <Plus className='h-5 w-5 text-blue-500 mr-2' />
                  Create New Watchlist
                </h3>
                <form
                  onSubmit={handleCreateWatchlist}
                  className='flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4'
                >
                  <input
                    type='text'
                    placeholder='Watchlist name (e.g., "Action Movies", "Date Night")'
                    value={newWatchlistName}
                    onChange={(e) => setNewWatchlistName(e.target.value)}
                    className='flex-1 p-3 rounded-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                    required
                  />
                  <input
                    type='text'
                    placeholder='Description (optional)'
                    value={newWatchlistDesc}
                    onChange={(e) => setNewWatchlistDesc(e.target.value)}
                    className='flex-1 p-3 rounded-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                  />
                  <Button
                    type='submit'
                    className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105'
                    disabled={creating}
                  >
                    {creating ? "Creating..." : "Create Watchlist"}
                  </Button>
                </form>
              </div>
              {/* Watchlists Display */}
              {watchlists.length === 0 ? (
                <div className='text-center py-16 bg-gray-800/50 rounded-2xl backdrop-blur-sm border border-gray-700/50'>
                  <div className='w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6'>
                    <List className='h-10 w-10 text-blue-500' />
                  </div>
                  <h3 className='text-2xl font-semibold text-white mb-4'>
                    No Watchlists Yet
                  </h3>
                  <p className='text-gray-400 mb-6 max-w-md mx-auto'>
                    Create your first watchlist to organize movies by genre,
                    mood, or any theme you like
                  </p>
                </div>
              ) : (
                <div className='space-y-8'>
                  {watchlists.map((watchlist, index) => (
                    <div
                      key={watchlist._id}
                      className='bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300'
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className='flex items-center justify-between mb-6'>
                        <div className='flex-1'>
                          {renamingId === watchlist._id ? (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleRenameWatchlist(watchlist._id);
                              }}
                              className='flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3'
                            >
                              <input
                                type='text'
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                className='flex-1 p-3 rounded-xl bg-gray-700/50 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                                placeholder='Watchlist name'
                              />
                              <div className='flex space-x-2'>
                                <Button
                                  type='submit'
                                  size='sm'
                                  className='bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-all duration-200'
                                >
                                  Save
                                </Button>
                                <Button
                                  type='button'
                                  size='sm'
                                  variant='outline'
                                  className='border-gray-600 text-gray-300 hover:bg-gray-700 px-4 py-2 rounded-lg transition-all duration-200'
                                  onClick={() => setRenamingId(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          ) : (
                            <div className='flex items-center justify-between'>
                              <div>
                                <h4 className='text-2xl font-bold text-white mb-2 flex items-center'>
                                  {watchlist.name}
                                  <span className='ml-3 bg-blue-600 text-white text-xs px-2 py-1 rounded-full'>
                                    {watchlist.movies.length} movies
                                  </span>
                                </h4>
                                {watchlist.description && (
                                  <p className='text-gray-400 text-sm mb-3'>
                                    {watchlist.description}
                                  </p>
                                )}
                              </div>
                              <div className='flex space-x-2'>
                                <Button
                                  size='sm'
                                  variant='outline'
                                  className='border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white p-2 rounded-lg transition-all duration-200'
                                  onClick={() => {
                                    setRenamingId(watchlist._id);
                                    setRenameValue(watchlist.name);
                                  }}
                                >
                                  <Edit3 className='h-4 w-4' />
                                </Button>
                                <Button
                                  size='sm'
                                  variant='outline'
                                  className='border-red-600 text-red-400 hover:bg-red-600 hover:text-white p-2 rounded-lg transition-all duration-200'
                                  onClick={() =>
                                    handleDeleteWatchlist(watchlist._id)
                                  }
                                >
                                  <Trash2 className='h-4 w-4' />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {watchlist.movies.length === 0 ? (
                        <div className='text-center py-12 bg-gray-700/30 rounded-xl'>
                          <List className='h-12 w-12 text-gray-500 mx-auto mb-4' />
                          <p className='text-gray-400'>
                            No movies in this watchlist yet.
                          </p>
                        </div>
                      ) : (
                        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6'>
                          {watchlist.movies.map((m) => {
                            const movie = watchlistMovies[m.movieId];
                            return movie ? (
                              <div key={m.movieId} className='relative group'>
                                <div className='transform hover:scale-105 transition-all duration-300'>
                                  <MovieCard movie={movie} />
                                </div>
                                <div className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col space-y-1 z-10'>
                                  <Button
                                    size='sm'
                                    variant='outline'
                                    className='text-xs border-gray-600 bg-gray-900/80 backdrop-blur-sm text-gray-300 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-200 p-1'
                                    onClick={() =>
                                      removeMovieFromWatchlist(
                                        watchlist._id,
                                        m.movieId
                                      )
                                    }
                                  >
                                    <Trash2 className='h-3 w-3' />
                                  </Button>
                                  <Button
                                    size='sm'
                                    variant='outline'
                                    className='text-xs border-gray-600 bg-gray-900/80 backdrop-blur-sm text-gray-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-200 p-1'
                                    onClick={() =>
                                      setMovingMovie({
                                        movieId: m.movieId,
                                        fromId: watchlist._id,
                                      })
                                    }
                                  >
                                    <Move className='h-3 w-3' />
                                  </Button>
                                  {movingMovie &&
                                    movingMovie.movieId === m.movieId &&
                                    movingMovie.fromId === watchlist._id && (
                                      <select
                                        className='mt-1 p-2 rounded-lg bg-gray-700/90 backdrop-blur-sm border border-gray-600 text-white text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                                        onChange={(e) =>
                                          handleMoveMovie(
                                            m.movieId,
                                            watchlist._id,
                                            e.target.value
                                          )
                                        }
                                        defaultValue=''
                                      >
                                        <option value='' disabled>
                                          Move to...
                                        </option>
                                        {watchlists
                                          .filter(
                                            (w) => w._id !== watchlist._id
                                          )
                                          .map((w) => (
                                            <option key={w._id} value={w._id}>
                                              {w.name}
                                            </option>
                                          ))}
                                      </select>
                                    )}
                                </div>
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default Favorites;
