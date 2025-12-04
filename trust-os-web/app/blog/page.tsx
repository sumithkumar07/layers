'use client'
import Navbar from '@/components/Navbar'

export default function BlogPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
            <Navbar />
            {/* Background Glow */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] right-[-20%] w-[1000px] h-[1000px] bg-red-900/10 rounded-full blur-[150px]" />
            </div>

            <div className="max-w-4xl mx-auto px-6 py-24 relative z-10">
                <div className="mb-20">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                        Engineering Blog
                    </h1>
                    <p className="text-xl text-gray-400">Updates, deep dives, and release notes from the Layers team.</p>
                </div>

                <div className="grid gap-12">
                    {/* Featured Post */}
                    <article className="group relative p-10 rounded-3xl bg-white/5 border border-white/10 hover:border-red-500/30 transition duration-500 overflow-hidden backdrop-blur-sm">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition transform group-hover:scale-110 duration-500">
                            <span className="text-9xl">📸</span>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-3 py-1 rounded-full bg-red-900/30 text-red-400 text-xs font-bold uppercase tracking-wider">New Release</span>
                                <span className="text-sm text-gray-500">Nov 30, 2024</span>
                            </div>
                            <h2 className="text-3xl font-bold mb-4 group-hover:text-red-400 transition">Introducing VeriSnap: Vision for Agents</h2>
                            <p className="text-gray-400 mb-8 max-w-2xl text-lg leading-relaxed">
                                Today we are launching Layer 3 of the Layers Platform. VeriSnap gives autonomous agents the ability to detect AI-generated images, verify metadata, and perform liveness checks on users.
                            </p>
                            <div className="flex items-center gap-2 text-sm font-medium text-white group-hover:text-red-400 transition">
                                Read Article <span className="group-hover:translate-x-1 transition">→</span>
                            </div>
                        </div>
                    </article>

                    {/* Older Post */}
                    <article className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition duration-300 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 rounded-full bg-purple-900/30 text-purple-400 text-xs font-bold uppercase tracking-wider">Update</span>
                            <span className="text-sm text-gray-500">Nov 15, 2024</span>
                        </div>
                        <h2 className="text-2xl font-bold mb-4 group-hover:text-purple-400 transition">Supermemory: Beyond Vector Search</h2>
                        <p className="text-gray-400 mb-6 max-w-2xl">
                            How we combined vector embeddings with knowledge graphs to give agents true long-term recall.
                        </p>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-400 group-hover:text-white transition">
                            Read Article →
                        </div>
                    </article>

                    {/* Older Post */}
                    <article className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition duration-300 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 rounded-full bg-blue-900/30 text-blue-400 text-xs font-bold uppercase tracking-wider">Launch</span>
                            <span className="text-sm text-gray-500">Nov 01, 2024</span>
                        </div>
                        <h2 className="text-2xl font-bold mb-4 group-hover:text-blue-400 transition">Hello, World. Meet Trust OS.</h2>
                        <p className="text-gray-400 mb-6 max-w-2xl">
                            The internet is broken. Agents are hallucinating. Here is how we are fixing it with the first operating system for AI truth.
                        </p>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-400 group-hover:text-white transition">
                            Read Article →
                        </div>
                    </article>
                </div>
            </div>
        </div>
    )
}
