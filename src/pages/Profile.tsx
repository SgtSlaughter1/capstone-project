import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useMovies } from "@/contexts/MovieContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User,
  Heart,
  Plus,
  Star,
  Calendar,
  Edit,
  Users,
  UserPlus,
  Activity,
  Settings,
  TrendingUp,
  Eye,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";

const Profile = () => {
  const { user: currentUser, isAuthenticated, updateProfile } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const viewingOwnProfile = !userId || userId === currentUser?.id;
  const [user, setUser] = useState(currentUser);
  const { favorites, watchlists } = useMovies();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    username: user?.username || "",
    avatar_url: user?.avatar_url || "",
    preferences: user?.preferences || {},
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [allGenres, setAllGenres] = useState<{ id: number; name: string }[]>(
    []
  );
  const [avatarPreview, setAvatarPreview] = useState<string>(
    form.avatar_url || ""
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);

  const handleEditClick = () => setEditing(true);
  const handleCancel = () => {
    setEditing(false);
    setForm({
      username: user?.username || "",
      avatar_url: user?.avatar_url || "",
      preferences: user?.preferences || {},
    });
    setError("");
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await updateProfile(form);
      setEditing(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    // Fetch genres from TMDB API
    const fetchGenres = async () => {
      try {
        const apiKey = import.meta.env.VITE_TMDB_API_KEY;
        const res = await fetch(
          `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=en-US`
        );
        const data = await res.json();
        setAllGenres(data.genres || []);
      } catch {
        /* ignore error */
      }
    };
    fetchGenres();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (viewingOwnProfile) {
        setUser(currentUser);
      } else {
        const res = await axios.get(`/api/users/${userId}`);
        setUser(res.data);
      }
    };
    const fetchSocial = async () => {
      const id = viewingOwnProfile ? currentUser.id : userId;
      const [followersRes, followingRes] = await Promise.all([
        axios.get(`/api/users/${id}/followers`),
        axios.get(`/api/users/${id}/following`),
      ]);
      setFollowers(followersRes.data.followers);
      setFollowing(followingRes.data.following);
      if (!viewingOwnProfile) {
        // Check if current user is following this user
        setIsFollowing(
          Array.isArray(followersRes.data.followers) &&
            followersRes.data.followers.some(
              (f: { _id: string }) => f._id === currentUser.id
            )
        );
      }
    };
    if (isAuthenticated && currentUser) {
      fetchProfile();
      fetchSocial();
    }
  }, [userId, isAuthenticated, currentUser, viewingOwnProfile]);

  const handleGenreToggle = (genreId: number) => {
    setForm((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        favoriteGenres: prev.preferences.favoriteGenres?.includes(genreId)
          ? prev.preferences.favoriteGenres.filter(
              (id: number) => id !== genreId
            )
          : [...(prev.preferences.favoriteGenres || []), genreId],
      },
    }));
  };

  const defaultWatchlist = watchlists.find((w) => w.name === "My Watchlist");
  const watchlistCount = defaultWatchlist ? defaultWatchlist.movies.length : 0;

  const handleAvatarFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      // Upload to backend
      const formData = new FormData();
      formData.append("avatar", file);
      try {
        const token = localStorage.getItem("auth_token");
        const res = await axios.post(
          "http://localhost:5000/api/users/avatar",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        setForm((prev) => ({ ...prev, avatar_url: res.data.avatar_url }));
      } catch (err) {
        // Optionally handle error
      }
    }
  };

  const handleFollowToggle = async () => {
    if (!user) return;
    const res = await axios.post(`/api/users/${user.id}/follow`);
    setIsFollowing(res.data.following);
    // Refetch followers
    const followersRes = await axios.get(`/api/users/${user.id}/followers`);
    setFollowers(followersRes.data.followers);
  };

  if (!isAuthenticated || !user) {
    return (
      <Layout>
        <div className='bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen flex items-center justify-center'>
          <div className='text-center py-20'>
            <div className='relative mb-8'>
              <div className='w-32 h-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl'>
                <User className='h-16 w-16 text-white' />
              </div>
              <div className='absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full animate-pulse'></div>
            </div>
            <h2 className='text-4xl md:text-5xl font-bold text-white mb-6'>
              Access Your <span className='text-blue-500'>Profile</span>
            </h2>
            <p className='text-gray-300 mb-8 max-w-2xl mx-auto text-lg leading-relaxed'>
              Please login to view your profile, manage your collection, and
              track your movie journey
            </p>
            <Link to='/login'>
              <Button className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105'>
                Login to Continue
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const joinDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  const stats = [
    {
      icon: Heart,
      label: "Favorites",
      value: favorites.length,
      color: "from-red-500 to-pink-500",
      bgColor: "from-red-500/10 to-pink-500/10",
      iconColor: "text-red-500",
    },
    {
      icon: Plus,
      label: "Watchlist",
      value: watchlistCount,
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-500/10 to-cyan-500/10",
      iconColor: "text-blue-500",
    },
    {
      icon: Star,
      label: "Reviews",
      value: 0,
      color: "from-yellow-500 to-orange-500",
      bgColor: "from-yellow-500/10 to-orange-500/10",
      iconColor: "text-yellow-500",
    },
  ];

  return (
    <Layout>
      <div className='bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen'>
        {/* Hero Section */}
        <div className='relative overflow-hidden'>
          <div className='absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20'></div>
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.15)_0%,_transparent_50%)]'></div>
          <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
            {/* Profile Header */}
            <div className='bg-gray-800/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/50 mb-8'>
              <div className='flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8'>
                <div className='relative'>
                  <Avatar className='h-32 w-32 bg-gradient-to-r from-blue-600 to-purple-600 ring-4 ring-blue-500/30'>
                    <AvatarFallback className='text-white text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600'>
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className='absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-gray-800 flex items-center justify-center'>
                    <div className='w-3 h-3 bg-white rounded-full'></div>
                  </div>
                </div>

                <div className='flex-1 text-center lg:text-left'>
                  <h1 className='text-4xl md:text-5xl font-bold text-white mb-4'>
                    {user.username}
                  </h1>
                  <p className='text-gray-300 text-lg mb-6 max-w-2xl'>
                    {user.email}
                  </p>

                  <div className='flex flex-wrap justify-center lg:justify-start items-center gap-6 mb-6'>
                    <div className='flex items-center space-x-2'>
                      <Users className='h-5 w-5 text-blue-400' />
                      <span className='text-white font-semibold'>
                        {(followers || []).length}
                      </span>
                      <span className='text-gray-400'>Followers</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <UserPlus className='h-5 w-5 text-green-400' />
                      <span className='text-white font-semibold'>
                        {(following || []).length}
                      </span>
                      <span className='text-gray-400'>Following</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Calendar className='h-5 w-5 text-purple-400' />
                      <span className='text-gray-400'>
                        Member since {joinDate}
                      </span>
                    </div>
                  </div>

                  <div className='flex flex-wrap justify-center lg:justify-start gap-4'>
                    {viewingOwnProfile ? (
                      <Button
                        className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105'
                        onClick={handleEditClick}
                      >
                        <Edit className='h-4 w-4 mr-2' />
                        Edit Profile
                      </Button>
                    ) : (
                      <Button
                        className={`px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 ${
                          isFollowing
                            ? "bg-gray-700 hover:bg-gray-600 text-white border border-gray-600"
                            : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        }`}
                        onClick={handleFollowToggle}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </Button>
                    )}
                    <Button
                      variant='outline'
                      className='border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white backdrop-blur-sm px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105'
                    >
                      <Eye className='h-4 w-4 mr-2' />
                      View Activity
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12'>
          {/* Stats Section */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-12'>
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className={`bg-gradient-to-r ${stat.bgColor} rounded-2xl p-6 border border-gray-700/50 backdrop-blur-sm hover:scale-105 transition-all duration-300`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-3xl font-bold text-white mb-2'>
                        {stat.value}
                      </p>
                      <p className='text-gray-300 font-medium'>{stat.label}</p>
                    </div>
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} bg-opacity-20`}
                    >
                      <Icon className={`h-8 w-8 ${stat.iconColor}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Activity */}
          <div className='bg-gray-800/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/50 mb-8'>
            <div className='flex items-center space-x-3 mb-6'>
              <div className='p-2 bg-green-600/20 rounded-xl'>
                <Activity className='h-6 w-6 text-green-500' />
              </div>
              <div>
                <h2 className='text-2xl md:text-3xl font-bold text-white'>
                  Recent Activity
                </h2>
                <p className='text-gray-400'>Your latest movie interactions</p>
              </div>
            </div>

            <div className='space-y-4'>
              {favorites.slice(0, 3).map((movie, index) => (
                <div
                  key={movie.id}
                  className='flex items-center space-x-4 p-4 bg-gray-700/50 rounded-2xl hover:bg-gray-700/70 transition-all duration-200 transform hover:scale-[1.02]'
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className='relative'>
                    <img
                      src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                      alt={movie.title}
                      className='w-16 h-20 object-cover rounded-lg shadow-lg'
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder.svg";
                      }}
                    />
                    <div className='absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center'>
                      <Heart className='h-3 w-3 text-white fill-white' />
                    </div>
                  </div>
                  <div className='flex-1'>
                    <h4 className='text-white font-semibold text-lg mb-1'>
                      {movie.title}
                    </h4>
                    <p className='text-gray-400 text-sm mb-2'>
                      Added to favorites
                    </p>
                    <div className='flex items-center space-x-2'>
                      <Star className='h-4 w-4 text-yellow-400 fill-yellow-400' />
                      <span className='text-yellow-400 font-medium'>
                        {movie.vote_average.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className='text-gray-500 text-sm'>
                    <TrendingUp className='h-4 w-4' />
                  </div>
                </div>
              ))}

              {favorites.length === 0 && (
                <div className='text-center py-12'>
                  <div className='w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <Activity className='h-10 w-10 text-gray-500' />
                  </div>
                  <h3 className='text-xl font-semibold text-white mb-2'>
                    No Activity Yet
                  </h3>
                  <p className='text-gray-400 mb-4'>
                    Start exploring movies to see your activity here
                  </p>
                  <Link to='/search'>
                    <Button className='bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105'>
                      Discover Movies
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className='bg-gray-800/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/50'>
            <div className='flex items-center space-x-3 mb-6'>
              <div className='p-2 bg-purple-600/20 rounded-xl'>
                <Settings className='h-6 w-6 text-purple-500' />
              </div>
              <div>
                <h2 className='text-2xl md:text-3xl font-bold text-white'>
                  Quick Actions
                </h2>
                <p className='text-gray-400'>
                  Shortcuts to your favorite features
                </p>
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              <Link to='/favorites'>
                <Button className='w-full h-16 bg-gradient-to-r from-red-600/20 to-pink-600/20 hover:from-red-600/30 hover:to-pink-600/30 border border-red-500/30 text-white backdrop-blur-sm rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg'>
                  <Heart className='h-5 w-5 mr-3 text-red-500' />
                  <div className='text-left'>
                    <p className='font-semibold'>View Favorites</p>
                    <p className='text-sm text-gray-400'>
                      {favorites.length} movies
                    </p>
                  </div>
                </Button>
              </Link>

              <Link to='/search'>
                <Button className='w-full h-16 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30 border border-blue-500/30 text-white backdrop-blur-sm rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg'>
                  <Plus className='h-5 w-5 mr-3 text-blue-500' />
                  <div className='text-left'>
                    <p className='font-semibold'>Discover Movies</p>
                    <p className='text-sm text-gray-400'>Find new favorites</p>
                  </div>
                </Button>
              </Link>

              <Button className='w-full h-16 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 hover:from-yellow-600/30 hover:to-orange-600/30 border border-yellow-500/30 text-white backdrop-blur-sm rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg'>
                <Star className='h-5 w-5 mr-3 text-yellow-500' />
                <div className='text-left'>
                  <p className='font-semibold'>Rate Movies</p>
                  <p className='text-sm text-gray-400'>Share your thoughts</p>
                </div>
              </Button>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {editing && (
          <div className='fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
            <div className='bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
              <div className='p-8'>
                <div className='flex items-center space-x-3 mb-6'>
                  <div className='p-2 bg-blue-600/20 rounded-xl'>
                    <Edit className='h-6 w-6 text-blue-500' />
                  </div>
                  <h2 className='text-3xl font-bold text-white'>
                    Edit Profile
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className='space-y-6'>
                  <div className='flex flex-col items-center space-y-4'>
                    <div className='relative'>
                      <img
                        src={avatarPreview || "/placeholder.svg"}
                        alt='Avatar Preview'
                        className='w-24 h-24 rounded-full object-cover border-4 border-blue-500/30 shadow-lg'
                      />
                      <div className='absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors'>
                        <Edit className='h-4 w-4 text-white' />
                      </div>
                    </div>
                    <div className='text-center'>
                      <label className='cursor-pointer bg-gray-700/50 hover:bg-gray-700 text-white px-4 py-2 rounded-xl transition-all duration-200 transform hover:scale-105'>
                        <input
                          type='file'
                          accept='image/*'
                          onChange={handleAvatarFileChange}
                          className='hidden'
                        />
                        Choose Photo
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className='block text-gray-300 mb-2 font-medium'>
                      Username
                    </label>
                    <input
                      type='text'
                      name='username'
                      value={form.username}
                      onChange={handleChange}
                      className='w-full p-4 rounded-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                      placeholder='Enter your username'
                      required
                    />
                  </div>

                  <div>
                    <label className='block text-gray-300 mb-3 font-medium'>
                      Favorite Genres
                    </label>
                    <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                      {allGenres.map((genre) => (
                        <button
                          type='button'
                          key={genre.id}
                          className={`p-3 rounded-xl border text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                            form.preferences.favoriteGenres?.includes(genre.id)
                              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-blue-500 shadow-lg"
                              : "bg-gray-700/50 text-gray-300 border-gray-600 hover:bg-gray-700"
                          }`}
                          onClick={() => handleGenreToggle(genre.id)}
                        >
                          {genre.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className='bg-red-500/20 border border-red-500/30 rounded-xl p-4'>
                      <p className='text-red-400 text-sm'>{error}</p>
                    </div>
                  )}

                  <div className='flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4'>
                    <Button
                      type='button'
                      variant='outline'
                      className='border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white px-6 py-3 rounded-xl transition-all duration-200'
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      type='submit'
                      className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105'
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Profile;
