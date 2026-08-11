import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import { Star, User, Plus, BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Home() {
  const { user } = useAuth()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

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
    if (!window.confirm('Are you sure you want to delete this book?')) return
    
    try {
      await api.delete(`/books/${bookId}`)
      setBooks(books.filter(book => book._id !== bookId))
      toast.success('Book deleted successfully')
    } catch (error) {
      console.error('Error deleting book:', error)
      toast.error('Failed to delete book')
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
                    className="w-full h-48 object-cover rounded-lg mb-4"
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
                    <div className="pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleDeleteBook(book._id)}
                        className="w-full text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
                      >
                        Delete Book
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
    </div>
  )
}
