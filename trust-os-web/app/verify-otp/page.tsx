'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase'
import { useRouter } from 'next/navigation'

export default function VerifyOtpPage() {
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [email, setEmail] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setEmail(user.email || null)
            }
        }
        getUser()
    }, [])

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (!email) {
            setError('User email not found. Please login again.')
            setLoading(false)
            return
        }

        const { error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'signup'
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            // Refresh session to update email_confirmed_at
            await supabase.auth.refreshSession()
            router.push('/dashboard')
            router.refresh()
        }
    }

    const handleResend = async () => {
        if (!email) return
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email
        })
        if (error) alert(error.message)
        else alert('Verification code resent!')
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                        🔐
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Verify Your Email</h1>
                    <p className="text-gray-400 text-sm">
                        Enter the 6-digit code sent to <span className="text-white font-mono">{email}</span>
                    </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-6">
                    <div>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="123456"
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-center text-2xl tracking-widest font-mono focus:outline-none focus:border-blue-500 transition"
                            maxLength={6}
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Verifying...' : 'Verify Code'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={handleResend}
                        className="text-sm text-gray-500 hover:text-white transition"
                    >
                        Didn't receive code? Resend
                    </button>
                </div>
            </div>
        </div>
    )
}
