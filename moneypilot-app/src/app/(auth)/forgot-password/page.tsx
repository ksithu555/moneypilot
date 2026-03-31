'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Wallet, Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)
    } catch (err) {
      setError('Network error. Please check your internet connection and try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy-950 flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <Wallet className="h-8 w-8 text-success" />
          <span className="text-2xl font-bold text-white">Moneypilot</span>
        </div>
        
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Reset your password.
          </h1>
          <p className="text-gray-400 text-lg">
            We'll send you a secure link to reset your password and get back to managing your finances.
          </p>
        </div>

        <div className="flex items-center gap-8 text-sm text-gray-500">
          <Link href="#" className="hover:text-gray-300">Privacy Policy</Link>
          <Link href="#" className="hover:text-gray-300">Terms of Service</Link>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Wallet className="h-8 w-8 text-success" />
            <span className="text-2xl font-bold text-navy-900">Moneypilot</span>
          </div>

          {/* Back Link */}
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-navy-900 mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>

          {!success ? (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-navy-900">Forgot password?</h2>
                <p className="text-gray-500 mt-2">
                  No worries, we'll send you reset instructions.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-navy-900 font-medium">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 border-gray-300 focus:border-success focus:ring-success"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-success hover:bg-success/90 text-white font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-navy-900 mb-2">Check your email</h2>
              <p className="text-gray-500 mb-6">
                We've sent a password reset link to<br />
                <span className="font-medium text-navy-900">{email}</span>
              </p>
              <p className="text-sm text-gray-400 mb-8">
                Didn't receive the email? Check your spam folder or{' '}
                <button 
                  onClick={() => setSuccess(false)} 
                  className="text-success hover:underline"
                >
                  try again
                </button>
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full h-12 border-gray-300">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to login
                </Button>
              </Link>
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-8">
            Remember your password?{' '}
            <Link href="/login" className="text-success font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
