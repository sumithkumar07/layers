'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const TABS = ['Trust OS', 'Supermemory', 'VeriSnap']
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function DemoSection() {
    const [activeTab, setActiveTab] = useState('Trust OS')
    const [status, setStatus] = useState('idle') // idle, loading, success, error
    const [result, setResult] = useState<any>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const handleVerify = async () => {
        setStatus('loading')
        setResult(null)
        try {
            const res = await fetch(`${API_BASE_URL}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ claim: "The moon is made of green cheese." })
            })
            const data = await res.json()
            setResult(data)
            setStatus('success')
        } catch (e) {
            console.error(e)
            setStatus('error')
        }
    }

    const handleRecall = async () => {
        setStatus('loading')
        setResult(null)
        try {
            // First, ensure we have a memory to find
            const addRes = await fetch(`${API_BASE_URL}/memory/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: "User mentioned their favorite color is Blue during the onboarding session." })
            })
            if (!addRes.ok) {
                throw new Error(`Failed to add memory: ${addRes.status}`)
            }

            // Then query it (Corrected endpoint: /search)
            const res = await fetch(`${API_BASE_URL}/memory/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: "What is my favorite color?" })
            })
            if (!res.ok) {
                throw new Error(`Failed to search memory: ${res.status}`)
            }
            const data = await res.json()
            setResult(data)
            setStatus('success')
        } catch (e) {
            console.error(e)
            setStatus('error')
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0])
            setResult(null)
            setStatus('idle')
        }
    }

    const handleScan = async () => {
        if (!selectedFile) return

        setStatus('loading')
        setResult(null)

        const formData = new FormData()
        formData.append('file', selectedFile)

        try {
            const res = await fetch(`${API_BASE_URL}/images/verify`, {
                method: 'POST',
                body: formData
            })
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`)
            }
            const data = await res.json()
            setResult(data)
            setStatus('success')
        } catch (e) {
            console.error(e)
            setStatus('error')
        }
    }

    return (
        <section className="py-24 px-6 bg-black/50 relative overflow-hidden">
            <div className="max-w-4xl mx-auto relative z-10">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">Try it Live</h2>
                    <p className="text-gray-400">See how Layers processes data in real-time.</p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mb-12">
                    <div className="bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-sm">
                        {TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab); setStatus('idle'); setResult(null); setSelectedFile(null) }}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition relative ${activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {activeTab === tab && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-white/10 rounded-full"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10">{tab}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Demo Content */}
                <div className="bg-black/40 border border-white/10 rounded-2xl p-8 min-h-[400px] backdrop-blur-md relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="h-full flex flex-col items-center justify-center text-center"
                        >
                            {activeTab === 'Trust OS' && (
                                <div className="w-full max-w-md">
                                    <div className="text-6xl mb-6">🛡️</div>
                                    <h3 className="text-2xl font-bold mb-4">Verify a Claim</h3>
                                    <div className="bg-white/5 p-4 rounded-lg mb-6 text-left border border-white/10">
                                        <div className="text-xs text-gray-500 mb-2">INPUT</div>
                                        <div className="font-mono text-gray-300">"The moon is made of green cheese."</div>
                                    </div>
                                    <button
                                        onClick={handleVerify}
                                        disabled={status === 'loading'}
                                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition disabled:opacity-50"
                                    >
                                        {status === 'loading' ? 'Verifying...' : 'Verify Claim'}
                                    </button>
                                    {status === 'success' && result && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className={`mt-8 p-4 border rounded-lg ${result.result === 'TRUE' ? 'bg-green-900/20 border-green-500/50 text-green-200' : 'bg-red-900/20 border-red-500/50 text-red-200'}`}
                                        >
                                            <strong>VERDICT: {result.result}</strong>
                                            <p className="text-sm mt-1 opacity-80">Confidence: {((result.confidence ?? 0) * 100).toFixed(1)}%</p>
                                            {result.evidence && <p className="text-xs mt-2 text-gray-400 italic line-clamp-2">{result.evidence}</p>}
                                        </motion.div>
                                    )}                                    {status === 'error' && <p className="text-red-500 mt-4">Error connecting to backend.</p>}
                                </div>
                            )}

                            {activeTab === 'Supermemory' && (
                                <div className="w-full max-w-md">
                                    <div className="text-6xl mb-6">🧠</div>
                                    <h3 className="text-2xl font-bold mb-4">Recall Context</h3>
                                    <div className="bg-white/5 p-4 rounded-lg mb-6 text-left border border-white/10">
                                        <div className="text-xs text-gray-500 mb-2">QUERY</div>
                                        <div className="font-mono text-gray-300">"What is my favorite color?"</div>
                                    </div>
                                    <button
                                        onClick={handleRecall}
                                        disabled={status === 'loading'}
                                        className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold transition disabled:opacity-50"
                                    >
                                        {status === 'loading' ? 'Searching...' : 'Recall Memory'}
                                    </button>
                                    {status === 'success' && result && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="mt-8 p-4 bg-purple-900/20 border border-purple-500/50 rounded-lg text-purple-200"
                                        >
                                            <strong>FOUND: {result.results?.length || 0} Memories</strong>
                                            {result.results?.[0]?.content && (
                                                <p className="text-sm mt-1 opacity-80">"{result.results[0].content}"</p>
                                            )}
                                        </motion.div>
                                    )}
                                    {status === 'error' && <p className="text-red-500 mt-4">Error connecting to backend.</p>}
                                </div>
                            )}

                            {activeTab === 'VeriSnap' && (
                                <div className="w-full max-w-md">
                                    <div className="text-6xl mb-6">📸</div>
                                    <h3 className="text-2xl font-bold mb-4">Forensic Scan</h3>
                                    <div className="bg-white/5 p-4 rounded-lg mb-6 text-left border border-white/10 flex items-center gap-4">
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            className="block w-full text-sm text-gray-400
                                                file:mr-4 file:py-2 file:px-4
                                                file:rounded-full file:border-0
                                                file:text-sm file:font-semibold
                                                file:bg-white/10 file:text-white
                                                hover:file:bg-white/20
                                            "
                                        />
                                    </div>
                                    <button
                                        onClick={handleScan}
                                        disabled={status === 'loading' || !selectedFile}
                                        className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {status === 'loading' ? 'Scanning...' : 'Run Forensics'}
                                    </button>
                                    {status === 'success' && result && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className={`mt-8 p-4 border rounded-lg ${result.status === 'REAL' ? 'bg-green-900/20 border-green-500/50 text-green-200' : 'bg-red-900/20 border-red-500/50 text-red-200'}`}
                                        >
                                            <strong>{result.status} (Score: {result.score ?? 'N/A'})</strong>
                                            <ul className="text-sm mt-2 text-left list-disc pl-4 opacity-80">
                                                {result.flags && result.flags.map((flag: string, i: number) => (
                                                    <li key={i}>{flag}</li>
                                                ))}
                                                {result.flags && result.flags.length === 0 && <li>No manipulation detected.</li>}
                                            </ul>
                                        </motion.div>
                                    )}
                                    {status === 'error' && <p className="text-red-500 mt-4">Error connecting to backend.</p>}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </section >
    )
}
