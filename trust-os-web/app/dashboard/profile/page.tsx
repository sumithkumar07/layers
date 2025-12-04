
'use client'

import Sidebar from '@/components/Sidebar'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase'
import { useToast } from '@/components/Toast'

interface User {
    id: string
    name: string
    email: string
    credits: number
}

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null)
    const [apiKey, setApiKey] = useState('Loading...')
    const supabase = useMemo(() => createClient(), [])
    const { showToast } = useToast()
    const router = useRouter()

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (!authUser) {
                showToast("Not authenticated. Please log in.", 'error')
                router.push('/login')
                return
            }

            // 1. Fetch User (Credits, Name, Email)
            const { data: users, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .single()

            if (userError) {
                console.error('Failed to fetch user:', userError)
                showToast("Failed to load profile data", 'error')
                return
            } setUser(users)

            // 2. Fetch API Key
            const { data: keys, error: keyError } = await supabase
                .from('api_keys')
                .select('prefix')
                .eq('user_id', authUser.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            if (keyError || !keys) {
                setApiKey('No API Key found')
            } else {
                setApiKey(keys.prefix)
            }
        }
        fetchData()
    }, [])

    const handleBilling = () => {
        // In a real app, this would go to Stripe Customer Portal
        // For now, we redirect to the pricing page to upgrade/view plans
        router.push('/pricing')
    }

    const getPlanName = (credits: number) => {
        if (credits > 10000) return "Enterprise"
        if (credits > 1000) return "Pro Plan"
        return "Starter Plan"
    }

    return (
        <div className="min-h-screen bg-black text-white flex">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <header className="mb-8 border-b border-white/10 pb-8">
                    <h1 className="text-3xl font-bold">Account Settings</h1>
                    <p className="text-gray-400 mt-2">Manage your profile, billing, and API preferences.</p>
                </header>

                <div className="max-w-4xl space-y-8">
                    {/* Profile Card */}
                    <section className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h2 className="text-xl font-bold mb-6">Profile</h2>
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold">
                                {user?.name ? user.name[0].toUpperCase() : 'U'}
                            </div>
                            <div>
                                <div className="font-bold text-lg">{user?.name || 'User #' + (user?.id || '...')}</div>
                                <div className="text-gray-400">{user?.email || 'No email linked'}</div>
                                <button className="mt-3 text-sm text-blue-400 hover:text-blue-300 transition">Change Avatar</button>
                            </div>
                        </div>
                    </section>

                    {/* Plan & Billing */}
                    <section className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold">Current Plan</h2>
                                <p className="text-gray-400 text-sm mt-1">You are on the <span className="text-white font-bold">{user ? getPlanName(user.credits) : 'Loading...'}</span>.</p>
                            </div>
                            <button
                                onClick={handleBilling}
                                className="px-4 py-2 bg-white text-black rounded-lg font-bold text-sm hover:bg-gray-200 transition"
                            >
                                Manage Billing
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="p-4 bg-black/30 rounded-lg border border-white/5">
                                <div className="text-xs text-gray-500 uppercase">Credits Left</div>
                                <div className="text-2xl font-mono font-bold text-blue-400">
                                    {user?.credits != null ? user.credits.toLocaleString() : '...'}
                                </div>                            </div>
                            <div className="p-4 bg-black/30 rounded-lg border border-white/5">
                                <div className="text-xs text-gray-500 uppercase">Next Bill</div>
                                <div className="text-2xl font-mono font-bold text-white">Lifetime</div>
                            </div>
                            <div className="p-4 bg-black/30 rounded-lg border border-white/5">
                                <div className="text-xs text-gray-500 uppercase">Status</div>
                                <div className="text-2xl font-mono font-bold text-green-400">Active</div>
                            </div>
                        </div>
                    </section>

                    {/* API Settings */}
                    <section className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h2 className="text-xl font-bold mb-4">Universal API Key</h2>
                        <p className="text-gray-400 text-sm mb-6">This key grants access to Trust OS, Supermemory, and VeriSnap.</p>

                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={apiKey}
                                disabled
                                className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-3 font-mono text-gray-300"
                            />
                            <button
                                onClick={() => {
                                    if (apiKey === 'Loading...' || apiKey === 'No API Key found') {
                                        showToast("No valid API key to copy", 'error')
                                        return
                                    }
                                    navigator.clipboard.writeText(apiKey)
                                        .then(() => showToast("API Key copied!", 'success'))
                                        .catch(() => showToast("Failed to copy", 'error'))
                                }}
                                disabled={apiKey === 'Loading...' || apiKey === 'No API Key found'}
                                className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg font-bold transition"
                            >
                                Copy
                            </button>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    )
}
