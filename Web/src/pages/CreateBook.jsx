import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { BookOpen, Upload, Star } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CreateBook() {
  const [formData, setFormData] = useState({
    title: '',
    caption: '',
    rating: 5,
    image: ''
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: name === 'rating' ? parseInt(value) : value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.caption.trim() || !formData.image.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      await api.post('/books', formData)
      toast.success('Book created successfully!')
      navigate('/')
    } catch (error) {
      console.error('Error creating book:', error)
      toast.error(error.response?.data?.message || 'Failed to create book')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <BookOpen className="h-12 w-12 text-primary-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Share a New Book
        </h1>
        <p className="text-gray-600">
          Tell the community about a book you love
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Book Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter the book title"
              required
            />
          </div>

          <div>
            <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="caption"
              name="caption"
              value={formData.caption}
              onChange={handleChange}
              rows={4}
              className="input-field resize-none"
              placeholder="Share what you loved about this book..."
              required
            />
          </div>

          <div>
            <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-2">
              Rating *
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                id="rating"
                name="rating"
                min="1"
                max="5"
                value={formData.rating}
                onChange={handleChange}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex items-center space-x-1">
                <Star className="h-5 w-5 text-yellow-500 fill-current" />
                <span className="text-lg font-semibold text-gray-900 w-6 text-center">
                  {formData.rating}
                </span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>

          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
              Book Cover Image URL *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Upload className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="url"
                id="image"
                name="image"
                value={formData.image}
                onChange={handleChange}
                className="input-field pl-10"
                placeholder="https://example.com/book-cover.jpg"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Provide a direct link to the book cover image
            </p>
          </div>

          {formData.image && (
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview:
              </label>
              <img
                src={formData.image}
                alt="Book cover preview"
                className="w-32 h-48 object-cover rounded-lg mx-auto"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'block'
                }}
              />
              <div className="hidden text-center text-gray-500 text-sm">
                Image not available
              </div>
            </div>
          )}

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
