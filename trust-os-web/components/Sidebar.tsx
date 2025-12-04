'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase'
import { TrustIcon, MemoryIcon, VisionIcon, DashboardIcon, KeysIcon, ProfileIcon, SettingsIcon, ConnectorsIcon } from '@/components/Icons'

export default function Sidebar() {
    const pathname = usePathname()
    const [usage, setUsage] = useState({ remaining: 0, total: 100 }) // Default 100 credits
    const [userEmail, setUserEmail] = useState('')
    useEffect(() => {
        const supabase = createClient()
        let interval: NodeJS.Timeout | null = null
        let isMounted = true

        const fetchCredits = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!isMounted || !user) return

                const { data: userData, error } = await supabase
                    .from('users')
                    .select('credits')
                    .eq('id', user.id)
                    .single()

                if (isMounted && userData && !error) {
                    setUsage({ remaining: userData.credits || 0, total: 100 })
                } else if (error) {
                    console.error('Failed to fetch credits from database:', error)
                }
            } catch (error) {
                console.error('Failed to fetch credits:', error)
            }
        }

        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!isMounted) return

            if (user) {
                setUserEmail(user.email || '') // Set email once during initialization
                fetchCredits() // Initial fetch
                interval = setInterval(fetchCredits, 5000)
            }
        }

        init()

        return () => {
            isMounted = false
            if (interval) clearInterval(interval)
        }
    }, [])

    const isActive = (path: string) => pathname === path
    const percentageRemaining = Math.min(100, Math.max(0, (usage.remaining / (usage.total || 1)) * 100))

    return (
        <aside className="w-64 h-screen bg-black border-r border-white/10 flex flex-col fixed left-0 top-0 z-50">
            {/* Logo */}
            <div className="p-6 border-b border-white/5">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black font-bold">L</div>
                    <span className="font-bold text-xl tracking-tight">Layers</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 mt-2 px-2">Platform</div>

                <Link href="/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive('/dashboard') ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                    <DashboardIcon className="w-5 h-5" />
                    <span>Overview</span>
                </Link>
                <Link href="/dashboard/integrations" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive('/dashboard/integrations') ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                    <ConnectorsIcon className="w-5 h-5" />
                    <span>Connectors</span>
                </Link>
                <Link href="/dashboard/keys" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive('/dashboard/keys') ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                    <KeysIcon className="w-5 h-5" />
                    <span>API Keys</span>
                </Link>

                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 mt-8 px-2">Layers</div>

                <Link href="/dashboard/trust" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive('/dashboard/trust') ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                    <TrustIcon className="w-5 h-5" />
                    <span>Trust OS</span>
                </Link>
                <Link href="/dashboard/memory" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive('/dashboard/memory') ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                    <MemoryIcon className="w-5 h-5" />
                    <span>Synapse</span>
                </Link>
                <Link href="/dashboard/vision" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive('/dashboard/vision') ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                    <VisionIcon className="w-5 h-5" />
                    <span>VeriSnap</span>
                </Link>
            </nav>

            {/* Usage & Profile */}
            <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                {/* Usage Bar */}
                <div className="mb-6">
                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                        <span>Credits Remaining</span>
                        <span>{Math.round(percentageRemaining)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${percentageRemaining}%` }}
                        />
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1 text-right">{usage.remaining.toLocaleString()} / {usage.total.toLocaleString()}</div>
                </div>

                {/* Profile Link */}
                <Link href="/dashboard/profile" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition group">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                        <ProfileIcon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition">{userEmail ? userEmail.split('@')[0] : 'User'}</div>
                        <div className="text-xs text-gray-500 truncate">Free Plan</div>
                    </div>
                    <SettingsIcon className="w-4 h-4 text-gray-500" />
                </Link>
            </div>
        </aside>
    )
}
