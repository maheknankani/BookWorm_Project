import React, { useState } from 'react'
import { X, Quote, Sparkles, BookOpen, Loader2 } from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

const CARD_STYLES = [
  { id: 'forest', name: 'Forest', bg: 'from-emerald-900 to-green-950', text: 'text-white', accent: 'text-emerald-300' },
  { id: 'emerald', name: 'Emerald', bg: 'from-teal-900 to-emerald-900', text: 'text-white', accent: 'text-teal-300' },
  { id: 'midnight', name: 'Midnight', bg: 'from-slate-900 to-indigo-950', text: 'text-white', accent: 'text-indigo-300' },
  { id: 'amber', name: 'Warm Amber', bg: 'from-stone-900 to-amber-950', text: 'text-white', accent: 'text-amber-300' },
  { id: 'rose', name: 'Sunset Rose', bg: 'from-pink-950 to-rose-950', text: 'text-white', accent: 'text-rose-300' },
]

export default function CreateStoryModal({ isOpen, onClose, onStoryCreated, initialBookTitle = '', initialBookCover = '', initialBookId = null }) {
  const [bookTitle, setBookTitle] = useState(initialBookTitle)
  const [bookCover, setBookCover] = useState(initialBookCover)
  const [quote, setQuote] = useState('')
  const [pageNumber, setPageNumber] = useState('')
  const [note, setNote] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('forest')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const activeStyle = CARD_STYLES.find((s) => s.id === selectedStyle) || CARD_STYLES[0]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!bookTitle.trim()) {
      return toast.error('Please enter the book title')
    }
    if (!quote.trim()) {
      return toast.error('Please enter a quote or excerpt from the book')
    }

    try {
      setLoading(true)
      const res = await api.post('/stories', {
        bookId: initialBookId || null,
        bookTitle: bookTitle.trim(),
        bookCover: bookCover.trim() || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400',
        quote: quote.trim(),
        pageNumber: pageNumber.trim(),
        note: note.trim(),
        cardStyle: selectedStyle,
      })

      toast.success('Reading story published! ✨')
      if (onStoryCreated) onStoryCreated(res.data.story)
      onClose()
    } catch (err) {
      console.error('Publish story error:', err)
      toast.error(err.response?.data?.message || 'Failed to publish story')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center space-x-2 text-emerald-700 font-bold text-lg">
            <Sparkles className="h-5 w-5" />
            <span>Share Reading Story</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Card Preview */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Story Preview
            </label>
            <div className={`bg-gradient-to-br ${activeStyle.bg} p-6 rounded-2xl text-white shadow-lg space-y-4`}>
              <div className="flex items-center space-x-3">
                {bookCover ? (
                  <img src={bookCover} alt="Cover" className="w-9 h-12 rounded object-cover shadow" />
                ) : (
                  <div className="w-9 h-12 rounded bg-white/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-emerald-300" />
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-base line-clamp-1">{bookTitle || 'Book Title'}</h4>
                  {pageNumber && <p className={`text-xs ${activeStyle.accent}`}>Page {pageNumber}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <Quote className={`h-6 w-6 ${activeStyle.accent}`} />
                <p className="italic font-medium text-base leading-relaxed">
                  "{quote || 'Highlight or type an inspiring quote here...'}"
                </p>
              </div>

              {note && (
                <div className="pt-3 border-t border-white/10 text-sm">
                  <p className={activeStyle.accent}>💭 {note}</p>
                </div>
              )}
            </div>
          </div>

          {/* Theme Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Card Theme
            </label>
            <div className="flex flex-wrap gap-2">
              {CARD_STYLES.map((style) => (
                <button
                  type="button"
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    selectedStyle === style.id
                      ? 'bg-emerald-700 text-white ring-2 ring-emerald-500 shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>

          {/* Inputs */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Book Title *</label>
            <input
              type="text"
              required
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder="e.g. Atomic Habits"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Book Cover URL</label>
            <input
              type="url"
              value={bookCover}
              onChange={(e) => setBookCover(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Highlighted Quote / Excerpt *</label>
            <textarea
              required
              rows={3}
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="Paste or type the quote..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Page Number (Optional)</label>
              <input
                type="text"
                value={pageNumber}
                onChange={(e) => setPageNumber(e.target.value)}
                placeholder="e.g. 142"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Personal Note / Reflection (Optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why this quote resonated with you..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center space-x-2 shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <span>Share Story</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
