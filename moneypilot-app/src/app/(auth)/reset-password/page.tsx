'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Wallet, Loader2, Eye, EyeOff, CheckCircle, Lock } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // No session means the reset link is invalid or expired
        setError('Invalid or expired reset link. Please request a new one.')
      }
    }
    checkSession()
  }, [supabase.auth])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    // Redirect to dashboard after 3 seconds
    setTimeout(() => {
      router.push('/dashboard')
    }, 3000)
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
            Create new password.
          </h1>
          <p className="text-gray-400 text-lg">
            Choose a strong password to keep your financial data secure.
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

          {!success ? (
            <>
              <div className="mb-8">
                <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-navy-900" />
                </div>
                <h2 className="text-2xl font-bold text-navy-900">Set new password</h2>
                <p className="text-gray-500 mt-2">
                  Your new password must be different from previously used passwords.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-navy-900 font-medium">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="h-12 border-gray-300 focus:border-success focus:ring-success pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Must be at least 8 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-navy-900 font-medium">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-12 border-gray-300 focus:border-success focus:ring-success"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-success hover:bg-success/90 text-white font-medium"
                  disabled={loading || password.length < 8}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-navy-900 mb-2">Password reset successful!</h2>
              <p className="text-gray-500 mb-6">
                Your password has been successfully reset. You'll be redirected to your dashboard shortly.
              </p>
              <Link href="/dashboard">
                <Button className="w-full h-12 bg-success hover:bg-success/90 text-white">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
