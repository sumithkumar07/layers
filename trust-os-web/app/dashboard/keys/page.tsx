'use client'

import Sidebar from '@/components/Sidebar'
import Modal from '@/components/Modal'
import { useState, useEffect, useMemo } from 'react'
import { useToast } from '@/components/Toast'

import { createClient } from '@/utils/supabase'

export default function KeysPage() {
    const [keys, setKeys] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newKeyName, setNewKeyName] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const { showToast } = useToast()
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        fetchKeys()
    }, [])

    const fetchKeys = async () => {
        try {
            // Fetch keys from Supabase
            // In a real app with auth, we'd filter by user_id automatically via RLS
            // For this demo, we fetch all keys (assuming single user or RLS handles it)
            const { data, error } = await supabase
                .from('api_keys')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            if (data) {
                setKeys(data.map(k => ({
                    ...k,
                    // Use stored prefix or fallback
                    prefix: k.key_prefix ? `sk-layers-${k.key_prefix}...` : 'N/A'
                })))
            } else {
                setKeys([])
            }
        } catch (e) {
            console.error(e)
            showToast("Failed to fetch keys", 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateKey = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newKeyName) return

        setIsCreating(true)
        try {
            // Get current session for Auth
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                showToast("Please log in to create keys", "error")
                return
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/keys`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ name: newKeyName })
            })
            if (res.ok) {
                const newKey = await res.json()
                setKeys(prev => [...prev, { ...newKey, prefix: newKey.api_key?.slice(0, 12) + '...' }])
                // Consider: copy key to clipboard and show generic success message
                showToast('Key created successfully. Copy it now—it won\'t be shown again.', 'success')
                setIsModalOpen(false)
                setNewKeyName('')
            } else {
                const err = await res.json()
                showToast(err.detail || "Failed to create key", 'error')
            }
        } catch (e) {
            showToast("Error creating key", 'error')
        } finally {
            setIsCreating(false)
        }
    }

    const handleRevoke = async (keyId: string) => {
        if (!confirm("Are you sure you want to revoke this key? This action cannot be undone.")) return

        try {
            const { error } = await supabase
                .from('api_keys')
                .delete()
                .eq('id', keyId)

            if (error) throw error

            setKeys(prev => prev.filter(k => k.id !== keyId))
            showToast("API Key Revoked", 'success')
        } catch (e) {
            showToast("Failed to revoke key", 'error')
        }
    }

    return (
        <div className="min-h-screen bg-black text-white flex">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <header className="mb-12 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">API Keys</h1>
                        <p className="text-gray-400 mt-2">Manage access to the Layers Platform.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-white text-black rounded-lg font-bold text-sm hover:bg-gray-200 transition"
                    >
                        + Create New Key
                    </button>
                </header>

                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-gray-400 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="p-4 font-medium">Name</th>
                                <th className="p-4 font-medium">Key Token</th>
                                <th className="p-4 font-medium">Created</th>
                                <th className="p-4 font-medium">Last Used</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {keys.map(key => (
                                <tr key={key.id} className="hover:bg-white/5 transition">
                                    <td className="p-4 font-bold">{key.name}</td>
                                    <td className="p-4 font-mono text-gray-400">{key.prefix}</td>
                                    <td className="p-4 text-gray-500">{key.created_at || key.created}</td>
                                    <td className="p-4 text-gray-500">{key.last_used_at || key.lastUsed}</td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleRevoke(key.id)}
                                            className="text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wide"
                                        >
                                            Revoke
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 p-4 rounded-lg bg-blue-900/10 border border-blue-500/20 text-sm text-blue-300">
                    <strong>Security Tip:</strong> Never share your API keys. If a key is compromised, revoke it immediately.
                </div>

                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="Create New API Key"
                >
                    <form onSubmit={handleCreateKey} className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Key Name</label>
                            <input
                                autoFocus
                                type="text"
                                className="w-full p-3 rounded-lg bg-black/50 border border-white/10 focus:border-blue-500 outline-none text-sm text-white"
                                placeholder="e.g. Production Key"
                                value={newKeyName}
                                onChange={e => setNewKeyName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isCreating}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold transition disabled:opacity-50"
                            >
                                {isCreating ? 'Creating...' : 'Create Key'}
                            </button>
                        </div>
                    </form>
                </Modal>
            </main>
        </div>
    )
}
