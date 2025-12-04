'use client'

import Sidebar from '@/components/Sidebar'
import { useState, useRef, useEffect } from 'react'

import { BotIcon, MemoryIcon, CodeIcon, GlobeIcon, ChromeIcon } from '@/components/Icons'

export default function IntegrationsPage() {
    const [copiedState, setCopiedState] = useState<Record<string, boolean>>({})

    // Use useRef for timeouts to avoid re-renders and proper cleanup
    const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({})

    const handleCopy = (key: string, text: string) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                setCopiedState(prev => ({ ...prev, [key]: true }))

                // Clear existing timeout if any
                if (timeoutRefs.current[key]) {
                    clearTimeout(timeoutRefs.current[key])
                }

                timeoutRefs.current[key] = setTimeout(() => {
                    setCopiedState(prev => ({ ...prev, [key]: false }))
                    delete timeoutRefs.current[key]
                }, 2000)
            })
            .catch((err) => {
                console.error('Failed to copy to clipboard:', err)
                setCopiedState(prev => ({ ...prev, [key]: false }))
                // Note: Clipboard API requires HTTPS in production
            })
    }

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            Object.values(timeoutRefs.current).forEach(timeout => clearTimeout(timeout))
        }
    }, [])

    const copyConfig = (type: 'claude' | 'cursor') => {
        const config = type === 'claude'
            ? `"layers-verification": { "command": "python", "args": ["src/mcp_server.py"] }`
            : `http://localhost:8001/sse`

        handleCopy(type, config)
    }

    return (
        <div className="min-h-screen bg-black text-white flex">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <header className="mb-12">
                    <h1 className="text-3xl font-bold">Connectors</h1>
                    <p className="text-gray-400 mt-2">Connect Layers to your favorite AI tools in one click.</p>
                </header>

                <div className="grid md:grid-cols-2 gap-6 max-w-5xl">

                    {/* Chrome Extension (Primary) */}
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-[40px] group-hover:bg-purple-600/20 transition" />
                        <div className="flex items-center gap-4 mb-4 relative z-10">
                            <div className="w-12 h-12 rounded-full bg-purple-900/20 flex items-center justify-center text-purple-400">
                                <GlobeIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Layers for Chrome</h3>
                                <p className="text-xs text-purple-400 font-bold">Official Extension (v1.1)</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-300 mb-6 relative z-10">
                            The Universal AI Companion. Adds Trust, Memory, and Vision to ChatGPT, Gemini, Claude, and X.
                        </p>
                        <a
                            href="https://chrome.google.com/webstore/detail/layers/YOUR_EXTENSION_ID_HERE"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition flex items-center justify-center gap-2 relative z-10"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                            Add to Chrome
                        </a>
                    </div>

                    {/* Claude (Developer) */}
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-orange-500/30 transition group">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-orange-900/20 flex items-center justify-center text-orange-400">
                                <MemoryIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Claude Desktop</h3>
                                <p className="text-xs text-gray-400">Model Context Protocol</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-300 mb-6">
                            Add this config to your <code>claude_desktop_config.json</code>. Requires <code>python</code> in your PATH.
                        </p>
                        <button
                            onClick={() => copyConfig('claude')}
                            className="w-full py-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm transition flex items-center justify-center gap-2"
                        >
                            {copiedState['claude'] ? (
                                <>
                                    <span>✓</span> Copied Config!
                                </>
                            ) : (
                                'Copy Config'
                            )}
                        </button>
                    </div>

                    {/* Cursor (Developer) */}
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition group">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-blue-900/20 flex items-center justify-center text-blue-400">
                                <CodeIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Cursor</h3>
                                <p className="text-xs text-gray-400">IDE Integration (Port 8001)</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-300 mb-6">
                            Add as a "Custom LLM" or MCP server in Cursor. <strong>Must run <code>start_layers.py</code> first.</strong>
                        </p>
                        <button
                            onClick={() => copyConfig('cursor')}
                            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition flex items-center justify-center gap-2"
                        >
                            {copiedState['cursor'] ? (
                                <>
                                    <span>✓</span> Copied SSE URL!
                                </>
                            ) : (
                                'Copy SSE URL'
                            )}
                        </button>
                    </div>

                </div>
            </main>
        </div>
    )
}
