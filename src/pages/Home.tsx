import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import MovieCard from "@/components/MovieCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, Star, Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Movie } from "@/contexts/MovieContext";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/utils";

const apiKey = import.meta.env.VITE_TMDB_API_KEY;

const fetchTrendingMovies = async () => {
  const res = await fetch(
    `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}`
  );
  const data = await res.json();
  return data.results;
};

const fetchTopRatedMovies = async () => {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/top_rated?api_key=${apiKey}`
  );
  const data = await res.json();
  return data.results;
};

const fetchRecentMovies = async () => {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}`
  );
  const data = await res.json();
  return data.results;
};

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { isAuthenticated } = useAuth();
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Replace mock queries with real API calls
  const { data: trendingMovies = [] } = useQuery({
    queryKey: ["trending"],
    queryFn: fetchTrendingMovies,
  });

  const { data: topRatedMovies = [] } = useQuery({
    queryKey: ["topRated"],
    queryFn: fetchTopRatedMovies,
  });

  const { data: recentMovies = [] } = useQuery({
    queryKey: ["recent"],
    queryFn: fetchRecentMovies,
  });

  const featuredMovie = trendingMovies[0];

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!isAuthenticated) return;
      setLoadingRecs(true);
      try {
        const res = await api.get("/movies/recommendations/personalized");
        setRecommendations(res.data.results || []);
      } catch {
        setRecommendations([]);
      } finally {
        setLoadingRecs(false);
      }
    };
    fetchRecommendations();
  }, [isAuthenticated]);

  const handleNotInterested = async (movieId: number) => {
    // Optionally, call an endpoint to mark as ignored (not implemented here)
    setRecommendations((prev) => prev.filter((m) => m.id !== movieId));
  };

  const handleWhyThis = (movie: Movie) => {
    // Show a modal or alert explaining the recommendation (simple version)
    alert(`Recommended because of your ratings, favorites, or similar genres.`);
  };

  return (
    <Layout>
      <div className='relative'>
        {/* Hero Section */}
        {featuredMovie ? (
          <section className='relative h-[70vh] md:h-[80vh] lg:h-[85vh] overflow-hidden'>
            <div className='absolute inset-0'>
              <img
                src={`https://image.tmdb.org/t/p/original${featuredMovie.backdrop_path}`}
                alt={featuredMovie.title}
                className='w-full h-full object-cover scale-105 transition-transform duration-700 hover:scale-110'
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder.svg";
                }}
              />
              <div className='absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent' />
              <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent' />
            </div>

            <div className='relative z-10 h-full flex items-center'>
              <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full'>
                <div className='max-w-3xl'>
                  <div className='mb-4'>
                    <span className='inline-block px-3 py-1 bg-red-600/20 border border-red-600 rounded-full text-red-400 text-sm font-medium backdrop-blur-sm'>
                      Featured Movie
                    </span>
                  </div>
                  <h1 className='text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight'>
                    {featuredMovie.title}
                  </h1>
                  <p className='text-lg md:text-xl text-gray-200 mb-8 line-clamp-3 leading-relaxed'>
                    {featuredMovie.overview}
                  </p>
                  <div className='flex items-center space-x-6 mb-8'>
                    <div className='flex items-center space-x-2 bg-black/40 px-3 py-2 rounded-full backdrop-blur-sm'>
                      <Star className='h-5 w-5 text-yellow-400 fill-yellow-400' />
                      <span className='text-white font-semibold'>
                        {featuredMovie.vote_average.toFixed(1)}
                      </span>
                      <span className='text-gray-300 text-sm'>/10</span>
                    </div>
                    <div className='flex items-center space-x-2 bg-black/40 px-3 py-2 rounded-full backdrop-blur-sm'>
                      <Calendar className='h-5 w-5 text-blue-400' />
                      <span className='text-white font-semibold'>
                        {new Date(featuredMovie.release_date).getFullYear()}
                      </span>
                    </div>
                  </div>
                  <div className='flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4'>
                    <Link to={`/movie/${featuredMovie.id}`}>
                      <Button
                        size='lg'
                        className='bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 w-full sm:w-auto'
                      >
                        <span className='mr-2'>▶</span>
                        Watch Now
                      </Button>
                    </Link>
                    <Link to={`/movie/${featuredMovie.id}`}>
                      <Button
                        size='lg'
                        variant='outline'
                        className='border-2 border-white/70 text-white hover:bg-white hover:text-black backdrop-blur-sm px-8 py-3 text-lg font-semibold transition-all duration-200 transform hover:scale-105 w-full sm:w-auto'
                      >
                        More Info
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className='relative h-[70vh] md:h-[80vh] lg:h-[85vh] flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto mb-4'></div>
              <span className='text-white text-xl font-medium'>
                Loading featured movie...
              </span>
            </div>
          </section>
        )}

        {/* Search Section */}
        <section className='py-16 bg-gradient-to-b from-gray-900 to-gray-800 relative'>
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(239,68,68,0.1)_0%,_transparent_70%)]'></div>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
            <div className='text-center mb-12'>
              <h2 className='text-3xl md:text-4xl font-bold text-white mb-6'>
                Discover Your Next
                <span className='text-red-500 ml-2'>Favorite Movie</span>
              </h2>
              <p className='text-gray-300 max-w-2xl mx-auto text-lg leading-relaxed'>
                Search through thousands of movies to find exactly what you're
                looking for. Your perfect movie night starts here.
              </p>
            </div>

            <form onSubmit={handleSearch} className='max-w-2xl mx-auto'>
              <div className='relative'>
                <Input
                  type='text'
                  placeholder='Search movies, actors, directors...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-full h-14 bg-gray-800/50 backdrop-blur-sm border-gray-600 text-white placeholder-gray-400 pl-12 pr-20 rounded-xl text-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200'
                />
                <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
                <Button
                  type='submit'
                  className='absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg transition-all duration-200 hover:scale-105'
                >
                  Search
                </Button>
              </div>
            </form>
          </div>
        </section>

        {/* Movie Sections */}
        <div className='bg-gradient-to-b from-gray-800 to-gray-900 py-16'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16'>
            {/* Trending Movies */}
            <section className='group'>
              <div className='flex items-center justify-between mb-8'>
                <div className='flex items-center space-x-3'>
                  <div className='p-2 bg-red-600/20 rounded-lg backdrop-blur-sm'>
                    <TrendingUp className='h-6 w-6 text-red-500' />
                  </div>
                  <div>
                    <h2 className='text-2xl md:text-3xl font-bold text-white'>
                      Trending Now
                    </h2>
                    <p className='text-gray-400 text-sm'>
                      What everyone's watching
                    </p>
                  </div>
                </div>
                <Link to='/search?category=trending'>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200'
                  >
                    View All →
                  </Button>
                </Link>
              </div>
              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6'>
                {trendingMovies.slice(0, 12).map((movie, index) => (
                  <div
                    key={movie.id}
                    className='transform hover:scale-105 transition-all duration-200 hover:z-10'
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <MovieCard movie={movie} size='small' />
                  </div>
                ))}
              </div>
            </section>

            {/* Top Rated Movies */}
            <section className='group'>
              <div className='flex items-center justify-between mb-8'>
                <div className='flex items-center space-x-3'>
                  <div className='p-2 bg-yellow-400/20 rounded-lg backdrop-blur-sm'>
                    <Star className='h-6 w-6 text-yellow-400 fill-yellow-400' />
                  </div>
                  <div>
                    <h2 className='text-2xl md:text-3xl font-bold text-white'>
                      Top Rated
                    </h2>
                    <p className='text-gray-400 text-sm'>
                      Highest rated by critics
                    </p>
                  </div>
                </div>
                <Link to='/search?category=top_rated'>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200'
                  >
                    View All →
                  </Button>
                </Link>
              </div>
              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6'>
                {topRatedMovies.slice(0, 12).map((movie, index) => (
                  <div
                    key={movie.id}
                    className='transform hover:scale-105 transition-all duration-200 hover:z-10'
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <MovieCard movie={movie} size='small' />
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Releases */}
            <section className='group'>
              <div className='flex items-center justify-between mb-8'>
                <div className='flex items-center space-x-3'>
                  <div className='p-2 bg-blue-400/20 rounded-lg backdrop-blur-sm'>
                    <Calendar className='h-6 w-6 text-blue-400' />
                  </div>
                  <div>
                    <h2 className='text-2xl md:text-3xl font-bold text-white'>
                      Recent Releases
                    </h2>
                    <p className='text-gray-400 text-sm'>
                      Latest movies in theaters
                    </p>
                  </div>
                </div>
                <Link to='/search?category=recent'>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200'
                  >
                    View All →
                  </Button>
                </Link>
              </div>
              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6'>
                {recentMovies.slice(0, 12).map((movie, index) => (
                  <div
                    key={movie.id}
                    className='transform hover:scale-105 transition-all duration-200 hover:z-10'
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <MovieCard movie={movie} size='small' />
                  </div>
                ))}
              </div>
            </section>

            {/* Personalized Recommendations Section */}
            {isAuthenticated && (
              <section className='py-16 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 backdrop-blur-sm relative overflow-hidden'>
                <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(239,68,68,0.15)_0%,_transparent_50%)]'></div>
                <div className='absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.1)_0%,_transparent_50%)]'></div>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
                  <div className='text-center mb-12'>
                    <div className='inline-block p-3 bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl mb-4'>
                      <Star className='h-8 w-8 text-white' />
                    </div>
                    <h2 className='text-3xl md:text-4xl font-bold text-white mb-4'>
                      <span className='bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent'>
                        Recommended
                      </span>
                      <span className='text-white ml-2'>For You</span>
                    </h2>
                    <p className='text-gray-300 max-w-2xl mx-auto text-lg'>
                      Personalized movie recommendations based on your viewing
                      history and preferences
                    </p>
                  </div>
                  {loadingRecs ? (
                    <div className='text-center py-16'>
                      <div className='relative'>
                        <div className='animate-spin rounded-full h-16 w-16 border-4 border-gray-700 border-t-red-500 mx-auto mb-6'></div>
                        <div className='absolute inset-0 rounded-full bg-gradient-to-r from-red-500/20 to-pink-500/20 animate-pulse'></div>
                      </div>
                      <h3 className='text-xl font-semibold text-white mb-2'>
                        Curating Your Recommendations
                      </h3>
                      <p className='text-gray-400'>
                        Analyzing your preferences to find the perfect movies...
                      </p>
                    </div>
                  ) : recommendations.length > 0 ? (
                    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6'>
                      {recommendations.map((movie, index) => (
                        <div
                          key={movie.id}
                          className='relative group transform hover:scale-105 transition-all duration-300'
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <MovieCard movie={movie} />
                          <div className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col space-y-1 z-10'>
                            <Button
                              size='sm'
                              variant='outline'
                              className='text-xs border-gray-600 bg-gray-900/80 backdrop-blur-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200'
                              onClick={() => handleNotInterested(movie.id)}
                            >
                              Not Interested
                            </Button>
                            <Button
                              size='sm'
                              variant='outline'
                              className='text-xs border-gray-600 bg-gray-900/80 backdrop-blur-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200'
                              onClick={() => handleWhyThis(movie)}
                            >
                              Why this?
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='text-center py-16'>
                      <div className='relative mb-8'>
                        <div className='w-24 h-24 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4'>
                          <Star className='h-12 w-12 text-gray-400' />
                        </div>
                        <div className='absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-full animate-pulse'></div>
                      </div>
                      <h3 className='text-2xl font-semibold text-white mb-4'>
                        No Recommendations Yet
                      </h3>
                      <p className='text-gray-400 text-lg mb-6 max-w-md mx-auto'>
                        Rate movies, add them to your watchlist, or mark
                        favorites to get personalized recommendations
                      </p>
                      <Link to='/search'>
                        <Button className='bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105'>
                          Explore Movies
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Additional Features Section */}
        <section className='py-16 bg-gray-900 border-t border-gray-800'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='text-center mb-12'>
              <h2 className='text-3xl md:text-4xl font-bold text-white mb-4'>
                Why Choose <span className='text-red-500'>CineSeeker</span>?
              </h2>
              <p className='text-gray-400 max-w-2xl mx-auto text-lg'>
                Your ultimate destination for movie discovery and entertainment
              </p>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
              <div className='text-center p-6 bg-gray-800/50 rounded-2xl backdrop-blur-sm border border-gray-700/50 hover:border-red-500/50 transition-all duration-300 transform hover:scale-105'>
                <div className='w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <Search className='h-8 w-8 text-red-500' />
                </div>
                <h3 className='text-xl font-semibold text-white mb-2'>
                  Smart Search
                </h3>
                <p className='text-gray-400'>
                  Find movies by title, actor, director, or genre with our
                  advanced search
                </p>
              </div>
              <div className='text-center p-6 bg-gray-800/50 rounded-2xl backdrop-blur-sm border border-gray-700/50 hover:border-yellow-500/50 transition-all duration-300 transform hover:scale-105'>
                <div className='w-16 h-16 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <Star className='h-8 w-8 text-yellow-400' />
                </div>
                <h3 className='text-xl font-semibold text-white mb-2'>
                  Personalized
                </h3>
                <p className='text-gray-400'>
                  Get tailored recommendations based on your viewing history and
                  preferences
                </p>
              </div>
              <div className='text-center p-6 bg-gray-800/50 rounded-2xl backdrop-blur-sm border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 transform hover:scale-105'>
                <div className='w-16 h-16 bg-blue-400/20 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <Calendar className='h-8 w-8 text-blue-400' />
                </div>
                <h3 className='text-xl font-semibold text-white mb-2'>
                  Always Updated
                </h3>
                <p className='text-gray-400'>
                  Stay current with the latest releases and trending movies
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Home;
