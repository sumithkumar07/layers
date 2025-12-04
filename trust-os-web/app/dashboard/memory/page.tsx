'use client'

import Sidebar from '@/components/Sidebar'
import { useToast } from '@/components/Toast'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase'

interface MemoryItem {
    id: string
    content: string
    created_at?: string
}

const VECTOR_LIMIT = 10000

export default function MemoryPage() {
    const [activeTab, setActiveTab] = useState<'add' | 'search'>('search')
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<MemoryItem[]>([])
    const [content, setContent] = useState('')
    const [stats, setStats] = useState({ total: 0 })
    const { showToast } = useToast()
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        const fetchStats = async () => {
            const { count } = await supabase
                .from('memories')
                .select('*', { count: 'exact', head: true })
            setStats({ total: count || 0 })
        }
        fetchStats()
    }, [])

    const handleSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) return
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/memory/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ query: searchQuery })
            })
            if (!res.ok) throw new Error('Search failed')
            const data = await res.json()
            setResults(data.results || [])
        } catch (e) {
            console.error(e)
            showToast('Search failed', 'error')
        }
    }

    return (
        <div className="min-h-screen bg-black text-white flex">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                {/* ... header ... */}
                <header className="mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <span className="text-purple-500">🧠</span> Synapse
                    </h1>
                    <div className="flex items-center gap-3 mt-2">
                        <p className="text-gray-400">Long-term semantic memory for your agents.</p>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-900/30 text-purple-400 border border-purple-500/30">
                            🎁 2.5 Million Tokens Included
                        </span>
                    </div>
                </header>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Interface */}
                    <div className="lg:col-span-2">
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 min-h-[500px]">
                            {/* Tabs */}
                            <div className="flex gap-4 mb-8 border-b border-white/10 pb-4">
                                <button
                                    onClick={() => setActiveTab('search')}
                                    className={`text-sm font-bold pb-1 transition ${activeTab === 'search' ? 'text-white border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    Explorer
                                </button>
                                <button
                                    onClick={() => setActiveTab('add')}
                                    className={`text-sm font-bold pb-1 transition ${activeTab === 'add' ? 'text-white border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    Add Memory
                                </button>
                            </div>

                            {activeTab === 'search' ? (
                                <div className="space-y-6">
                                    <div className="relative">
                                        <input
                                            className="w-full p-4 pl-12 rounded-lg bg-black/50 border border-white/10 focus:border-purple-500 outline-none text-sm"
                                            placeholder="Search your second brain..."
                                            value={query}
                                            onChange={async e => {
                                                setQuery(e.target.value)
                                                if (e.target.value.length > 2) {
                                                    await handleSearch(e.target.value)
                                                }
                                            }}
                                            onKeyDown={async e => {
                                                if (e.key === 'Enter') {
                                                    await handleSearch(query)
                                                }
                                            }}
                                        />
                                        <span className="absolute left-4 top-4 text-gray-500">🔍</span>
                                    </div>

                                    <div className="space-y-4">
                                        {results.map((item) => (
                                            <div key={item.id} className="p-4 rounded-lg bg-white/5 border border-white/5 hover:border-purple-500/30 transition cursor-pointer group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-xs text-purple-400 bg-purple-900/20 px-2 py-0.5 rounded">Memory #{item.id?.slice(0, 8)}</span>
                                                    <span className="text-xs text-gray-500">Just now</span>                                                </div>
                                                <p className="text-sm text-gray-300 group-hover:text-white transition">
                                                    {item.content}
                                                </p>
                                            </div>
                                        ))}
                                        {results.length === 0 && query && (
                                            <div className="text-center text-gray-500 py-8">No memories found.</div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Content to Store</label>
                                        <textarea
                                            className="w-full p-4 rounded-lg bg-black/50 border border-white/10 focus:border-purple-500 outline-none text-sm min-h-[200px]"
                                            placeholder="Paste text, code, or notes here..."
                                            value={content}
                                            onChange={e => setContent(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={async () => {
                                                if (!content.trim()) {
                                                    showToast("Please enter content to save.", 'error')
                                                    return
                                                }
                                                try {
                                                    const { data: { session } } = await supabase.auth.getSession()
                                                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/memory/add`, {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                            'Authorization': `Bearer ${session?.access_token}`
                                                        },
                                                        body: JSON.stringify({ content })
                                                    })
                                                    if (!res.ok) throw new Error('Failed to save')
                                                    showToast("Memory saved!", 'success')
                                                    setContent('')
                                                    setActiveTab('search')

                                                    // Refresh stats
                                                    const { count } = await supabase
                                                        .from('memories')
                                                        .select('*', { count: 'exact', head: true })
                                                    setStats({ total: count || 0 })
                                                } catch (e) {
                                                    showToast("Failed to save memory.", 'error')
                                                }
                                            }} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-bold transition"
                                        >
                                            Save to Brain
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-900/20 to-transparent border border-purple-500/20">
                            <h3 className="font-bold text-purple-400 mb-2">Vector Status</h3>
                            <div className="flex items-end gap-2 mb-1">
                                <span className="text-3xl font-bold text-white">{stats.total.toLocaleString()}</span>
                                <span className="text-sm text-gray-400 mb-1">vectors</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min((stats.total / VECTOR_LIMIT) * 100, 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <p className="text-xs text-gray-500">{Math.min((stats.total / VECTOR_LIMIT) * 100, 100).toFixed(1)}% Used</p>
                                <p className="text-xs text-purple-400 font-bold">2.5 Million Tokens Included</p>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <h3 className="font-bold text-white mb-4">Collections</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Default</span>
                                    <span className="text-gray-500">{stats.total.toLocaleString()}</span>
                                </div>

                            </div>
                            <button className="w-full mt-4 py-2 rounded border border-white/10 text-xs text-gray-400 hover:bg-white/5 transition">
                                + New Collection
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
