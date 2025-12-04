'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
            },
        })

        if (error) {
            alert(error.message)
        } else {
            // Redirect to OTP verification page
            router.push('/verify-otp')
        }
        setLoading(false)
    }

    const handleSocialLogin = async (provider: 'google' | 'github') => {
        setLoading(true)
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${location.origin}/auth/callback`,
                },
            })
            if (error) {
                console.error("Social Login Error:", error)
                if (error.message.includes("provider is not enabled")) {
                    alert(`⚠️ Setup Required: Please enable ${provider.toUpperCase()} in your Supabase Dashboard under Authentication -> Providers.`)
                } else {
                    alert(error.message)
                }
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex bg-black text-white">

            {/* Left Side: Visuals */}
            <div className="hidden lg:flex w-1/2 bg-black relative overflow-hidden items-center justify-center p-12">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/40 via-black to-black" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[100px]" />

                <div className="relative z-10 max-w-lg">
                    <div className="mb-8">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-black font-bold text-xl mb-6">L</div>
                        <h1 className="text-5xl font-bold mb-6 leading-tight">
                            Join the Trust <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Revolution.</span>
                        </h1>
                        <p className="text-xl text-gray-400 leading-relaxed">
                            "Build agents that users can trust. Verify every thought, action, and memory."
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
                <div className="absolute top-8 right-8">
                    <Link href="/" className="text-sm text-gray-400 hover:text-white transition">Back to Home</Link>
                </div>

                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold mb-2">Create Account</h2>
                        <p className="text-gray-400">Start building trusted agents today.</p>
                    </div>

                    {/* Social Login (Deferred for MVP) */}
                    {/*
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => handleSocialLogin('google')}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition font-medium text-sm"
                        >
                            <span>G</span> Google
                        </button>
                        <button
                            onClick={() => handleSocialLogin('github')}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition font-medium text-sm"
                        >
                            <span>🐙</span> GitHub
                        </button>
                    </div>
                    */}

                    {/*
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-black text-gray-500">Or sign up with email</span>
                        </div>
                    </div>
                    */}

                    <form onSubmit={handleSignup} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                            <input
                                type="email"
                                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 focus:border-purple-500 outline-none transition"
                                placeholder="name@company.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                            <input
                                type="password"
                                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 focus:border-purple-500 outline-none transition"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-500 font-bold text-white transition shadow-lg shadow-purple-900/20"
                        >
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500">
                        Already have an account? <Link href="/login" className="text-purple-400 hover:underline">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
