import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import { Mail, Lock, BookOpen, KeyRound, ShieldCheck, CheckCircle2, X, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false)
  const [forgotStep, setForgotStep] = useState(1) // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [resetEmail, setResetEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await login(formData.email, formData.password)
      if (result.success) {
        toast.success('Welcome back!')
        navigate('/')
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenForgotModal = () => {
    setIsForgotModalOpen(true)
    setForgotStep(1)
    setResetEmail(formData.email || '')
    setOtpCode('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleCloseForgotModal = () => {
    setIsForgotModalOpen(false)
    setForgotStep(1)
  }

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!resetEmail.trim()) {
      toast.error('Please enter your email address')
      return
    }

    setForgotLoading(true)
    try {
      const response = await api.post('/auth/forgot-password/send-otp', { email: resetEmail })
      toast.success(response.data.message || 'OTP sent to your email!')
      setForgotStep(2)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP')
    } finally {
      setForgotLoading(false)
    }
  }

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!otpCode.trim()) {
      toast.error('Please enter the 6-digit OTP code')
      return
    }

    setForgotLoading(true)
    try {
      const response = await api.post('/auth/forgot-password/verify-otp', {
        email: resetEmail,
        otp: otpCode
      })
      toast.success(response.data.message || 'OTP verified successfully!')
      setForgotStep(3)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid or expired OTP')
    } finally {
      setForgotLoading(false)
    }
  }

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!newPassword) {
      toast.error('Please enter a new password')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setForgotLoading(true)
    try {
      const response = await api.post('/auth/forgot-password/reset-password', {
        email: resetEmail,
        otp: otpCode,
        newPassword
      })
      toast.success(response.data.message || 'Password reset successful!')
      setForgotStep(4)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password')
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <BookOpen className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account to continue
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleOpenForgotModal}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-500 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Enter your password"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                Sign up here
              </Link>
            </p>
          </div>
        </form>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={handleCloseForgotModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
              aria-label="Close Modal"
            >
              <X className="h-6 w-6" />
            </button>

            {/* STEP 1: ENTER EMAIL */}
            {forgotStep === 1 && (
              <div>
                <div className="text-center mb-6">
                  <div className="mx-auto w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 mb-3">
                    <KeyRound className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Forgot Password</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Enter your email address and we'll send you a 6-digit OTP code.
                  </p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="input-field pl-10"
                        placeholder="Enter your account email"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full btn-primary disabled:opacity-50"
                  >
                    {forgotLoading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 2: VERIFY OTP */}
            {forgotStep === 2 && (
              <div>
                <button
                  onClick={() => setForgotStep(1)}
                  className="flex items-center text-xs text-gray-500 hover:text-gray-700 mb-3"
                >
                  <ArrowLeft className="h-3 w-3 mr-1" /> Back to Email
                </button>

                <div className="text-center mb-6">
                  <div className="mx-auto w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 mb-3">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Enter OTP</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    We sent a 6-digit verification code to <span className="font-semibold text-gray-800">{resetEmail}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      6-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="input-field text-center text-2xl tracking-widest font-mono"
                      placeholder="123456"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full btn-primary disabled:opacity-50"
                  >
                    {forgotLoading ? 'Verifying OTP...' : 'Verify OTP'}
                  </button>

                  <div className="text-center mt-3">
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={forgotLoading}
                      className="text-xs text-primary-600 hover:underline"
                    >
                      Didn't get the code? Resend OTP
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 3: SET NEW PASSWORD */}
            {forgotStep === 3 && (
              <div>
                <div className="text-center mb-6">
                  <div className="mx-auto w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 mb-3">
                    <Lock className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Set New Password</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Create a strong new password for your account.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input-field pl-10"
                        placeholder="At least 6 characters"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input-field pl-10"
                        placeholder="Re-enter new password"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full btn-primary disabled:opacity-50"
                  >
                    {forgotLoading ? 'Updating Password...' : 'Reset Password'}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 4: SUCCESS */}
            {forgotStep === 4 && (
              <div className="text-center py-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Success!</h3>
                <p className="text-sm text-gray-600 mt-2 mb-6">
                  Your password has been reset successfully. You can now log in using your new password.
                </p>

                <button
                  type="button"
                  onClick={handleCloseForgotModal}
                  className="w-full btn-primary"
                >
                  Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
