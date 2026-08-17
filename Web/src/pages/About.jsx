import React, { useState } from 'react'
import { BookOpen, Bookmark, Sparkles, FileText, Users, Heart, Send, HelpCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const SUPPORT_EMAIL = "support@bookworm.app"

export default function About() {
  const [issueText, setIssueText] = useState('')

  const handleSendIssue = (e) => {
    e.preventDefault()
    if (!issueText.trim()) {
      toast.error('Please describe the issue or feedback before submitting.')
      return
    }

    const subject = encodeURIComponent('[BookWorm Support Report]')
    const body = encodeURIComponent(
      `Issue Details:\n${issueText.trim()}\n\n---\nBookWorm Web v1.0.0`
    )

    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`
    toast.success(`Opening email client for ${SUPPORT_EMAIL}`)
    setIssueText('')
  }

  const FEATURES = [
    {
      icon: BookOpen,
      title: "Book Recommendations",
      desc: "Share your honest reviews, star ratings, and detailed captions for books you love.",
    },
    {
      icon: Bookmark,
      title: "Personal Reading Library",
      desc: "Organize books into Want to Read, Currently Reading, and Finished categories with page tracking.",
    },
    {
      icon: Sparkles,
      title: "Book Stories & Quotes",
      desc: "Publish short reading updates, favorite quotes, and book moments to inspire fellow readers.",
    },
    {
      icon: FileText,
      title: "e-Book / PDF Access",
      desc: "Attach and read digital e-books (PDFs) seamlessly within the platform.",
    },
    {
      icon: Users,
      title: "Reader Community",
      desc: "Engage with like-minded bookworms through likes, comments, and recommendations.",
    },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* HERO SECTION */}
      <div className="card text-center py-12 mb-10 bg-gradient-to-b from-primary-50 to-white">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary-100 text-primary-600 mb-6">
          <BookOpen className="h-10 w-10" />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
          About BookWorm 🐛
        </h1>
        <p className="text-xl font-medium text-primary-700 max-w-2xl mx-auto mb-6">
          Read • Discover • Share • Connect
        </p>
        <p className="text-gray-600 max-w-3xl mx-auto text-lg leading-relaxed">
          BookWorm is a vibrant social platform built for book lovers. Whether you want to discover your next great read, track your reading progress, publish reviews, or share digital e-books with a passionate community, BookWorm brings everything together in one place.
        </p>
      </div>

      {/* FEATURES GRID */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          What BookWorm Does
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, idx) => {
            const IconComponent = feature.icon
            return (
              <div key={idx} className="card hover:shadow-lg transition-shadow duration-200 p-6">
                <div className="h-12 w-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
                  <IconComponent className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* HELP & SUPPORT / REPORT ISSUE CARD */}
      <div className="card p-8 mb-12 bg-white rounded-2xl border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <HelpCircle className="h-7 w-7 text-primary-600" />
          <h2 className="text-2xl font-bold text-gray-900">Help & Support 💬</h2>
        </div>
        <p className="text-gray-600 mb-6">
          For support or feedback, reach out at{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary-600 font-bold hover:underline">
            {SUPPORT_EMAIL}
          </a>
        </p>

        {/* REPORT ISSUE FORM */}
        <form onSubmit={handleSendIssue} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            Report an Issue or Feedback 🐛
          </h3>

          <textarea
            rows={4}
            value={issueText}
            onChange={(e) => setIssueText(e.target.value)}
            placeholder="Describe the issue or feedback you experienced..."
            className="input-field mb-4 w-full p-3 border border-gray-300 rounded-lg text-sm"
          />

          <button
            type="submit"
            className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold"
          >
            <Send className="h-4 w-4" />
            Submit Issue Report
          </button>
        </form>
      </div>

      {/* MISSION CARD */}
      <div className="card p-8 bg-primary-900 text-white rounded-2xl text-center">
        <Heart className="h-10 w-10 text-primary-300 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-3">Built for Passionate Readers</h3>
        <p className="text-primary-100 max-w-2xl mx-auto text-base leading-relaxed mb-6">
          Our mission is to make reading more interactive, engaging, and social. Share your love of books with people around the world!
        </p>
        <p className="text-xs text-primary-300">BookWorm Version 1.0.0 • Support: {SUPPORT_EMAIL}</p>
      </div>
    </div>
  )
}
