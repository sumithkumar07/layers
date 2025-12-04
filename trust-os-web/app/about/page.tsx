'use client'
import Navbar from '@/components/Navbar'
import { TrustIcon, BotIcon, KeysIcon } from '@/components/Icons'

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
            <Navbar />

            {/* Background Glow */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute bottom-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-blue-900/10 rounded-full blur-[150px]" />
            </div>

            {/* Hero */}
            <section className="relative pt-32 pb-20 px-6 text-center z-10">
                <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
                    Building the <span className="text-blue-500">Trust Layer</span> for AI.
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    We believe autonomous agents will run the world. But they need a reliable infrastructure to verify truth, remember context, and see reality.
                </p>
            </section>

            {/* Values */}
            <section className="py-20 px-6 max-w-6xl mx-auto relative z-10">
                <div className="grid md:grid-cols-3 gap-12">
                    <div className="space-y-4 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition duration-300">
                        <div className="text-blue-500 mb-4">
                            <TrustIcon className="w-12 h-12" />
                        </div>
                        <h3 className="text-2xl font-bold text-white">Truth First</h3>
                        <p className="text-gray-400 leading-relaxed">
                            In an era of synthetic media and hallucinations, verification isn't a feature—it's a necessity. We build systems that default to skepticism.
                        </p>
                    </div>
                    <div className="space-y-4 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition duration-300">
                        <div className="text-purple-500 mb-4">
                            <BotIcon className="w-12 h-12" />
                        </div>
                        <h3 className="text-2xl font-bold text-white">Agent Native</h3>
                        <p className="text-gray-400 leading-relaxed">
                            We don't build for humans. We build APIs for agents. Fast, deterministic, and structured data that LLMs can consume instantly.
                        </p>
                    </div>
                    <div className="space-y-4 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition duration-300">
                        <div className="text-green-500 mb-4">
                            <KeysIcon className="w-12 h-12" />
                        </div>
                        <h3 className="text-2xl font-bold text-white">Privacy Preserving</h3>
                        <p className="text-gray-400 leading-relaxed">
                            Your agent's memories and verification data are yours. We provide the infrastructure, but you hold the keys.
                        </p>
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="py-20 px-6 border-t border-white/10 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-16">The Team</h2>
                    <div className="flex flex-wrap items-center justify-center gap-16">
                        <div className="text-center group">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-800 to-black mx-auto mb-6 border-2 border-white/10 group-hover:border-blue-500/50 transition duration-300 flex items-center justify-center text-4xl">
                                👨‍💻
                            </div>
                            <div className="font-bold text-xl mb-1">Sumit</div>
                            <div className="text-sm text-blue-400 font-medium uppercase tracking-wider">Founder & Engineer</div>
                        </div>
                        {/* Add more team members here */}
                    </div>
                </div>
            </section>
        </div>
    )
}
