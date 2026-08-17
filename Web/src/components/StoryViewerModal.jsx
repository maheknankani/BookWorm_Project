import React, { useState, useEffect, useRef } from 'react'
import { X, Heart, MessageCircle, Eye, Trash2, Quote, Send, BookOpen } from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

const CARD_THEMES = {
  forest: { bg: 'from-emerald-900 via-green-950 to-emerald-950', text: 'text-white', accent: 'text-emerald-300' },
  emerald: { bg: 'from-teal-900 via-emerald-900 to-teal-950', text: 'text-white', accent: 'text-teal-300' },
  midnight: { bg: 'from-slate-900 via-indigo-950 to-slate-950', text: 'text-white', accent: 'text-indigo-300' },
  amber: { bg: 'from-stone-900 via-amber-950 to-stone-950', text: 'text-white', accent: 'text-amber-300' },
  rose: { bg: 'from-pink-950 via-rose-950 to-pink-950', text: 'text-white', accent: 'text-rose-300' },
}

export default function StoryViewerModal({ isOpen, onClose, storyGroup, currentUser, onStoryDeleted }) {
  const [storyIndex, setStoryIndex] = useState(0)
  const [activeStory, setActiveStory] = useState(null)
  const [showComments, setShowComments] = useState(false)
  const [showViewers, setShowViewers] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [viewersList, setViewersList] = useState([])
  const [loadingViewers, setLoadingViewers] = useState(false)
  const [progress, setProgress] = useState(0)

  const stories = storyGroup?.stories || []
  const currentStory = stories[storyIndex] || activeStory
  const isAuthor = currentStory?.user?._id === currentUser?.id || currentStory?.user?._id === currentUser?._id || storyGroup?.isCurrentUser

  useEffect(() => {
    if (isOpen && stories.length > 0) {
      setStoryIndex(0)
      setActiveStory(stories[0])
    }
  }, [isOpen, storyGroup])

  useEffect(() => {
    if (!isOpen || !currentStory) return

    setActiveStory(currentStory)
    markViewed(currentStory._id)

    setProgress(0)
    let timer

    if (!showComments && !showViewers) {
      const interval = 50
      const duration = 5000
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer)
            nextStory()
            return 100
          }
          return prev + (interval / duration) * 100
        })
      }, interval)
    }

    return () => clearInterval(timer)
  }, [isOpen, storyIndex, showComments, showViewers])

  const markViewed = async (storyId) => {
    try {
      await api.post(`/stories/${storyId}/view`)
    } catch (err) {
      console.error('Error marking story viewed:', err)
    }
  }

  const nextStory = () => {
    if (storyIndex < stories.length - 1) {
      setStoryIndex(storyIndex + 1)
    } else {
      onClose()
    }
  }

  const prevStory = () => {
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1)
    }
  }

  const handleLikeToggle = async () => {
    if (!currentStory) return
    try {
      const res = await api.post(`/stories/${currentStory._id}/like`)
      setActiveStory((prev) => ({
        ...prev,
        likes: res.data.likes,
      }))
    } catch (err) {
      console.error('Like error:', err)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim() || !currentStory) return
    try {
      const res = await api.post(`/stories/${currentStory._id}/comments`, {
        text: commentText.trim(),
      })
      setActiveStory((prev) => ({
        ...prev,
        comments: res.data.comments,
      }))
      setCommentText('')
      toast.success('Comment added!')
    } catch (err) {
      console.error('Comment error:', err)
    }
  }

  const fetchViewers = async () => {
    if (!currentStory) return
    try {
      setLoadingViewers(true)
      setShowViewers(true)
      const res = await api.get(`/stories/${currentStory._id}/viewers`)
      setViewersList(res.data.viewers || [])
    } catch (err) {
      console.error('Viewers error:', err)
    } finally {
      setLoadingViewers(false)
    }
  }

  const handleDeleteStory = async () => {
    if (!currentStory) return
    if (!window.confirm('Are you sure you want to delete this story?')) return

    try {
      await api.delete(`/stories/${currentStory._id}`)
      toast.success('Story deleted')
      if (onStoryDeleted) onStoryDeleted(currentStory._id)
      onClose()
    } catch (err) {
      console.error('Delete error:', err)
      toast.error('Failed to delete story')
    }
  }

  if (!isOpen || !currentStory) return null

  const theme = CARD_THEMES[currentStory.cardStyle] || CARD_THEMES.forest
  const isLiked = currentStory.likes?.some((id) => id === currentUser?.id || id === currentUser?._id)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fadeIn">
      {/* Container Box */}
      <div className={`relative w-full max-w-md h-[90vh] bg-gradient-to-b ${theme.bg} rounded-3xl shadow-2xl overflow-hidden flex flex-col justify-between p-6 select-none`}>
        {/* Navigation Click Zones */}
        <div className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer" onClick={prevStory} />
        <div className="absolute inset-y-0 right-0 w-2/3 z-10 cursor-pointer" onClick={nextStory} />

        {/* Top Header */}
        <div className="relative z-20 space-y-4">
          {/* Progress Bars */}
          <div className="flex space-x-1.5">
            {stories.map((s, idx) => (
              <div key={s._id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-75"
                  style={{
                    width: idx === storyIndex ? `${progress}%` : idx < storyIndex ? '100%' : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Author info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {storyGroup?.user?.profileImage ? (
                <img
                  src={storyGroup.user.profileImage}
                  alt="Author"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white/50"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white">
                  {storyGroup?.user?.username ? storyGroup.user.username[0].toUpperCase() : 'U'}
                </div>
              )}
              <div>
                <h3 className="font-bold text-white text-sm">{storyGroup?.user?.username || 'User'}</h3>
                <p className={`text-xs ${theme.accent}`}>Expires in 24h</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {isAuthor && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteStory()
                  }}
                  className="p-2 text-white/80 hover:text-red-400 transition-colors"
                  title="Delete Story"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onClose()
                }}
                className="p-2 text-white/80 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Center Card Content */}
        <div className="relative z-20 flex-1 flex flex-col justify-center py-6 px-2 space-y-6">
          {/* Book Badge */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center space-x-3 border border-white/15">
            {currentStory.bookCover ? (
              <img src={currentStory.bookCover} alt="Cover" className="w-10 h-14 rounded object-cover shadow" />
            ) : (
              <div className="w-10 h-14 rounded bg-white/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-emerald-300" />
              </div>
            )}
            <div>
              <h4 className="font-bold text-white text-base line-clamp-1">{currentStory.bookTitle}</h4>
              {currentStory.pageNumber && (
                <span className={`text-xs font-semibold ${theme.accent}`}>
                  Page {currentStory.pageNumber}
                </span>
              )}
            </div>
          </div>

          {/* Quote Excerpt */}
          <div className="space-y-3">
            <Quote className={`h-8 w-8 ${theme.accent}`} />
            <p className="text-xl sm:text-2xl italic font-bold text-white leading-relaxed">
              "{currentStory.quote}"
            </p>
          </div>

          {/* Personal Note */}
          {currentStory.note && (
            <div className="pt-4 border-t border-white/15">
              <p className={`text-sm font-semibold ${theme.accent}`}>
                💭 {currentStory.note}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Interactive Footer */}
        <div className="relative z-30 flex items-center justify-around bg-black/40 backdrop-blur-md rounded-2xl py-3 px-4">
          {/* Like */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleLikeToggle()
            }}
            className="flex items-center space-x-2 text-white hover:text-pink-400 transition-colors"
          >
            <Heart className={`h-6 w-6 ${isLiked ? 'fill-pink-500 text-pink-500' : ''}`} />
            <span className="text-sm font-bold">{currentStory.likes?.length || 0}</span>
          </button>

          {/* Comments */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowComments(!showComments)
            }}
            className="flex items-center space-x-2 text-white hover:text-emerald-400 transition-colors"
          >
            <MessageCircle className="h-6 w-6" />
            <span className="text-sm font-bold">{currentStory.comments?.length || 0}</span>
          </button>

          {/* Viewers (Author only) */}
          {isAuthor && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                fetchViewers()
              }}
              className="flex items-center space-x-2 text-white hover:text-teal-300 transition-colors"
            >
              <Eye className="h-6 w-6" />
              <span className="text-sm font-bold">{currentStory.viewers?.length || 0}</span>
            </button>
          )}
        </div>

        {/* Comments Drawer */}
        {showComments && (
          <div className="absolute inset-x-0 bottom-0 z-40 bg-white rounded-t-3xl p-5 text-gray-900 max-h-[60%] flex flex-col shadow-2xl animate-slideUp">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h4 className="font-bold text-sm text-gray-800">Replies & Reactions</h4>
              <button onClick={() => setShowComments(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {currentStory.comments?.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-4">No replies yet. Be the first to react!</p>
              ) : (
                currentStory.comments?.map((c, idx) => (
                  <div key={idx} className="text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <span className="font-bold text-emerald-700 block mb-0.5">{c.user?.username || 'User'}</span>
                    <p className="text-gray-800 font-medium">{c.text}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex items-center space-x-2 pt-2 border-t border-gray-100">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Reply to story..."
                className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button type="submit" className="p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {/* Viewers Drawer */}
        {showViewers && (
          <div className="absolute inset-x-0 bottom-0 z-40 bg-white rounded-t-3xl p-5 text-gray-900 max-h-[50%] flex flex-col shadow-2xl animate-slideUp">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h4 className="font-bold text-sm text-gray-800">Story Viewers ({viewersList.length})</h4>
              <button onClick={() => setShowViewers(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {loadingViewers ? (
                <p className="text-center text-xs text-gray-400 py-4">Loading viewers...</p>
              ) : (
                viewersList.map((v, idx) => (
                  <div key={idx} className="flex items-center space-x-3 text-xs py-1.5 border-b border-gray-50">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      {v.user?.username ? v.user.username[0].toUpperCase() : 'U'}
                    </div>
                    <span className="font-semibold text-gray-800">{v.user?.username || 'Community Member'}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
