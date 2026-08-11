import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import { Star, User, Calendar, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user } = useAuth()
  const [userBooks, setUserBooks] = useState([])
  const [loading, setLoading] = useState(true)

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
    if (!window.confirm('Are you sure you want to delete this book?')) return
    
    try {
      await api.delete(`/books/${bookId}`)
      setUserBooks(userBooks.filter(book => book._id !== bookId))
      toast.success('Book deleted successfully')
    } catch (error) {
      console.error('Error deleting book:', error)
      toast.error('Failed to delete book')
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
            className="h-24 w-24 rounded-full border-4 border-primary-100"
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
                <span>{userBooks.length} books shared</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User's Books */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Your Books
        </h2>
        
        {userBooks.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <Star className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No books yet</h3>
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
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Shared {formatDate(book.createdAt)}</span>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleDeleteBook(book._id)}
                      className="w-full flex items-center justify-center space-x-2 text-red-600 hover:text-red-700 text-sm font-medium transition-colors py-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Book</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
