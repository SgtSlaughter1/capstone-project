import React, { createContext, useContext, useState, ReactNode } from "react";
import { api } from "@/lib/utils";

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  adult: boolean;
  video: boolean;
  original_language: string;
  original_title: string;
}

export interface Watchlist {
  _id: string;
  name: string;
  description?: string;
  movies: { movieId: number; addedAt: string }[];
}

interface MovieContextType {
  favorites: Movie[];
  watchlists: Watchlist[];
  fetchWatchlists: () => Promise<void>;
  createWatchlist: (name: string, description?: string) => Promise<void>;
  deleteWatchlist: (id: string) => Promise<void>;
  addMovieToWatchlist: (watchlistId: string, movieId: number) => Promise<void>;
  removeMovieFromWatchlist: (
    watchlistId: string,
    movieId: number
  ) => Promise<void>;
  addToFavorites: (movie: Movie) => void;
  removeFromFavorites: (movieId: number) => void;
  addToWatchlist: (movie: Movie) => void;
  removeFromWatchlist: (movieId: number) => void;
  isFavorite: (movieId: number) => boolean;
  isInWatchlist: (movieId: number) => boolean;
  fetchFavorites: () => Promise<void>;
}

const MovieContext = createContext<MovieContextType | undefined>(undefined);

export const useMovies = () => {
  const context = useContext(MovieContext);
  if (!context) {
    throw new Error("useMovies must be used within a MovieProvider");
  }
  return context;
};

interface MovieProviderProps {
  children: ReactNode;
}

export const MovieProvider: React.FC<MovieProviderProps> = ({ children }) => {
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);

  const fetchWatchlists = async () => {
    const res = await api.get("/users/watchlists");
    setWatchlists(res.data);
  };

  const createWatchlist = async (name: string, description?: string) => {
    const res = await api.post("/users/watchlists", { name, description });
    setWatchlists((prev) => [res.data, ...prev]);
  };

  const deleteWatchlist = async (id: string) => {
    await api.delete(`/users/watchlists/${id}`);
    setWatchlists((prev) => prev.filter((w) => w._id !== id));
  };

  const addMovieToWatchlist = async (watchlistId: string, movieId: number) => {
    const res = await api.post(`/users/watchlists/${watchlistId}/movies`, {
      movieId,
    });
    setWatchlists((prev) =>
      prev.map((w) => (w._id === watchlistId ? res.data : w))
    );
  };

  const removeMovieFromWatchlist = async (
    watchlistId: string,
    movieId: number
  ) => {
    const res = await api.delete(
      `/users/watchlists/${watchlistId}/movies/${movieId}`
    );
    setWatchlists((prev) =>
      prev.map((w) => (w._id === watchlistId ? res.data : w))
    );
  };

  const fetchFavorites = async () => {
    const res = await api.get("/users/favorites");
    const favoriteMovies: Movie[] = [];
    for (const fav of res.data) {
      try {
        const tmdbRes = await fetch(
          `https://api.themoviedb.org/3/movie/${fav.movieId}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US`
        );
        if (tmdbRes.ok) {
          const movie = await tmdbRes.json();
          favoriteMovies.push(movie);
        }
      } catch {}
    }
    setFavorites(favoriteMovies);
  };

  const addToFavorites = async (movie: Movie) => {
    await api.post("/users/favorites", { movieId: movie.id });
    setFavorites((prev) => [...prev.filter((m) => m.id !== movie.id), movie]);
  };

  const removeFromFavorites = async (movieId: number) => {
    await api.delete(`/users/favorites/${movieId}`);
    setFavorites((prev) => prev.filter((m) => m.id !== movieId));
  };

  const addToWatchlist = async (movie: Movie) => {
    // Find the default watchlist
    const defaultWatchlist = watchlists.find((w) => w.name === "My Watchlist");
    if (!defaultWatchlist) return;
    await addMovieToWatchlist(defaultWatchlist._id, movie.id);
  };

  const removeFromWatchlist = async (movieId: number) => {
    // Find the default watchlist
    const defaultWatchlist = watchlists.find((w) => w.name === "My Watchlist");
    if (!defaultWatchlist) return;
    await removeMovieFromWatchlist(defaultWatchlist._id, movieId);
  };

  const isFavorite = (movieId: number) => {
    return favorites.some((m) => m.id === movieId);
  };

  const isInWatchlist = (movieId: number) => {
    return watchlists.some((w) => w.movies.some((m) => m.movieId === movieId));
  };

  return (
    <MovieContext.Provider
      value={{
        favorites,
        watchlists,
        fetchWatchlists,
        createWatchlist,
        deleteWatchlist,
        addMovieToWatchlist,
        removeMovieFromWatchlist,
        addToFavorites,
        removeFromFavorites,
        addToWatchlist,
        removeFromWatchlist,
        isFavorite,
        isInWatchlist,
        fetchFavorites,
      }}
    >
      {children}
    </MovieContext.Provider>
  );
};
