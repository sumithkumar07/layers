'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) alert(error.message)
        else router.push('/dashboard')
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
                {/* Background Gradients */}
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-black to-black" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px]" />

                <div className="relative z-10 max-w-lg">
                    <div className="mb-8">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-black font-bold text-xl mb-6">L</div>
                        <h1 className="text-5xl font-bold mb-6 leading-tight">
                            Give your AI <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Superpowers.</span>
                        </h1>
                        <p className="text-xl text-gray-400 leading-relaxed">
                            "Layers transformed our autonomous agents from hallucinating chatbots into reliable, verifiable workers."
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                            AC
                        </div>
                        <div>
                            <div className="font-bold">Alex Chen</div>
                            <div className="text-sm text-gray-500">CTO, Agentic AI</div>
                        </div>
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
                        <h2 className="text-3xl font-bold mb-2">Welcome back</h2>
                        <p className="text-gray-400">Enter your credentials to access the Trust OS.</p>
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
                            <span className="px-2 bg-black text-gray-500">Or continue with email</span>
                        </div>
                    </div>
                    */}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                            <input
                                type="email"
                                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500 outline-none transition"
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
                                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500 outline-none transition"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold text-white transition shadow-lg shadow-blue-900/20"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500">
                        Don't have an account? <Link href="/signup" className="text-blue-400 hover:underline">Sign up</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
