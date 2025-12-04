'use client'
import { useState } from 'react'

import { useToast } from '@/components/Toast'

interface VeriSnapModuleProps {
    apiKey: string | null
    refreshUserData: () => void
}

export default function VeriSnapModule({ apiKey, refreshUserData }: VeriSnapModuleProps) {
    const [mode, setMode] = useState<'forensics' | 'liveness'>('forensics')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const { showToast } = useToast()

    // Forensics State
    const [file, setFile] = useState<File | null>(null)

    // Liveness State
    const [livenessFile, setLivenessFile] = useState<File | null>(null)
    const [challenge, setChallenge] = useState<number>(Math.floor(Math.random() * 5) + 1)

    const handleForensics = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!apiKey) return showToast('No API Key', 'error')
        if (!file) return showToast('Please select an image', 'error')

        setLoading(true)
        setResult(null)

        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('http://127.0.0.1:8000/images/verify', {
                method: 'POST',
                headers: {
                    'X-API-Key': apiKey
                },
                body: formData
            })
            const data = await res.json()
            setResult(data)
            refreshUserData()
            showToast('Analysis complete', 'success')
        } catch (err) {
            showToast('Analysis Failed', 'error')
        }
        setLoading(false)
    }

    const handleLiveness = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!apiKey) return showToast('No API Key', 'error')
        if (!livenessFile) return showToast('Please select an image', 'error')

        setLoading(true)
        setResult(null)

        const formData = new FormData()
        formData.append('file', livenessFile)
        formData.append('challenge', challenge.toString())

        try {
            const res = await fetch('http://127.0.0.1:8000/images/liveness', {
                method: 'POST',
                headers: {
                    'X-API-Key': apiKey
                },
                body: formData
            })
            const data = await res.json()
            setResult(data)
            refreshUserData()
            showToast('Liveness check complete', 'success')
        } catch (err) {
            showToast('Liveness Check Failed', 'error')
        }
        setLoading(false)
    }

    return (
        <div className="grid gap-8 lg:grid-cols-2">
            {/* Control Panel */}
            <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">VeriSnap Engine</h2>
                    <div className="flex bg-black/50 rounded-lg p-1 border border-white/10">
                        <button
                            onClick={() => { setMode('forensics'); setResult(null); }}
                            className={`px-3 py-1 text-xs rounded-md transition ${mode === 'forensics' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Forensics
                        </button>
                        <button
                            onClick={() => { setMode('liveness'); setResult(null); }}
                            className={`px-3 py-1 text-xs rounded-md transition ${mode === 'liveness' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Liveness
                        </button>
                    </div>
                </div>

                {mode === 'forensics' ? (
                    <form onSubmit={handleForensics} className="space-y-6">
                        <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-red-500/50 transition bg-black/20">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="hidden"
                                id="forensic-upload"
                            />
                            <label htmlFor="forensic-upload" className="cursor-pointer block">
                                <span className="text-4xl block mb-2">📸</span>
                                <span className="text-sm text-gray-400">
                                    {file ? file.name : 'Click to Upload Image'}
                                </span>
                                <span className="block text-xs text-gray-600 mt-2">Supports JPG, PNG, WebP</span>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Cost: 10 Credits</span>
                            <button
                                type="submit"
                                disabled={loading || !file}
                                className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-bold transition disabled:opacity-50"
                            >
                                {loading ? 'Analyzing...' : 'Run Forensics'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleLiveness} className="space-y-6">
                        <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg text-center">
                            <div className="text-xs text-blue-300 mb-1">Current Challenge</div>
                            <div className="text-2xl font-bold text-white">Show {challenge} Fingers</div>
                            <button
                                type="button"
                                onClick={() => setChallenge(Math.floor(Math.random() * 5) + 1)}
                                className="text-[10px] text-blue-400 hover:text-white mt-2 underline"
                            >
                                New Challenge
                            </button>
                        </div>

                        <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-blue-500/50 transition bg-black/20">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setLivenessFile(e.target.files?.[0] || null)}
                                className="hidden"
                                id="liveness-upload"
                            />
                            <label htmlFor="liveness-upload" className="cursor-pointer block">
                                <span className="text-4xl block mb-2">✋</span>
                                <span className="text-sm text-gray-400">
                                    {livenessFile ? livenessFile.name : 'Upload Selfie / Hand Photo'}
                                </span>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Cost: 5 Credits</span>
                            <button
                                type="submit"
                                disabled={loading || !livenessFile}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold transition disabled:opacity-50"
                            >
                                {loading ? 'Verifying...' : 'Check Liveness'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Results Panel */}
            <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl min-h-[400px]">
                <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-6">Analysis Report</h2>

                {!result ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4 opacity-50">
                        <div className="text-6xl">🧬</div>
                        <p>Waiting for input...</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Status Header */}
                        <div className={`p-4 rounded-xl border ${(result.status === 'REAL' || result.status === 'PASSED') ? 'bg-green-500/10 border-green-500/30' :
                            (result.status === 'SUSPICIOUS') ? 'bg-yellow-500/10 border-yellow-500/30' :
                                'bg-red-500/10 border-red-500/30'
                            }`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-xs opacity-70 uppercase tracking-wider">Verdict</div>
                                    <div className={`text-2xl font-bold ${(result.status === 'REAL' || result.status === 'PASSED') ? 'text-green-400' :
                                        (result.status === 'SUSPICIOUS') ? 'text-yellow-400' : 'text-red-400'
                                        }`}>
                                        {result.status}
                                    </div>
                                </div>
                                {result.score !== undefined && (
                                    <div className="text-right">
                                        <div className="text-xs opacity-70 uppercase tracking-wider">Trust Score</div>
                                        <div className="text-2xl font-mono font-bold text-white">{result.score}/100</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Flags / Details */}
                        {result.flags && result.flags.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-xs font-medium text-gray-400 uppercase">Red Flags</h3>
                                {result.flags.map((flag: string, i: number) => (
                                    <div key={i} className="flex items-center gap-2 text-sm text-red-300 bg-red-900/20 p-2 rounded border border-red-500/20">
                                        <span>⚠️</span>
                                        {flag}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Technical Details Grid */}
                        {result.details && (
                            <div className="grid grid-cols-2 gap-4">
                                {result.details.ela && (
                                    <div className="p-3 bg-black/30 rounded-lg border border-white/5">
                                        <div className="text-[10px] text-gray-500 uppercase mb-1">ELA Variance</div>
                                        <div className="text-sm font-mono">{result.details.ela.mean_diff.toFixed(2)}</div>
                                    </div>
                                )}
                                {result.details.noise && (
                                    <div className="p-3 bg-black/30 rounded-lg border border-white/5">
                                        <div className="text-[10px] text-gray-500 uppercase mb-1">Noise Level</div>
                                        <div className="text-sm font-mono">{result.details.noise.variance.toFixed(2)}</div>
                                    </div>
                                )}
                                {result.details.geo && result.details.geo.has_gps && (
                                    <div className="col-span-2 p-3 bg-black/30 rounded-lg border border-white/5">
                                        <div className="text-[10px] text-gray-500 uppercase mb-1">Location Data</div>
                                        <div className="text-sm text-blue-300 truncate">{result.details.geo.address}</div>
                                        <div className="text-[10px] text-gray-600 font-mono mt-1">
                                            {result.details.geo.lat.toFixed(4)}, {result.details.geo.lon.toFixed(4)}
                                        </div>
                                    </div>
                                )}
                                {result.detected_fingers !== undefined && (
                                    <div className="col-span-2 p-3 bg-black/30 rounded-lg border border-white/5">
                                        <div className="flex justify-between">
                                            <div>
                                                <div className="text-[10px] text-gray-500 uppercase mb-1">Challenge</div>
                                                <div className="text-lg font-bold">{result.challenge}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] text-gray-500 uppercase mb-1">Detected</div>
                                                <div className={`text-lg font-bold ${result.status === 'PASSED' ? 'text-green-400' : 'text-red-400'}`}>
                                                    {result.detected_fingers}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
