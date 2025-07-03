import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import MovieCard from "@/components/MovieCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search as SearchIcon, Filter, X } from "lucide-react";
import { Movie } from "@/contexts/MovieContext";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [sortBy, setSortBy] = useState("popularity");
  const [yearFilter, setYearFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);

  const apiKey = import.meta.env.VITE_TMDB_API_KEY;

  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/movies/genres/list");
        const data = await res.json();
        setGenres(data.genres || []);
      } catch (err) {
        setGenres([]);
      }
    };
    fetchGenres();
  }, []);

  const performSearch = async (query: string) => {
    setIsLoading(true);
    try {
      // Build TMDB search URL
      const params = new URLSearchParams();
      params.append("api_key", apiKey);
      params.append("query", query);
      if (yearFilter) params.append("year", yearFilter);
      if (genreFilter) params.append("with_genres", genreFilter);
      // TMDB does not support sort_by or rating on search endpoint

      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?${params.toString()}`
      );
      if (!response.ok) throw new Error("TMDB API request failed");
      const data = await response.json();
      let movies = data.results || [];

      // Filter by rating client-side if needed
      if (ratingFilter) {
        const minRating = Number(ratingFilter);
        movies = movies.filter((movie) => movie.vote_average >= minRating);
      }

      // Sort client-side if needed
      if (sortBy === "popularity") {
        movies.sort((a, b) => b.popularity - a.popularity);
      } else if (sortBy === "rating") {
        movies.sort((a, b) => b.vote_average - a.vote_average);
      } else if (sortBy === "release_date") {
        movies.sort((a, b) =>
          (b.release_date || "").localeCompare(a.release_date || "")
        );
      } else if (sortBy === "title") {
        movies.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      }

      setResults(movies);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
      performSearch(searchQuery.trim());
    }
  };

  const clearFilters = () => {
    setSortBy("popularity");
    setYearFilter("");
    setRatingFilter("");
    setGenreFilter("");
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <Layout>
      <div className='bg-gray-900 min-h-screen'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          {/* Search Header */}
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-white mb-6'>
              Search Movies
            </h1>

            {/* Search Form */}
            <form onSubmit={handleSearch} className='mb-6'>
              <div className='flex flex-col sm:flex-row gap-4'>
                <div className='flex-1'>
                  <Input
                    type='text'
                    placeholder='Search for movies...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='bg-gray-800 border-gray-700 text-white placeholder-gray-400 text-lg py-3'
                  />
                </div>
                <Button
                  type='submit'
                  className='bg-red-600 hover:bg-red-700 px-8'
                  disabled={isLoading}
                >
                  <SearchIcon className='h-5 w-5 mr-2' />
                  {isLoading ? "Searching..." : "Search"}
                </Button>
              </div>
            </form>

            {/* Filters Toggle */}
            <div className='flex items-center justify-between'>
              <Button
                variant='outline'
                onClick={() => setShowFilters(!showFilters)}
                className='border-gray-700 text-gray-300 hover:bg-gray-800'
              >
                <Filter className='h-4 w-4 mr-2' />
                Filters
              </Button>

              {searchQuery && (
                <p className='text-gray-400'>
                  {isLoading
                    ? "Searching..."
                    : `Found ${results.length} results for "${searchQuery}"`}
                </p>
              )}
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className='mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700'>
                <div className='flex flex-col sm:flex-row gap-4'>
                  <div className='flex-1'>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      Sort By
                    </label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className='bg-gray-700 border-gray-600 text-white'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className='bg-gray-700 border-gray-600'>
                        <SelectItem value='popularity'>Popularity</SelectItem>
                        <SelectItem value='rating'>Rating</SelectItem>
                        <SelectItem value='release_date'>
                          Release Date
                        </SelectItem>
                        <SelectItem value='title'>Title</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='flex-1'>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      Year
                    </label>
                    <Select
                      value={yearFilter === "" ? "any" : yearFilter}
                      onValueChange={(v) => setYearFilter(v === "any" ? "" : v)}
                    >
                      <SelectTrigger className='bg-gray-700 border-gray-600 text-white'>
                        <SelectValue placeholder='Any year' />
                      </SelectTrigger>
                      <SelectContent className='bg-gray-700 border-gray-600'>
                        <SelectItem value='any'>Any year</SelectItem>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='flex-1'>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      Rating
                    </label>
                    <Select
                      value={ratingFilter === "" ? "any" : ratingFilter}
                      onValueChange={(v) =>
                        setRatingFilter(v === "any" ? "" : v)
                      }
                    >
                      <SelectTrigger className='bg-gray-700 border-gray-600 text-white'>
                        <SelectValue placeholder='Any rating' />
                      </SelectTrigger>
                      <SelectContent className='bg-gray-700 border-gray-600'>
                        <SelectItem value='any'>Any rating</SelectItem>
                        <SelectItem value='9'>9+ Stars</SelectItem>
                        <SelectItem value='8'>8+ Stars</SelectItem>
                        <SelectItem value='7'>7+ Stars</SelectItem>
                        <SelectItem value='6'>6+ Stars</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='flex-1'>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      Genre
                    </label>
                    <Select
                      value={genreFilter === "" ? "any" : genreFilter}
                      onValueChange={(v) =>
                        setGenreFilter(v === "any" ? "" : v)
                      }
                    >
                      <SelectTrigger className='bg-gray-700 border-gray-600 text-white'>
                        <SelectValue placeholder='Any genre' />
                      </SelectTrigger>
                      <SelectContent className='bg-gray-700 border-gray-600'>
                        <SelectItem value='any'>Any genre</SelectItem>
                        {genres.map((genre) => (
                          <SelectItem
                            key={genre.id}
                            value={genre.id.toString()}
                          >
                            {genre.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='flex items-end'>
                    <Button
                      variant='outline'
                      onClick={clearFilters}
                      className='border-gray-700 text-gray-300 hover:bg-gray-700'
                    >
                      <X className='h-4 w-4 mr-2' />
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          <div className='space-y-6'>
            {isLoading ? (
              <div className='text-center py-12'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto'></div>
                <p className='text-gray-400 mt-4'>Searching for movies...</p>
              </div>
            ) : results.length > 0 ? (
              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6'>
                {results.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            ) : searchQuery ? (
              <div className='text-center py-12'>
                <SearchIcon className='h-16 w-16 text-gray-600 mx-auto mb-4' />
                <h3 className='text-xl font-medium text-white mb-2'>
                  No results found
                </h3>
                <p className='text-gray-400'>
                  Try adjusting your search terms or filters
                </p>
              </div>
            ) : (
              <div className='text-center py-12'>
                <SearchIcon className='h-16 w-16 text-gray-600 mx-auto mb-4' />
                <h3 className='text-xl font-medium text-white mb-2'>
                  Start your search
                </h3>
                <p className='text-gray-400'>
                  Enter a movie title or keyword to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Search;
