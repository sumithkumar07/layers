'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const STEPS = [
    { text: "> Initializing Trust OS...", delay: 500 },
    { text: "> Connecting to Layer 1 (SourceRank)...", delay: 1500 },
    { text: "> Verifying claim: 'GTA 6 has a teleport gun'", delay: 2500 },
    { text: "> Searching trusted sources...", delay: 3500 },
    { text: "> Analyzing evidence...", delay: 4500 },
    { text: "> VERDICT: FALSE (Confidence: 99.8%)", delay: 5500, highlight: true },
]

export default function HeroTerminal() {
    const [lines, setLines] = useState<any[]>([])

    useEffect(() => {
        let timeouts: NodeJS.Timeout[] = []

        // Reset lines on mount
        setLines([])

        STEPS.forEach((step, index) => {
            const timeout = setTimeout(() => {
                setLines(prev => [...prev, step])
            }, step.delay)
            timeouts.push(timeout)
        })

        return () => timeouts.forEach(clearTimeout)
    }, [])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-2xl mx-auto mt-12 rounded-xl overflow-hidden bg-black/80 border border-white/10 backdrop-blur-md shadow-2xl shadow-blue-900/20 font-mono text-sm md:text-base"
        >
            {/* Terminal Header */}
            <div className="bg-white/5 px-4 py-2 flex items-center gap-2 border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                <div className="ml-2 text-xs text-gray-500">agent@layers-os:~</div>
            </div>

            {/* Terminal Body */}
            <div className="p-6 h-[300px] overflow-y-auto space-y-2 text-gray-300">
                {lines.map((line, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={line.highlight ? "text-red-400 font-bold" : ""}
                    >
                        {line.text}
                    </motion.div>
                ))}
                <motion.div
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="w-2 h-4 bg-blue-500 inline-block align-middle ml-1"
                />
            </div>
        </motion.div>
    )
}
