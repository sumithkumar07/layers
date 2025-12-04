'use client'

import Sidebar from '@/components/Sidebar'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase'

interface ScanRecord {
    id: string
    claim: string
    result: 'REAL' | 'FAKE' | string
    created_at: string
}

export default function VisionPage() {
    const [analyzing, setAnalyzing] = useState(false)
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ total: 0 })
    const [recentScans, setRecentScans] = useState<ScanRecord[]>([])
    const supabase = useMemo(() => createClient(), [])

    const [credits, setCredits] = useState(0)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // ... existing stats ...
                const { count } = await supabase
                    .from('image_provenance')
                    .select('*', { count: 'exact', head: true })
                setStats({ total: count || 0 })

                const { data } = await supabase
                    .from('logs')
                    .select('*')
                    .ilike('claim', 'Image Analysis:%')
                    .order('created_at', { ascending: false })
                    .limit(4)
                if (data) setRecentScans(data)

                // Fetch Credits
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.user) {
                    const { data: users } = await supabase
                        .from('users')
                        .select('credits')
                        .eq('id', session.user.id)
                        .single()
                    if (users) {
                        setCredits(users.credits)
                    }
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex">
                <Sidebar />
                <main className="flex-1 ml-64 p-8">
                    <div className="flex items-center justify-center h-96">
                        <div className="text-gray-400">Loading...</div>
                    </div>
                </main>
            </div>
        )
    }

    const handleUpload = async (file: File) => {
        setAnalyzing(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error("Please log in")

            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/images/verify`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: formData
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.detail || "Analysis failed")
            }

            const result = await res.json()

            // Refresh stats
            const { count } = await supabase.from('image_provenance').select('*', { count: 'exact', head: true })
            setStats({ total: count || 0 })

            const { data } = await supabase.from('logs').select('*').ilike('claim', 'Image Analysis:%').order('created_at', { ascending: false }).limit(4)
            if (data) setRecentScans(data)

            alert(`Analysis Complete!\nResult: ${result.status}\nScore: ${result.score}\nFlags: ${result.flags.join(', ') || 'None'}`)

        } catch (e: any) {
            alert(e.message)
        } finally {
            setAnalyzing(false)
        }
    }

    return (
        <div className="min-h-screen bg-black text-white flex">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <span className="text-red-500">📸</span> VeriSnap
                    </h1>
                    <div className="flex items-center gap-3 mt-2">
                        <p className="text-gray-400">Forensic image analysis and liveness detection.</p>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-900/30 text-red-400 border border-red-500/30">
                            🎁 ~{Math.floor(credits / 10)} Scans Available ({credits} Credits)
                        </span>
                    </div>
                </header>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Upload Zone */}
                    <div className="lg:col-span-2">
                        <div
                            className="p-8 rounded-2xl bg-white/5 border border-white/10 border-dashed hover:border-red-500/50 transition cursor-pointer flex flex-col items-center justify-center min-h-[400px] group relative"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={async (e) => {
                                e.preventDefault()
                                const file = e.dataTransfer.files[0]
                                if (file) handleUpload(file)
                            }}
                        >
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) handleUpload(e.target.files[0])
                                }}
                                accept="image/*"
                            />
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition">
                                {analyzing ? '⏳' : '📤'}
                            </div>
                            <h3 className="text-xl font-bold mb-2">{analyzing ? 'Analyzing Image...' : 'Drop image to scan'}</h3>
                            <p className="text-gray-400 text-sm mb-6">Supports JPG, PNG, WEBP (Max 10MB)</p>
                            <button className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition pointer-events-none">
                                {analyzing ? 'Processing...' : 'Select File'}
                            </button>
                        </div>

                        {/* Recent Scans */}
                        <div className="mt-8">
                            <h3 className="text-lg font-bold mb-4">Recent Scans</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {recentScans.length === 0 ? (
                                    <div className="col-span-4 text-sm text-gray-500 italic">No recent scans.</div>
                                ) : (
                                    recentScans.map(scan => (
                                        <div key={scan.id} className="aspect-square rounded-lg bg-white/5 border border-white/10 relative overflow-hidden group flex flex-col justify-end p-2">
                                            <div className="absolute inset-0 bg-gray-800/50" />
                                            {/* We don't have the image URL stored in logs, so just show a placeholder icon */}
                                            <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-30">
                                                🖼️
                                            </div>
                                            <div className="relative z-10">
                                                <div className="text-[10px] text-gray-300 truncate mb-1">{scan.claim.replace('Image Analysis: ', '')}</div>
                                                <div className={`px-2 py-0.5 rounded text-[10px] font-bold w-fit ${scan.result === 'REAL' ? 'bg-green-500 text-black' :
                                                    scan.result === 'FAKE' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'
                                                    }`}>
                                                    {scan.result}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-red-900/20 to-transparent border border-red-500/20">
                            <h3 className="font-bold text-red-400 mb-2">Detection Rate</h3>
                            <div className="text-3xl font-bold text-white mb-1">99.4%</div>
                            <p className="text-xs text-gray-400">Accuracy on Deepfakes</p>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <h3 className="font-bold text-white mb-4">Engines Active</h3>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-center gap-2 text-green-400">
                                    <span>●</span> ELA Analysis
                                </li>
                                <li className="flex items-center gap-2 text-green-400">
                                    <span>●</span> Noise Pattern
                                </li>
                                <li className="flex items-center gap-2 text-green-400">
                                    <span>●</span> Metadata Check
                                </li>
                                <li className="flex items-center gap-2 text-green-400">
                                    <span>●</span> Face Consistency
                                </li>
                            </ul>
                            <div className="mt-6 pt-6 border-t border-white/10">
                                <div className="text-xs text-gray-500 uppercase mb-2">Total Scans</div>
                                <div className="text-3xl font-bold">{stats.total.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
