'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Wallet, Loader2, Eye, EyeOff, Check } from 'lucide-react'

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [householdName, setHouseholdName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError(null)

    // Get the current origin for redirect URL (works in both dev and production)
    const origin = window.location.origin
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: {
          display_name: `${firstName} ${lastName}`,
          household_name: householdName,
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (authData.user) {
      router.push('/quick-input')
    }
  }

  const steps = [
    { number: 1, label: 'Personal Info' },
    { number: 2, label: 'Account Setup' },
    { number: 3, label: 'Vault Name' },
  ]

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white">
        <div className="w-full max-w-lg">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <Wallet className="h-8 w-8 text-success" />
            <span className="text-2xl font-bold text-navy-900">Moneypilot</span>
          </div>

          {/* Header */}
          <div className="mb-6 lg:mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-navy-900">Create your vault</h1>
            <p className="text-sm lg:text-base text-gray-500 mt-2">Set up your financial command center in minutes.</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center lg:justify-start gap-2 lg:gap-4 mb-6 lg:mb-8">
            {steps.map((s, i) => (
              <div key={s.number} className="flex items-center">
                <div className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs lg:text-sm font-medium ${
                  step > s.number 
                    ? 'bg-success text-white' 
                    : step === s.number 
                      ? 'bg-navy-900 text-white' 
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s.number ? <Check className="w-3 h-3 lg:w-4 lg:h-4" /> : s.number}
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-8 lg:w-12 h-0.5 mx-1 lg:mx-2 ${step > s.number ? 'bg-success' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            {step === 1 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-navy-900 font-medium">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="h-12 border-gray-300 focus:border-success focus:ring-success"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-navy-900 font-medium">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="h-12 border-gray-300 focus:border-success focus:ring-success"
                    />
                  </div>
                </div>
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
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full h-12 bg-navy-900 hover:bg-navy-800 text-white font-medium"
                  disabled={!firstName || !lastName || !email}
                >
                  Continue
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-navy-900 font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
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
                  <p className="text-xs text-gray-500">Minimum 8 characters</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-navy-900 font-medium">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-12 border-gray-300 focus:border-success focus:ring-success"
                  />
                </div>
                <div className="flex gap-3">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 h-12 border-gray-300"
                  >
                    Back
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex-1 h-12 bg-navy-900 hover:bg-navy-800 text-white font-medium"
                    disabled={!password || password.length < 8 || password !== confirmPassword}
                  >
                    Continue
                  </Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="householdName" className="text-navy-900 font-medium">Vault Name</Label>
                  <Input
                    id="householdName"
                    type="text"
                    placeholder="e.g., Our Family Finances"
                    value={householdName}
                    onChange={(e) => setHouseholdName(e.target.value)}
                    required
                    className="h-12 border-gray-300 focus:border-success focus:ring-success"
                  />
                  <p className="text-xs text-gray-500">This is how your shared financial space will be named</p>
                </div>
                <div className="flex gap-3">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="flex-1 h-12 border-gray-300"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit"
                    className="flex-1 h-12 bg-success hover:bg-success/90 text-white font-medium"
                    disabled={loading || !householdName}
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Open My Account'}
                  </Button>
                </div>
              </>
            )}
          </form>

          <p className="text-center text-sm text-gray-500 mt-8">
            Already have an account?{' '}
            <Link href="/login" className="text-success font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy-950 flex-col justify-center items-center p-12">
        <div className="max-w-md text-center">
          {/* Balance Preview Card */}
          <div className="bg-navy-900 rounded-2xl p-6 border border-navy-800 mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm">Total Balance</span>
              <span className="text-success text-sm font-medium">+2.4%</span>
            </div>
            <p className="text-3xl font-bold text-white">$242,000</p>
            
            {/* Mini Progress Bars */}
            <div className="mt-6 space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Savings Goal</span>
                  <span className="text-white">75%</span>
                </div>
                <div className="h-2 bg-navy-800 rounded-full">
                  <div className="h-2 bg-success rounded-full" style={{ width: '75%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Investment Goal</span>
                  <span className="text-white">45%</span>
                </div>
                <div className="h-2 bg-navy-800 rounded-full">
                  <div className="h-2 bg-success rounded-full" style={{ width: '45%' }} />
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">
            Start building your financial future today
          </h2>
          <p className="text-gray-400">
            Join couples who trust Moneypilot to manage their finances together.
          </p>
        </div>
      </div>
    </div>
  )
}
