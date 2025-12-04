'use client'

import Sidebar from '@/components/Sidebar'
import { useToast } from '@/components/Toast'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase'

export default function TrustPage() {
    const [claim, setClaim] = useState('')
    const [result, setResult] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [stats, setStats] = useState({ daily: 0 })
    const [recentLogs, setRecentLogs] = useState<any[]>([])
    const [credits, setCredits] = useState(0)

    const { showToast } = useToast()
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    console.error('No authenticated user')
                    return
                }

                // 1. Fetch Stats (user-specific)
                const { count } = await supabase
                    .from('logs')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                setStats({ daily: count || 0 })

                // 2. Fetch Recent Logs (user-specific)
                const { data } = await supabase
                    .from('logs')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(3)
                if (data) setRecentLogs(data)

                // 3. Fetch Credits
                const { data: users, error: usersError } = await supabase
                    .from('users')
                    .select('credits')
                    .eq('id', user.id)
                    .maybeSingle()
                if (usersError) {
                    console.error('Error fetching credits:', usersError)
                    setCredits(0)
                } else if (users) {
                    setCredits(users.credits)
                }


            } catch (error) {
                console.error('Error fetching data:', error)
                showToast('Failed to load dashboard data', 'error')
            }
        }
        fetchData()
    }, [supabase, showToast])

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()

        if (credits <= 0) {
            showToast('Insufficient credits to verify claim', 'error')
            return
        }

        setLoading(true)
        setResult(null)

        try {
            const { data: { session } } = await supabase.auth.getSession()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ claim })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.detail || 'Verification failed')
            }

            const data = await res.json()
            setResult(data)
            showToast('Verification complete', 'success')

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Refresh stats & logs & credits
            const { count } = await supabase.from('logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
            setStats({ daily: count || 0 })

            const { data: logs } = await supabase.from('logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3)
            if (logs) setRecentLogs(logs)

            const { data: users } = await supabase.from('users').select('credits').eq('id', user.id).single()
            if (users) setCredits(users.credits)

        } catch (error: any) {
            console.error(error)
            showToast(error.message || "Failed to verify claim.", 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black text-white flex">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <span className="text-blue-500">🛡️</span> Trust OS
                    </h1>
                    <div className="flex items-center gap-3 mt-2">
                        <p className="text-gray-400">Real-time fact checking and hallucination detection.</p>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/30 text-blue-400 border border-blue-500/30">
                            ⚡ {credits} Verifications Available
                        </span>
                    </div>
                </header>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Playground */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-6">Verification Engine</h2>
                            <form onSubmit={handleVerify} className="space-y-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Claim to Verify</label>
                                    <textarea
                                        className="w-full p-4 rounded-lg bg-black/50 border border-white/10 focus:border-blue-500 outline-none text-sm min-h-[120px]"
                                        placeholder="e.g. The James Webb Telescope discovered a new exoplanet yesterday..."
                                        value={claim}
                                        onChange={e => setClaim(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold transition disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {loading ? 'Analyzing...' : 'Verify Claim'}
                                    </button>
                                </div>
                            </form>

                            {result && (
                                <div className="mt-6 p-4 rounded-lg bg-green-900/20 border border-green-500/30 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="text-green-400 font-bold text-lg">VERIFIED TRUE</div>
                                        <div className="text-xs text-gray-400">Confidence: {(result.confidence * 100)}%</div>
                                    </div>
                                    <div className="text-sm text-gray-300">
                                        Sources: {result.sources.join(', ')}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Recent Logs */}
                        <div>
                            <h3 className="text-lg font-bold mb-4">Recent Verifications</h3>
                            <div className="space-y-3">
                                {recentLogs.length > 0 ? recentLogs.map((log) => (
                                    <div key={log.id} className="p-4 rounded-lg bg-white/5 border border-white/5 flex justify-between items-center">
                                        <div>
                                            <div className="text-sm font-medium truncate max-w-[300px]">{log.claim}</div>
                                            <div className="text-xs text-gray-500">{new Date(log.created_at).toLocaleTimeString()}</div>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${log.result === 'True' || log.result === 'REAL' ? 'bg-green-900/20 text-green-400' :
                                            log.result === 'False' || log.result === 'FAKE' ? 'bg-red-900/20 text-red-400' :
                                                'bg-yellow-900/20 text-yellow-400'
                                            }`}>
                                            {log.result?.toUpperCase() || 'UNKNOWN'}
                                        </span>
                                    </div>
                                )) : (
                                    <div className="text-gray-500 text-sm">No recent verifications.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats / Info */}
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-900/20 to-transparent border border-blue-500/20">
                            <h3 className="font-bold text-blue-400 mb-2">How it works</h3>
                            <p className="text-sm text-gray-400 mb-4">
                                Trust OS uses a multi-step process:
                            </p>
                            <ol className="list-decimal list-inside text-sm text-gray-400 space-y-2">
                                <li>Query Decomposition</li>
                                <li>Search (Google/Tavily)</li>
                                <li>Source Ranking</li>
                                <li>Cross-Examination</li>
                            </ol>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <div className="text-xs text-gray-500 uppercase mb-2">Your Total Verifications</div>
                            <div className="text-3xl font-bold">{stats.daily.toLocaleString()}</div>
                            <div className="text-sm text-gray-400">All time</div>                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
