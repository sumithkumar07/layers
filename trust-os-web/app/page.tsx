'use client'

import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { TrustIcon, MemoryIcon, VisionIcon, CheckIcon, AlertIcon, GiftIcon, LightningIcon, ShieldIcon, BrainIcon } from '@/components/Icons'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-32 px-6 flex flex-col items-center text-center">
        {/* Ambient Background */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

        <div className="relative z-10 max-w-5xl mx-auto space-y-8">

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight leading-tight"
          >
            The Operating System for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Autonomous Agents.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto"
          >
            The missing cortex for AI. Give your agents (and yourself) long-term memory, real-time fact checking, and forensic vision.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-4 pt-4"
          >
            <Link href="/login" className="px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-200 transition shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transform duration-200">
              Start Building
            </Link>
            <Link href="https://chrome.google.com/webstore/detail/layers" className="px-8 py-4 bg-white/5 border border-white/10 rounded-full font-bold text-lg hover:bg-white/10 transition hover:scale-105 transform duration-200 flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
              Add to Chrome
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-6 pt-4 text-sm font-medium text-gray-400"
          >
            <div className="flex items-center gap-2">
              <GiftIcon className="w-4 h-4 text-green-400" />
              <span>100 Free Credits</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <div className="flex items-center gap-2">
              <LightningIcon className="w-4 h-4 text-purple-400" />
              <span>2.5M Tokens Included</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <div className="flex items-center gap-2">
              <ShieldIcon className="w-4 h-4 text-blue-400" />
              <span>No Credit Card Required</span>
            </div>
          </motion.div>
        </div>

        {/* Hero Visual / Terminal Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-20 relative w-full max-w-5xl mx-auto group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
              <div className="ml-4 text-xs text-gray-500 font-mono">agent_workflow.py</div>
            </div>
            <div className="p-6 text-left font-mono text-sm md:text-base overflow-x-auto">
              <div className="text-gray-500"># Initialize the Layers Client</div>
              <div className="text-purple-400">import <span className="text-white">layers</span></div>
              <div className="text-white mb-4">client = layers.Client(api_key=<span className="text-green-400">"sk_..."</span>)</div>

              <div className="text-gray-500"># 1. Verify Information (Trust OS)</div>
              <div className="flex">
                <span className="text-blue-400">fact</span>
                <span className="text-white mx-2">=</span>
                <span className="text-yellow-300">client.trust.verify("The earth is flat")</span>
              </div>
              <div className="text-gray-400 mb-4">{`>>> { "result": "FALSE", "confidence": 0.99 }`}</div>

              <div className="text-gray-500"># 2. Store Context (Synapse)</div>
              <div className="flex">
                <span className="text-blue-400">memory</span>
                <span className="text-white mx-2">=</span>
                <span className="text-yellow-300">client.memory.add("User prefers dark mode")</span>
              </div>
              <div className="text-gray-400">{`>>> { "status": "STORED", "id": "mem_123" }`}</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Bento Grid Features */}
      <section className="py-32 px-6 bg-black/50 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            {...fadeInUp}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Built for the <span className="text-blue-500">Agent Age</span></h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Traditional APIs aren't enough. Layers provides the missing cognitive infrastructure for autonomous systems.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
          >
            {/* Card 1: Trust OS (Large) */}
            <motion.div variants={fadeInUp} className="md:col-span-2 p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition group relative overflow-hidden hover:-translate-y-1 duration-300">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] group-hover:bg-blue-600/20 transition" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
                  <TrustIcon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Trust OS</h3>
                <p className="text-gray-400 mb-8 max-w-md">
                  The world's first hallucination firewall. Verify every claim your agent makes against a real-time truth engine before it reaches the user.
                </p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 rounded-lg bg-black/50 border border-white/10 text-xs text-blue-300">Real-time Web Search</span>
                  <span className="px-3 py-1 rounded-lg bg-black/50 border border-white/10 text-xs text-blue-300">Source Citations</span>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Synapse */}
            <motion.div variants={fadeInUp} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition group relative overflow-hidden hover:-translate-y-1 duration-300">
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-600/10 rounded-full blur-[60px] group-hover:bg-purple-600/20 transition" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
                  <MemoryIcon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Synapse</h3>
                <p className="text-gray-400 text-sm">
                  Infinite context window. Store user preferences, past interactions, and documents in a semantic vector database.
                </p>
              </div>
            </motion.div>

            {/* Card 3: VeriSnap */}
            <motion.div variants={fadeInUp} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-red-500/30 transition group relative overflow-hidden hover:-translate-y-1 duration-300">
              <div className="absolute top-0 left-0 w-40 h-40 bg-red-600/10 rounded-full blur-[60px] group-hover:bg-red-600/20 transition" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 mb-6">
                  <VisionIcon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-2">VeriSnap</h3>
                <p className="text-gray-400 text-sm">
                  Forensic vision. Detect deepfakes, verify liveness, and ensure the images your agent sees are real.
                </p>
              </div>
            </motion.div>

            {/* Card 4: Universal API */}
            <motion.div variants={fadeInUp} className="md:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-white/10 to-black border border-white/10 hover:border-white/20 transition group relative overflow-hidden hover:-translate-y-1 duration-300">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">One Brain, Everywhere</h3>
                  <p className="text-gray-400 mb-6">
                    For Developers: A unified SDK for your agents.<br />
                    For Humans: A powerful Browser Extension that works on ChatGPT, Gemini, and Claude.
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-xs">SDK</div>
                    <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-xs">EXT</div>
                    <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-xs">API</div>
                  </div>
                </div>
                <div className="flex-1 w-full bg-black/50 rounded-xl border border-white/10 p-4 font-mono text-xs text-gray-400">
                  <div>npm install @layers/sdk</div>
                  <div className="mt-2 text-blue-400"># Or install the Extension</div>
                  <div className="text-white">Layers for Chrome (v1.1)</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Deep Dive Sections (Zig-Zag) */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto space-y-32">

          {/* Section 1: Trust OS */}
          <motion.div
            {...fadeInUp}
            className="flex flex-col md:flex-row items-center gap-16"
          >
            <div className="flex-1 space-y-8">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                <TrustIcon className="w-8 h-8" />
              </div>
              <h2 className="text-5xl font-bold leading-tight">The "Fake Case Law" <br /><span className="text-blue-500">Defense.</span></h2>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition group">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 bg-red-500/20 rounded-lg text-red-400 mt-1">
                    <AlertIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">The Problem</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      A legal AI cites "Smith v. Jones (2024)"—a case that doesn't exist. This hallucination could cost a law firm millions in malpractice suits.
                    </p>
                  </div>
                </div>
                <div className="w-full h-px bg-white/10 my-4" />
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-500/20 rounded-lg text-green-400 mt-1">
                    <CheckIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">The Trust OS Fix</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Trust OS intercepts the response, checks 100+ legal databases in 200ms, and <span className="text-white font-bold">blocks the output</span> before it reaches the user.
                    </p>
                  </div>
                </div>
              </div>

              <ul className="space-y-3 text-gray-300 font-medium">
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <CheckIcon className="w-3 h-3" />
                  </span>
                  Cross-reference 100+ sources
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <CheckIcon className="w-3 h-3" />
                  </span>
                  Citation generation
                </li>
              </ul>
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-0 bg-blue-600/20 blur-[100px] rounded-full" />
              <div className="relative bg-black border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
                {/* Mock UI for Verification */}
                <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                  <span className="text-sm font-bold tracking-wider text-gray-400">LIVE INTERCEPTION</span>
                  <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30 animate-pulse">HALLUCINATION BLOCKED</span>
                </div>
                <div className="space-y-4 font-mono text-xs">
                  <div className="p-3 rounded bg-white/5 border border-white/5">
                    <div className="text-gray-500 mb-1">Claim Analysis</div>
                    <div className="text-white">"In Smith v. Jones (2024)..."</div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 text-[10px] uppercase tracking-widest my-2">
                    <div className="h-px bg-white/10 flex-1" />
                    Checking Legal Indices
                    <div className="h-px bg-white/10 flex-1" />
                  </div>
                  <div className="p-3 rounded bg-red-900/10 border border-red-500/20">
                    <div className="text-red-400 font-bold mb-1 flex items-center gap-2">
                      <AlertIcon className="w-4 h-4" />
                      FATAL ERROR
                    </div>
                    <div className="text-red-300/70">Case ID not found in LexisNexis, Westlaw, or Google Scholar.</div>
                  </div>
                  <div className="p-3 rounded bg-blue-900/10 border border-blue-500/20">
                    <div className="text-blue-400 font-bold mb-1 flex items-center gap-2">
                      <ShieldIcon className="w-4 h-4" />
                      ACTION TAKEN
                    </div>
                    <div className="text-blue-300/70">Response withheld. User notified of potential fabrication.</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Section 2: Synapse */}
          <motion.div
            {...fadeInUp}
            className="flex flex-col md:flex-row-reverse items-center gap-16"
          >
            <div className="flex-1 space-y-8">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                <MemoryIcon className="w-8 h-8" />
              </div>
              <h2 className="text-5xl font-bold leading-tight">The "Peanut Allergy" <br /><span className="text-purple-500">Save.</span></h2>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition group">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 bg-red-500/20 rounded-lg text-red-400 mt-1">
                    <AlertIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">The Problem</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      A user mentioned a peanut allergy 3 months ago. Today, your travel agent AI suggests a Thai restaurant with a peanut-heavy menu.
                    </p>
                  </div>
                </div>
                <div className="w-full h-px bg-white/10 my-4" />
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-500/20 rounded-lg text-green-400 mt-1">
                    <CheckIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">The Synapse Fix</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Synapse retrieves that long-lost context instantly and <span className="text-white font-bold">automatically filters</span> the suggestion, preventing a medical emergency.
                    </p>
                  </div>
                </div>
              </div>

              <ul className="space-y-3 text-gray-300 font-medium">
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <CheckIcon className="w-3 h-3" />
                  </span>
                  Infinite Context Window
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <CheckIcon className="w-3 h-3" />
                  </span>
                  Automatic Retrieval
                </li>
              </ul>
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-0 bg-purple-600/20 blur-[100px] rounded-full" />
              <div className="relative bg-black border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
                {/* Mock UI for Memory */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs border border-purple-500/30">Context Retrieved</span>
                  </div>
                  <span className="text-xs text-gray-500">Latency: 12ms</span>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0" />
                    <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none text-sm text-gray-300">
                      Suggest a dinner spot for tonight.
                    </div>
                  </div>

                  <div className="flex gap-3 justify-center my-2">
                    <span className="text-[10px] bg-black/50 px-2 py-1 rounded text-purple-400 border border-purple-500/30 flex items-center gap-1">
                      <BrainIcon className="w-3 h-3" />
                      Synapse: Found "Peanut Allergy" (Confidence: 98%)
                    </span>
                  </div>

                  <div className="flex gap-3 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0" />
                    <div className="bg-blue-600/20 border border-blue-500/30 p-3 rounded-2xl rounded-tr-none text-sm text-white">
                      I recommend "The Italian Place". <br />
                      <span className="text-xs text-blue-300 mt-1 block opacity-70">
                        (Note: I skipped "Thai Spice" because of your peanut allergy.)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Section 3: VeriSnap */}
          <motion.div
            {...fadeInUp}
            className="flex flex-col md:flex-row items-center gap-16"
          >
            <div className="flex-1 space-y-8">
              <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                <VisionIcon className="w-8 h-8" />
              </div>
              <h2 className="text-5xl font-bold leading-tight">The "Broken Egg" <br /><span className="text-red-500">Refund Fraud.</span></h2>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/30 transition group">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 bg-red-500/20 rounded-lg text-red-400 mt-1">
                    <AlertIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">The Problem</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      A fraudster uses AI to generate a photo of "broken eggs" and uploads it to claim an instant refund. It looks 100% real to the human eye.
                    </p>
                  </div>
                </div>
                <div className="w-full h-px bg-white/10 my-4" />
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-500/20 rounded-lg text-green-400 mt-1">
                    <CheckIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">The VeriSnap Fix</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      VeriSnap analyzes the invisible noise patterns and metadata. It detects the generation signature in milliseconds and <span className="text-white font-bold">flags the fraud</span>.
                    </p>
                  </div>
                </div>
              </div>

              <ul className="space-y-3 text-gray-300 font-medium">
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                    <CheckIcon className="w-3 h-3" />
                  </span>
                  99.4% Deepfake Detection
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                    <CheckIcon className="w-3 h-3" />
                  </span>
                  Invisible Watermarking
                </li>
              </ul>
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-0 bg-red-600/20 blur-[100px] rounded-full" />
              <div className="relative bg-black border border-white/10 rounded-2xl p-6 shadow-2xl">
                {/* Mock UI for VeriSnap */}
                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden border border-white/10 mb-4 group">
                  <img
                    src="/deepfake-demo.png"
                    alt="Deepfake Analysis"
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-500"
                  />
                  <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded shadow-lg z-10">
                    FAKE DETECTED
                  </div>
                  {/* Scan Line Animation */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-[scan_2s_ease-in-out_infinite] z-20" />
                </div>
                <div className="flex justify-between text-xs text-gray-400 font-mono">
                  <span>Engine: ELA_V2</span>
                  <span className="text-red-400">Confidence: 99.8%</span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Enterprise / Trust Section */}
      <section className="py-20 border-t border-white/5 bg-white/5">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-12">Trusted by builders at</p>
          <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition duration-500">
            {/* Mock Logos */}
            <div className="text-2xl font-bold text-white">ACME Corp</div>
            <div className="text-2xl font-bold text-white">Nebula AI</div>
            <div className="text-2xl font-bold text-white">Vertex</div>
            <div className="text-2xl font-bold text-white">Hyperion</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 bg-black">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
          <div>© 2024 Layers Platform. All rights reserved.</div>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/twitter" className="hover:text-white">Twitter</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
