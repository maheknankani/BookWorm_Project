import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import { Star, User, Calendar, Trash2, Edit3, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user } = useAuth()
  const [userBooks, setUserBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [imageViewerOpen, setImageViewerOpen] = useState(false)

  // Edit Recommendation Modal State
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingBook, setEditingBook] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editCaption, setEditCaption] = useState('')
  const [editRating, setEditRating] = useState(3)
  const [editLoading, setEditLoading] = useState(false)

  useEffect(() => {
    fetchUserBooks()
  }, [])

  const fetchUserBooks = async () => {
    try {
      setLoading(true)
      const response = await api.get('/books/user')
      setUserBooks(response.data)
    } catch (error) {
      console.error('Error fetching user books:', error)
      toast.error('Failed to load your books')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm('Are you sure you want to delete this recommendation?')) return
    
    try {
      await api.delete(`/books/${bookId}`)
      setUserBooks(userBooks.filter(book => book._id !== bookId))
      toast.success('Recommendation deleted successfully')
    } catch (error) {
      console.error('Error deleting book:', error)
      toast.error('Failed to delete recommendation')
    }
  }

  const openEditModal = (book) => {
    setEditingBook(book)
    setEditTitle(book.title || '')
    setEditCaption(book.caption || '')
    setEditRating(book.rating || 3)
    setEditModalOpen(true)
  }

  const handleUpdateBook = async (e) => {
    e.preventDefault()
    if (!editTitle.trim() || !editCaption.trim()) {
      toast.error('Title and caption are required')
      return
    }

    try {
      setEditLoading(true)
      let response
      try {
        response = await api.put(`/books/${editingBook._id}`, {
          title: editTitle.trim(),
          caption: editCaption.trim(),
          rating: editRating,
        })
      } catch (err) {
        if (err.response?.status === 404 || err.response?.status === 405) {
          response = await api.post(`/books/${editingBook._id}/edit`, {
            title: editTitle.trim(),
            caption: editCaption.trim(),
            rating: editRating,
          })
        } else {
          throw err
        }
      }

      setUserBooks(userBooks.map(b => b._id === editingBook._id ? response.data : b))
      toast.success('Recommendation updated successfully!')
      setEditModalOpen(false)
    } catch (error) {
      console.error('Error updating book:', error)
      toast.error(error.response?.data?.message || 'Failed to update recommendation')
    } finally {
      setEditLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="card mb-8">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
          <img
            src={user.profileImage}
            alt={user.username}
            onClick={() => setImageViewerOpen(true)}
            className="h-24 w-24 rounded-full border-4 border-primary-100 cursor-pointer hover:opacity-90 hover:scale-105 transition-all duration-200"
            title="Click to view full image"
          />
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {user.username}
            </h1>
            <p className="text-gray-600 mb-2">{user.email}</p>
            <div className="flex items-center justify-center md:justify-start space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Joined {formatDate(user.createdAt)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>{userBooks.length} recommendations</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User's Books */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Your Recommendations
        </h2>
        
        {userBooks.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <Star className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations yet</h3>
            <p className="text-gray-600 mb-6">
              Start sharing your favorite books with the community!
            </p>
            <a
              href="/create"
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Star className="h-5 w-5" />
              <span>Share Your First Book</span>
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userBooks.map((book) => (
              <div key={book._id} className="card hover:shadow-lg transition-shadow duration-200 flex flex-col justify-between">
                <div>
                  <div className="relative mb-4">
                    <img
                      src={book.image}
                      alt={book.title}
                      className="w-full h-56 object-contain bg-gray-50 rounded-lg"
                    />
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center space-x-1 shadow-sm">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-bold text-gray-800">{book.rating}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                      {book.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                      {book.caption}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-400 mb-3">
                    Shared on {formatDate(book.createdAt)}
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center space-x-3">
                    <button
                      onClick={() => openEditModal(book)}
                      className="flex-1 flex items-center justify-center space-x-1.5 text-primary-700 bg-primary-50 hover:bg-primary-100 text-sm font-semibold transition-colors py-2 rounded-lg"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteBook(book._id)}
                      className="flex-1 flex items-center justify-center space-x-1.5 text-red-600 bg-red-50 hover:bg-red-100 text-sm font-semibold transition-colors py-2 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EDIT RECOMMENDATION MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <h3 className="text-xl font-bold text-gray-900">Edit Recommendation</h3>
              <button 
                onClick={() => setEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBook} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Book Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Rating
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setEditRating(star)}
                      className="p-1 focus:outline-none"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          star <= editRating
                            ? 'text-yellow-500 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Review Caption
                </label>
                <textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  rows={4}
                  className="input-field resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="btn-secondary"
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={editLoading}
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL SCREEN PROFILE IMAGE VIEWER MODAL */}
      {imageViewerOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in"
          onClick={() => setImageViewerOpen(false)}
        >
          <button 
            onClick={() => setImageViewerOpen(false)}
            className="absolute top-6 right-6 text-white hover:text-gray-300 bg-white/10 hover:bg-white/20 rounded-full p-2.5 transition-all duration-200"
            title="Close viewer"
          >
            <X className="h-6 w-6" />
          </button>
          <div 
            className="relative max-w-4xl max-h-[85vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={user.profileImage}
              alt={user.username}
              className="max-w-full max-h-[78vh] rounded-2xl shadow-2xl object-contain border border-white/10"
            />
            <p className="text-center text-white/90 mt-4 text-base font-semibold tracking-wide">
              {user.username}
            </p>
            <p className="text-center text-white/50 text-xs mt-1">
              Click anywhere outside or press X to close
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
