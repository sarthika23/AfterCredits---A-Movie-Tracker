import { useState, useEffect } from "react";
import {
  Star,
  Film,
  Calendar,
  Search,
  Filter,
  Trash2,
  Edit3,
  Eye,
  Clock,
  Award,
  Loader2,
} from "lucide-react";

const App = () => {
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("dateAdded");
  const [filterRating, setFilterRating] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    genre: "",
    rating: "",
    review: "",
    year: "",
    watchedDate: "",
    status: "watched",
  });

  // API Base URL
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";


  // API Functions
  const fetchMovies = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_BASE}/movies`);
      if (!response.ok) throw new Error("Failed to fetch movies");
      const data = await response.json();
      setMovies(data);
    } catch (err) {
      setError("Failed to load movies: " + err.message);
      console.error("Error fetching movies:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveMovie = async (movieData) => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_BASE}/movies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(movieData),
      });
      if (!response.ok) throw new Error("Failed to save movie");
      await fetchMovies(); // Refresh the list
    } catch (err) {
      setError("Failed to save movie: " + err.message);
      console.error("Error saving movie:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteMovieAPI = async (id) => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_BASE}/movies/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete movie");
      await fetchMovies(); // Refresh the list
    } catch (err) {
      setError("Failed to delete movie: " + err.message);
      console.error("Error deleting movie:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load movies on component mount
  useEffect(() => {
    fetchMovies();
  }, []);

  // Filter and sort movies whenever dependencies change
  useEffect(() => {
    let filtered = movies.filter((movie) => {
      const matchesSearch =
        movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movie.genre.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRating =
        !filterRating || parseFloat(movie.rating) >= parseFloat(filterRating);
      return matchesSearch && matchesRating;
    });

    // Sort movies
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return parseFloat(b.rating) - parseFloat(a.rating);
        case "title":
          return a.title.localeCompare(b.title);
        case "year":
          return (b.year || 0) - (a.year || 0);
        default:
          return b.id - a.id; // Most recent first
      }
    });

    setFilteredMovies(filtered);
  }, [movies, searchTerm, sortBy, filterRating]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addOrUpdateMovie = async (e) => {
    e.preventDefault();
    if (form.title && form.rating) {
      const movieData = {
        ...form,
        id: editingId || Date.now(),
        dateAdded: editingId
          ? movies.find((m) => m.id === editingId)?.dateAdded
          : new Date().toLocaleDateString(),
      };

      await saveMovie(movieData);

      // Reset form after successful save
      if (!error) {
        setForm({
          title: "",
          genre: "",
          rating: "",
          review: "",
          year: "",
          watchedDate: "",
          status: "watched",
        });
        setEditingId(null);
      }
    }
  };

  const deleteMovie = async (id) => {
    if (window.confirm("Are you sure you want to delete this movie?")) {
      await deleteMovieAPI(id);
    }
  };

  const editMovie = (movie) => {
    setForm(movie);
    setEditingId(movie.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setForm({
      title: "",
      genre: "",
      rating: "",
      review: "",
      year: "",
      watchedDate: "",
      status: "watched",
    });
    setEditingId(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "watched":
        return <Eye className="w-4 h-4" />;
      case "watchlist":
        return <Clock className="w-4 h-4" />;
      default:
        return <Film className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "watched":
        return "bg-green-500";
      case "watchlist":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getRatingColor = (rating) => {
    const num = parseFloat(rating);
    if (num >= 9) return "text-green-400";
    if (num >= 7) return "text-yellow-400";
    if (num >= 5) return "text-orange-400";
    return "text-red-400";
  };

  const generateStars = (rating) => {
    const stars = [];
    const numRating = parseFloat(rating);
    const fullStars = Math.floor(numRating / 2);
    const hasHalfStar = numRating % 2 >= 1;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star
            key={i}
            className="w-4 h-4 fill-yellow-400/50 text-yellow-400"
          />
        );
      } else {
        stars.push(<Star key={i} className="w-4 h-4 text-gray-600" />);
      }
    }
    return stars;
  };

  const getStats = () => {
    const watched = movies.filter((m) => m.status === "watched").length;
    const watchlist = movies.filter((m) => m.status === "watchlist").length;
    const avgRating =
      movies.length > 0
        ? (
            movies.reduce((sum, m) => sum + parseFloat(m.rating || 0), 0) /
            movies.length
          ).toFixed(1)
        : 0;

    return { watched, watchlist, avgRating };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Film className="w-8 h-8 text-purple-400" />
              AfterCredits
            </h1>

            {/* Stats */}
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full">
                <Eye className="w-4 h-4 text-green-400" />
                <span>{stats.watched} Watched</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>{stats.watchlist} Watchlist</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full">
                <Award className="w-4 h-4 text-yellow-400" />
                <span>{stats.avgRating} Avg</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
            <button
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-300 text-sm mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Add Movie Form */}
        <form
          onSubmit={addOrUpdateMovie}
          className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-8"
        >
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            {editingId ? (
              <Edit3 className="w-6 h-6" />
            ) : (
              <Film className="w-6 h-6" />
            )}
            {editingId ? "Edit Movie" : "Add New Movie"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Title *
              </label>
              <input
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                name="title"
                placeholder="Movie/Show Title"
                value={form.title}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            {/* Genre */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Genre</label>
              <input
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                name="genre"
                placeholder="Action, Drama, Comedy..."
                value={form.genre}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Rating (1-10) *
              </label>
              <input
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                name="rating"
                type="number"
                min="1"
                max="10"
                step="0.1"
                placeholder="8.5"
                value={form.rating}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            {/* Year */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Year</label>
              <input
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                name="year"
                type="number"
                min="1900"
                max="2030"
                placeholder="2024"
                value={form.year}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Status
              </label>
              <select
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                name="status"
                value={form.status}
                onChange={handleChange}
                disabled={loading}
              >
                <option className="text-gray-900" value="watched">
                  Watched
                </option>
                <option className="text-gray-900" value="watchlist">
                  Want to Watch
                </option>
              </select>
            </div>

            {/* Watch Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Watch Date
              </label>
              <input
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                name="watchedDate"
                type="date"
                value={form.watchedDate}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {/* Review */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Review
              </label>
              <textarea
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all min-h-[100px]"
                name="review"
                placeholder="Share your thoughts..."
                value={form.review}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {/* Form Buttons */}
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="border border-white/5 bg-white/5 px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editingId ? "Update Movie" : "Add Movie"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={loading}
                  className="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Search and Filter Controls */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                placeholder="Search movies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all appearance-none"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option className="text-black" value="dateAdded">
                  Recently Added
                </option>
                <option className="text-black" value="rating">
                  Highest Rated
                </option>
                <option className="text-black" value="title">
                  Alphabetical
                </option>
                <option className="text-black" value="year">
                  Year
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Movies Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              📚 Your Collection ({filteredMovies.length})
              {loading && (
                <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
              )}
            </h2>
          </div>

          {loading && movies.length === 0 ? (
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-400 text-lg">Loading your movies...</p>
            </div>
          ) : filteredMovies.length === 0 ? (
            <div className="text-center py-12">
              <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">
                {movies.length === 0
                  ? "No movies added yet. Start building your collection!"
                  : "No movies match your search criteria."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMovies.map((movie) => (
                <div
                  key={movie.id}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 hover:transform hover:scale-105"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`p-1 rounded-full ${getStatusColor(
                            movie.status
                          )}`}
                        >
                          {getStatusIcon(movie.status)}
                        </span>
                        <h3 className="text-xl font-bold">{movie.title}</h3>
                        {movie.year && (
                          <span className="text-gray-400">({movie.year})</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-1">
                          {generateStars(movie.rating)}
                        </div>
                        <span
                          className={`font-bold text-lg ${getRatingColor(
                            movie.rating
                          )}`}
                        >
                          {movie.rating}/10
                        </span>
                      </div>

                      {movie.genre && (
                        <p className="text-sm text-purple-300 mb-2">
                          🎭 {movie.genre}
                        </p>
                      )}

                      {movie.watchedDate && (
                        <p className="text-sm text-gray-400 flex items-center gap-1 mb-2">
                          <Calendar className="w-3 h-3" />
                          Watched:{" "}
                          {new Date(movie.watchedDate).toLocaleDateString()}
                        </p>
                      )}

                      <p className="text-xs text-gray-500">
                        Added: {movie.dateAdded}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => editMovie(movie)}
                        disabled={loading}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-all disabled:opacity-50"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4 text-blue-400" />
                      </button>
                      <button
                        onClick={() => deleteMovie(movie.id)}
                        disabled={loading}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-all disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>

                  {movie.review && (
                    <div className="bg-white/5 rounded-lg p-3 mt-4">
                      <p className="text-gray-300 italic">"{movie.review}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
