import React, { useState } from "react";
import { useMovies } from "@/contexts/MovieContext";
import { Button } from "@/components/ui/button";

interface WatchlistSelectorModalProps {
  open: boolean;
  onClose: () => void;
  movieId: number;
  onMovieAdded?: () => void;
}

const WatchlistSelectorModal: React.FC<WatchlistSelectorModalProps> = ({
  open,
  onClose,
  movieId,
  onMovieAdded,
}) => {
  const { watchlists, addMovieToWatchlist, createWatchlist, fetchWatchlists } =
    useMovies();
  const [selectedId, setSelectedId] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleAdd = async () => {
    if (!selectedId) return setError("Please select a watchlist");
    setLoading(true);
    try {
      await addMovieToWatchlist(selectedId, movieId);
      if (onMovieAdded) onMovieAdded();
      onClose();
    } catch (e) {
      setError("Failed to add movie");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return setError("Name required");
    setLoading(true);
    try {
      await createWatchlist(newName, newDesc);
      await fetchWatchlists();
      setCreating(false);
      setNewName("");
      setNewDesc("");
    } catch (e) {
      setError("Failed to create watchlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
      <div className='bg-gray-900 rounded-lg p-6 w-full max-w-md'>
        <h2 className='text-xl font-bold text-white mb-4'>Add to Watchlist</h2>
        {error && <p className='text-red-500 mb-2'>{error}</p>}
        <div className='mb-4'>
          <label className='block text-gray-300 mb-2'>
            Select a watchlist:
          </label>
          <select
            className='w-full p-2 rounded bg-gray-800 text-white mb-2'
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value=''>-- Select --</option>
            {watchlists.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name}
              </option>
            ))}
          </select>
          <Button
            className='w-full bg-blue-600 hover:bg-blue-700 mb-2'
            onClick={handleAdd}
            disabled={loading}
          >
            Add to Selected
          </Button>
        </div>
        <div className='mb-2 border-t border-gray-700 pt-4'>
          <button
            className='text-blue-400 hover:underline mb-2'
            onClick={() => setCreating((c) => !c)}
          >
            {creating ? "Cancel" : "Create New Watchlist"}
          </button>
          {creating && (
            <form onSubmit={handleCreate} className='space-y-2'>
              <input
                type='text'
                placeholder='Watchlist name'
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className='w-full p-2 rounded bg-gray-800 text-white'
                required
              />
              <input
                type='text'
                placeholder='Description (optional)'
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className='w-full p-2 rounded bg-gray-800 text-white'
              />
              <Button
                type='submit'
                className='w-full bg-blue-600 hover:bg-blue-700'
                disabled={loading}
              >
                {loading ? "Creating..." : "Create"}
              </Button>
            </form>
          )}
        </div>
        <Button
          variant='outline'
          className='w-full mt-2 border-gray-600 text-gray-300'
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  );
};

export default WatchlistSelectorModal;
