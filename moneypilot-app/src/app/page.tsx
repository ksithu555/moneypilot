'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Wallet, 
  ArrowRight,
  BarChart3,
  Shield,
  Zap
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-navy-950">
      {/* Header */}
      <header className="border-b border-navy-800/50 bg-navy-950/95 backdrop-blur sticky top-0 z-50">
        <div className="container flex h-14 lg:h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-success" />
            <span className="text-lg lg:text-xl font-bold text-white">Moneypilot</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#benefits" className="text-sm text-gray-400 hover:text-white transition-colors">
              Benefits
            </Link>
            <Link href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">
              Pricing
            </Link>
          </nav>
          <nav className="flex items-center gap-2 lg:gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-navy-800 text-sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-success hover:bg-success/90 text-white text-sm">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1f4e_1px,transparent_1px),linear-gradient(to_bottom,#1a1f4e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        
        <div className="container relative py-12 sm:py-16 md:py-24 lg:py-32 px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Secure your{' '}
                <span className="text-success">financial future</span>{' '}
                with Moneypilot.
              </h1>
              <p className="mt-4 lg:mt-6 text-base lg:text-lg text-gray-400 max-w-lg mx-auto lg:mx-0">
                Professional-grade wealth management tools designed for the modern couple. Master your money, achieve your dreams.
              </p>
              <div className="mt-8 lg:mt-10 flex flex-col sm:flex-row gap-3 lg:gap-4 justify-center lg:justify-start">
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="bg-success hover:bg-success/90 text-white px-8 w-full sm:w-auto">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#features" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="border-gray-600 text-white hover:bg-navy-800 w-full sm:w-auto">
                    Explore Features
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Content - Balance Card */}
            <div className="relative hidden sm:block">
              <div className="bg-navy-900 rounded-2xl p-6 lg:p-8 border border-navy-800">
                <p className="text-gray-400 text-sm">Total Balance</p>
                <p className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white mt-2">¥1,248,500</p>
                
                {/* Mini Chart Placeholder */}
                <div className="mt-6 lg:mt-8 flex items-end gap-1 lg:gap-2 h-24 lg:h-32">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((height, i) => (
                    <div 
                      key={i}
                      className="flex-1 bg-success/20 rounded-t"
                      style={{ height: `${height}%` }}
                    >
                      <div 
                        className="w-full bg-success rounded-t"
                        style={{ height: `${Math.min(100, height + 10)}%` }}
                      />
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 flex items-center justify-between text-sm">
                  <span className="text-gray-400">Jan</span>
                  <span className="text-gray-400">Dec</span>
                </div>
              </div>
              
              {/* Floating Stats */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Monthly Growth</p>
                    <p className="text-lg font-bold text-navy-900">+12.5%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-navy-900 py-12 lg:py-20">
        <div className="container px-4">
          <div className="text-center mb-10 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              Why choose Moneypilot?
            </h2>
            <p className="mt-3 lg:mt-4 text-sm lg:text-base text-gray-400 max-w-2xl mx-auto">
              Built for couples who want to take control of their financial future together.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
            <div className="bg-navy-950 rounded-xl lg:rounded-2xl p-5 lg:p-8 border border-navy-800">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-success/10 rounded-lg lg:rounded-xl flex items-center justify-center mb-4 lg:mb-6">
                <Shield className="w-5 h-5 lg:w-6 lg:h-6 text-success" />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold text-white mb-2 lg:mb-3">Secure & Private</h3>
              <p className="text-sm lg:text-base text-gray-400">
                Bank-level encryption keeps your financial data safe.
              </p>
            </div>

            <div className="bg-navy-950 rounded-xl lg:rounded-2xl p-5 lg:p-8 border border-navy-800">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-success/10 rounded-lg lg:rounded-xl flex items-center justify-center mb-4 lg:mb-6">
                <BarChart3 className="w-5 h-5 lg:w-6 lg:h-6 text-success" />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold text-white mb-2 lg:mb-3">Smart Analytics</h3>
              <p className="text-sm lg:text-base text-gray-400">
                AI-powered insights help you understand spending patterns.
              </p>
            </div>

            <div className="bg-navy-950 rounded-xl lg:rounded-2xl p-5 lg:p-8 border border-navy-800 sm:col-span-2 lg:col-span-1">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-success/10 rounded-lg lg:rounded-xl flex items-center justify-center mb-4 lg:mb-6">
                <Zap className="w-5 h-5 lg:w-6 lg:h-6 text-success" />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold text-white mb-2 lg:mb-3">Quick Input</h3>
              <p className="text-sm lg:text-base text-gray-400">
                Log expenses in seconds from your phone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-950 border-t border-navy-800 py-8 lg:py-12">
        <div className="container px-4">
          <div className="flex flex-col items-center gap-4 lg:gap-6 text-center">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-success" />
              <span className="font-semibold text-white">Moneypilot</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-8">
              <Link href="#" className="text-xs lg:text-sm text-gray-400 hover:text-white">Privacy</Link>
              <Link href="#" className="text-xs lg:text-sm text-gray-400 hover:text-white">Terms</Link>
              <Link href="#" className="text-xs lg:text-sm text-gray-400 hover:text-white">Contact</Link>
            </div>
            <p className="text-xs lg:text-sm text-gray-500">
              &copy; 2024 Moneypilot
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
