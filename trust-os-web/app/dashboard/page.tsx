'use client'

import Sidebar from '@/components/Sidebar'
import Modal from '@/components/Modal'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase'
import Link from 'next/link'

import { useToast } from '@/components/Toast'

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState('javascript')
    const [metrics, setMetrics] = useState({
        verifications: 0,
        memories: 0,
        images: 0
    })
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newProjectName, setNewProjectName] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const { showToast } = useToast()

    const supabase = useMemo(() => createClient(), [])

    const [apiKey, setApiKey] = useState('sk-layers-...')

    const [credits, setCredits] = useState(0)

    const [userEmail, setUserEmail] = useState('')

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                // Redirect if not logged in
                window.location.href = '/login'
                return
            }
            setUserEmail(session.user.email || 'User')
        }
        checkUser()
    }, [supabase])

    useEffect(() => {
        const fetchMetrics = async () => {
            // ... (existing metrics fetch logic) ...

            // Fetch real API key prefix
            const { data: { session } } = await supabase.auth.getSession()

            if (session?.user) {
                // ... (existing key fetch logic) ...

                // Fetch Real Credits
                const { data: users, error: creditsError } = await supabase
                    .from('users')
                    .select('credits')
                    .eq('id', session.user.id)
                    .single()

                if (creditsError) {
                    console.error('Error fetching credits:', JSON.stringify(creditsError, null, 2))
                }

                if (users) {
                    setCredits(users.credits)
                }
            }
        }

        fetchMetrics()
    }, [supabase])

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newProjectName) return

        setIsCreating(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.access_token) {
                showToast("Authentication required", 'error')
                return
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/keys`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ name: newProjectName })
            })

            if (res.ok) {
                const data = await res.json()
                // Show the FULL key returned by creation endpoint
                showToast(`Project Created! API Key: ${data.api_key}`, 'success')
                // Update local state with masked version
                setApiKey(`sk-layers-${data.api_key.substring(0, 4)}...`)
                setIsModalOpen(false)
                setNewProjectName('')
            } else {
                showToast("Failed to create project", 'error')
            }
        } catch (e) {
            console.error('Error creating project:', e)
            showToast("Error creating project", 'error')
        } finally {
            setIsCreating(false)
        }
    }

    const codeSnippets = {
        javascript: `import { Layers } from '@trust-os/sdk'

const layers = new Layers({ apiKey: "YOUR_API_KEY_HERE" })

// 1. Verify a Claim
const verification = await layers.trust.verify("The moon is made of cheese")

// 2. Save a Memory
await layers.memory.add("User prefers dark mode")

// 3. Scan an Image
const scan = await layers.vision.scan("./id_card.jpg")`,
        python: `from layers import Layers

client = Layers(api_key="YOUR_API_KEY_HERE")

# 1. Verify a Claim
verification = client.trust.verify("The moon is made of cheese")

# 2. Save a Memory
client.memory.add("User prefers dark mode")

# 3. Scan an Image
scan = client.vision.scan("./id_card.jpg")`
    }

    return (
        <div className="min-h-screen bg-black text-white flex">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                {/* ... header ... */}
                <header className="mb-12 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Overview</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <p className="text-gray-400">Welcome back, {userEmail.split('@')[0]}.</p>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-900/30 text-green-400 border border-green-500/30">
                                🎁 {credits} Credits Available
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <Link href="/docs" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition flex items-center justify-center">
                            Documentation
                        </Link>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold transition shadow-lg shadow-blue-900/20"
                        >
                            New Project
                        </button>
                    </div>
                </header>

                {/* Quick Start Section */}
                <section className="mb-12 grid md:grid-cols-2 gap-6">
                    {/* SDK Card */}
                    <div className="group relative bg-[#0c0c0c] border border-white/10 rounded-2xl overflow-hidden shadow-2xl hover:border-white/20 transition duration-500">
                        {/* Ambient Glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[80px] pointer-events-none" />

                        {/* Header */}
                        <div className="relative p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <div className="flex items-center gap-4">
                                {/* macOS Dots */}
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                                </div>
                                <div className="text-xs font-mono text-gray-500 flex items-center gap-2">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 17l6-6-6-6M12 19h8" /></svg>
                                    Universal SDK
                                </div>
                            </div>

                            {/* Language Switcher */}
                            <div className="flex bg-black/50 rounded-lg p-1 border border-white/10">
                                <button
                                    onClick={() => setActiveTab('javascript')}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition ${activeTab === 'javascript' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-600 hover:text-gray-400'}`}
                                >
                                    JS
                                </button>
                                <button
                                    onClick={() => setActiveTab('python')}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition ${activeTab === 'python' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' : 'text-gray-600 hover:text-gray-400'}`}
                                >
                                    PY
                                </button>
                            </div>
                        </div>

                        {/* Code Area */}
                        <div className="relative p-0 bg-black/40 h-64 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                            <pre className="p-6 font-mono text-sm leading-relaxed">
                                <code className="text-gray-300 whitespace-pre">
                                    {codeSnippets[activeTab as keyof typeof codeSnippets]}
                                </code>
                            </pre>

                            {/* Copy Button */}
                            <button
                                onClick={() => {
                                    const snippet = codeSnippets[activeTab as keyof typeof codeSnippets]
                                    navigator.clipboard.writeText(snippet)
                                    showToast("Code copied!", 'success')
                                }}
                                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition opacity-0 group-hover:opacity-100 border border-white/5"
                                title="Copy to Clipboard"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            </button>
                        </div>
                    </div>

                    {/* Extension Card */}
                    <div className="bg-gradient-to-br from-blue-900/10 to-black border border-blue-500/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-6 border-b border-white/5">
                            <h2 className="text-xl font-bold text-white">Browser Extension</h2>
                            <p className="text-gray-400 text-sm">For Humans (No Code)</p>
                        </div>
                        <div className="p-8 flex-1 flex flex-col justify-center items-center text-center space-y-6">
                            <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-400">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2">Layers for Chrome</h3>
                                <p className="text-gray-400 text-sm max-w-xs mx-auto">
                                    Verify facts and save memories directly on ChatGPT, Claude, and X.
                                </p>
                            </div>
                            <a
                                href="https://chrome.google.com/webstore/detail/your-extension-id"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition transform hover:scale-105 shadow-lg inline-block"
                            >
                                Download Extension
                            </a>                            <p className="text-xs text-gray-500">Version 1.1 • Requires API Key</p>
                        </div>
                    </div>
                </section>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="p-6 bg-white/5 border border-white/10 rounded-xl hover:border-blue-500/30 transition group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-blue-900/20 rounded-lg text-blue-400">🛡️</div>
                            <span className="text-xs text-gray-500 font-mono">TRUST OS</span>
                        </div>
                        <div className="text-3xl font-bold mb-1">{metrics.verifications.toLocaleString()}</div>
                        <div className="text-sm text-gray-400">Verifications this month</div>
                    </div>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-xl hover:border-purple-500/30 transition group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-purple-900/20 rounded-lg text-purple-400">🧠</div>
                            <span className="text-xs text-gray-500 font-mono">SYNAPSE</span>
                        </div>
                        <div className="text-3xl font-bold mb-1">{metrics.memories.toLocaleString()}</div>
                        <div className="text-sm text-gray-400">Memories stored</div>
                    </div>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-xl hover:border-red-500/30 transition group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-red-900/20 rounded-lg text-red-400">📸</div>
                            <span className="text-xs text-gray-500 font-mono">VERISNAP</span>
                        </div>
                        <div className="text-3xl font-bold mb-1">{metrics.images.toLocaleString()}</div>
                        <div className="text-sm text-gray-400">Images scanned</div>
                    </div>
                </div>

                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="Create New Project"
                >
                    <form onSubmit={handleCreateProject} className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Project Name</label>
                            <input
                                autoFocus
                                type="text"
                                className="w-full p-3 rounded-lg bg-black/50 border border-white/10 focus:border-blue-500 outline-none text-sm text-white"
                                placeholder="e.g. My Awesome App"
                                value={newProjectName}
                                onChange={e => setNewProjectName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isCreating}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold transition disabled:opacity-50"
                            >
                                {isCreating ? 'Creating...' : 'Create Project'}
                            </button>
                        </div>
                    </form>
                </Modal>
            </main>
        </div>
    )
}
