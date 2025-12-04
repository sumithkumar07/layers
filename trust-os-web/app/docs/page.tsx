'use client'
import Navbar from '@/components/Navbar'

export default function DocsPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
            <Navbar />

            {/* Background Glow */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-[250px_1fr] gap-12">

                {/* Sidebar Navigation */}
                <aside className="hidden md:block sticky top-24 h-fit space-y-8">
                    <div>
                        <h3 className="font-bold text-white mb-4">Getting Started</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li className="hover:text-blue-400 cursor-pointer transition">Introduction</li>
                            <li className="hover:text-blue-400 cursor-pointer transition">Installation</li>
                            <li className="hover:text-blue-400 cursor-pointer transition">Authentication</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold text-white mb-4">API Reference</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li className="hover:text-blue-400 cursor-pointer transition">Trust OS (Layer 1)</li>
                            <li className="hover:text-purple-400 cursor-pointer transition">Synapse (Layer 2)</li>
                            <li className="hover:text-red-400 cursor-pointer transition">VeriSnap (Layer 3)</li>
                        </ul>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="space-y-16">

                    {/* Introduction */}
                    <section>
                        <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">Documentation</h1>
                        <p className="text-xl text-gray-400 leading-relaxed">
                            Layers is the first Operating System for Autonomous Agents. It provides the essential infrastructure for Truth, Memory, and Vision.
                        </p>
                    </section>

                    {/* Installation / Connection */}
                    <section className="space-y-6">
                        <h2 className="text-3xl font-bold text-white">Integration</h2>
                        <p className="text-gray-400">
                            You can connect your agents to Layers using the Model Context Protocol (MCP), Browser Extension, or via direct REST API.
                        </p>
                        {/* MCP Config */}
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <span className="text-green-400">Option A:</span> Connect via MCP
                            </h3>
                            <p className="text-sm text-gray-400 mb-4">
                                Add this to your Claude Desktop config. Your single <strong>Universal API Key</strong> grants access to all layers (Trust, Memory, VeriSnap).
                            </p>
                            <pre className="bg-black/50 p-4 rounded-lg text-sm font-mono text-gray-300 overflow-x-auto border border-white/5">
                                {`{
  "mcpServers": {
    "layers": {
      "command": "python",
      "args": ["-m", "src.mcp_server"]
    }
  }
}`}
                            </pre>
                        </div>

                        {/* Browser Extension */}
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <span className="text-purple-400">Option B:</span> Browser Extension
                            </h3>
                            <p className="text-sm text-gray-400 mb-4">
                                The easiest way to use Layers. Works on any website, including ChatGPT, Claude, and X.
                            </p>
                            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300 mb-4">
                                <li>Download the extension from the <a href="/dashboard" className="text-blue-400 hover:underline">Dashboard</a>.</li>
                                <li>Go to <strong>Extension Options</strong>.</li>
                                <li>Paste your <strong>API Key</strong> (from Dashboard).</li>
                            </ol>
                            <div className="p-3 bg-black/50 rounded border border-white/5 text-xs text-gray-500">
                                Note: The extension automatically injects context and verifies facts in real-time.
                            </div>
                        </div>

                        {/* REST API */}
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <span className="text-blue-400">Option C:</span> Direct API
                            </h3>
                            <p className="text-sm text-gray-400 mb-4">
                                Call the endpoints directly from any language (Python, Node, Go, etc).
                            </p>
                            <div className="space-y-4">
                                <div className="bg-black/50 p-4 rounded-lg border border-white/5">
                                    <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Example: Verify a Claim</div>
                                    <code className="text-sm font-mono text-green-400">
                                        POST https://api.layers.ai/verify
                                    </code>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* API Reference */}
                    <section className="space-y-8">
                        <h2 className="text-3xl font-bold text-white">Capabilities</h2>

                        {/* Trust OS */}
                        <div className="group p-6 rounded-2xl bg-gradient-to-br from-blue-900/10 to-transparent border border-blue-500/20 hover:border-blue-500/40 transition">
                            <h3 className="text-xl font-bold text-blue-400 mb-2">Trust OS</h3>
                            <p className="text-gray-400 mb-4">Fact-checking and hallucination detection.</p>
                            <code className="px-2 py-1 rounded bg-blue-900/30 text-blue-300 text-sm font-mono">verify_claim(claim, evidence)</code>
                        </div>

                        {/* Synapse */}
                        <div className="group p-6 rounded-2xl bg-gradient-to-br from-purple-900/10 to-transparent border border-purple-500/20 hover:border-purple-500/40 transition">
                            <h3 className="text-xl font-bold text-purple-400 mb-2">Synapse</h3>
                            <p className="text-gray-400 mb-4">Long-term semantic memory storage.</p>
                            <code className="px-2 py-1 rounded bg-purple-900/30 text-purple-300 text-sm font-mono">save_memory(content)</code>
                        </div>

                        {/* VeriSnap */}
                        <div className="group p-6 rounded-2xl bg-gradient-to-br from-red-900/10 to-transparent border border-red-500/20 hover:border-red-500/40 transition">
                            <h3 className="text-xl font-bold text-red-400 mb-2">VeriSnap</h3>
                            <p className="text-gray-400 mb-4">Forensic image analysis and liveness checks.</p>
                            <code className="px-2 py-1 rounded bg-red-900/30 text-red-300 text-sm font-mono">verify_image_forensics(file_path)</code>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    )
}
