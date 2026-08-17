import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import { Star, User, Plus, BookOpen, X, ZoomIn, ZoomOut, RotateCcw, Edit3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Home() {
  const { user } = useAuth()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const [previewImage, setPreviewImage] = useState(null)
  const [previewTitle, setPreviewTitle] = useState('')
  const [zoomScale, setZoomScale] = useState(1)

  // Edit Recommendation Modal State
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingBook, setEditingBook] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editCaption, setEditCaption] = useState('')
  const [editRating, setEditRating] = useState(3)
  const [editLoading, setEditLoading] = useState(false)

  useEffect(() => {
    fetchBooks()
  }, [])

  const fetchBooks = async (page = 1) => {
    try {
      setLoading(true)
      const response = await api.get(`/books?page=${page}&limit=10`)
      const { books: newBooks, totalPages } = response.data
      
      if (page === 1) {
        setBooks(newBooks)
      } else {
        setBooks(prev => [...prev, ...newBooks])
      }
      
      setHasMore(page < totalPages)
      setCurrentPage(page)
    } catch (error) {
      console.error('Error fetching books:', error)
      toast.error('Failed to load books')
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchBooks(currentPage + 1)
    }
  }

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm('Are you sure you want to delete this recommendation?')) return
    
    try {
      await api.delete(`/books/${bookId}`)
      setBooks(books.filter(book => book._id !== bookId))
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

      setBooks(books.map(b => b._id === editingBook._id ? { ...b, ...response.data } : b))
      toast.success('Recommendation updated successfully!')
      setEditModalOpen(false)
    } catch (error) {
      console.error('Error updating book:', error)
      toast.error(error.response?.data?.message || 'Failed to update recommendation')
    } finally {
      setEditLoading(false)
    }
  }

  if (loading && books.length === 0) {
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
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Discover Amazing Books
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Explore a collection of books shared by our community. Find your next favorite read!
        </p>
        {user && (
          <div className="mt-8">
            <Link to="/create" className="btn-primary inline-flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Add New Book</span>
            </Link>
          </div>
        )}
      </div>

      {/* Books Grid */}
      {books.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No books yet</h3>
          <p className="text-gray-600 mb-6">Be the first to share a book with the community!</p>
          {user ? (
            <Link to="/create" className="btn-primary">
              Add Your First Book
            </Link>
          ) : (
            <Link to="/register" className="btn-primary">
              Join the Community
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {books.map((book) => (
              <div key={book._id} className="card hover:shadow-lg transition-shadow duration-200">
                <div className="relative">
                  <img
                    src={book.image}
                    alt={book.title}
                    onClick={() => {
                      setPreviewImage(book.image)
                      setPreviewTitle(book.title)
                    }}
                    className="w-full h-56 object-contain bg-gray-50 rounded-lg mb-4 cursor-pointer hover:opacity-90 transition-opacity"
                    title="Click for full-screen preview"
                  />
                  <div className="absolute top-2 right-2 bg-white rounded-full px-2 py-1 flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{book.rating}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {book.caption}
                  </p>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <User className="h-4 w-4" />
                    <span>{book.user?.username || 'Unknown'}</span>
                  </div>
                  
                  {user && book.user?._id === user.id && (
                    <div className="pt-3 border-t border-gray-100 flex items-center space-x-2">
                      <button
                        onClick={() => openEditModal(book)}
                        className="flex-1 flex items-center justify-center space-x-1 text-primary-700 bg-primary-50 hover:bg-primary-100 text-xs font-semibold transition-colors py-1.5 rounded"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteBook(book._id)}
                        className="flex-1 flex items-center justify-center space-x-1 text-red-600 bg-red-50 hover:bg-red-100 text-xs font-semibold transition-colors py-1.5 rounded"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Load More Books'}
              </button>
            </div>
          )}
        </>
      )}

      {/* EDIT RECOMMENDATION MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
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

      {/* FULL SCREEN BOOK COVER PREVIEW MODAL */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-6 transition-all duration-300 animate-in fade-in"
          onClick={() => {
            setPreviewImage(null)
            setZoomScale(1)
          }}
        >
          <div className="w-full flex items-center justify-between z-10" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => {
                setPreviewImage(null)
                setZoomScale(1)
              }}
              className="text-white hover:text-gray-300 bg-white/10 hover:bg-white/20 rounded-full p-2.5 transition-all duration-200"
              title="Close preview"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="text-center">
              <p className="text-white/90 text-base font-semibold tracking-wide">
                {previewTitle}
              </p>
              <p className="text-white/50 text-xs">Full Cover Preview</p>
            </div>

            <button 
              onClick={() => setZoomScale(1)}
              className="flex items-center space-x-1 text-xs text-white/80 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-all duration-200"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <div 
            className="relative w-full flex-1 flex items-center justify-center overflow-hidden my-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage}
              alt={previewTitle}
              style={{ transform: `scale(${zoomScale})` }}
              className="max-w-full max-h-[75vh] rounded-xl shadow-2xl object-contain border border-white/10 transition-transform duration-200 ease-out"
            />
          </div>

          {/* ZOOM CONTROLS BAR */}
          <div 
            className="flex items-center space-x-4 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setZoomScale(prev => Math.max(prev - 0.25, 0.75))}
              className="text-white hover:text-gray-300 p-1.5 rounded-full hover:bg-white/10 transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            <span className="text-xs font-bold text-white min-w-12 text-center">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => setZoomScale(prev => Math.min(prev + 0.25, 2.5))}
              className="text-white hover:text-gray-300 p-1.5 rounded-full hover:bg-white/10 transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
