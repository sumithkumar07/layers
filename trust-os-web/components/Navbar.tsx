'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'

export default function Navbar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const isActive = (path: string) => pathname === path ? 'text-blue-400' : 'text-gray-400 hover:text-white'

    return (
        <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
            <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
                    <div className="w-6 h-6 rounded bg-white text-black flex items-center justify-center text-xs font-black">L</div>
                    Layers
                </Link>

                <div className="flex items-center gap-8 text-sm font-medium">
                    <Link href="/" className={isActive('/')}>Home</Link>
                    <Link href="/docs" className={isActive('/docs')}>Docs</Link>
                    <Link href="/pricing" className={isActive('/pricing')}>Pricing</Link>

                    {user ? (
                        <>
                            <Link
                                href="/dashboard"
                                className="px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-full transition font-bold"
                            >
                                Dashboard
                            </Link>
                            <button onClick={handleLogout} className="text-gray-400 hover:text-white">
                                Logout
                            </button>
                        </>
                    ) : (
                        <Link href="/login" className={isActive('/login')}>Login</Link>
                    )}
                </div>
            </div>
        </nav>
    )
}
