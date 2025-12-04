'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CloseIcon } from '@/components/Icons'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
    id: string
    message: string
    type: ToastType
    duration?: number
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void
    removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])
    const timeoutsRef = React.useRef<Map<string, NodeJS.Timeout>>(new Map())

    const removeToast = useCallback((id: string) => {
        const timeout = timeoutsRef.current.get(id)
        if (timeout) {
            clearTimeout(timeout)
            timeoutsRef.current.delete(id)
        }
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
        const id = Math.random().toString(36).substring(2, 11)
        setToasts(prev => [...prev, { id, message, type, duration }])

        if (duration > 0) {
            const timeout = setTimeout(() => {
                removeToast(id)
            }, duration)
            timeoutsRef.current.set(id, timeout)
        }
    }, [removeToast])

    React.useEffect(() => {
        return () => {
            timeoutsRef.current.forEach(timeout => clearTimeout(timeout))
            timeoutsRef.current.clear()
        }
    }, [])

    return (
        <ToastContext.Provider value={{ showToast, removeToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none" aria-live="polite" aria-atomic="false">
                <AnimatePresence mode="popLayout">
                    {toasts.map(toast => (
                        <motion.div
                            key={toast.id}
                            layout
                            initial={{ opacity: 0, x: 50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            role={toast.type === 'error' ? 'alert' : 'status'}
                            className={`
                                pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium min-w-[300px] max-w-md
                                ${toast.type === 'success' ? 'bg-green-900/90 border-green-500/30 text-green-200' : ''}
                                ${toast.type === 'error' ? 'bg-red-900/90 border-red-500/30 text-red-200' : ''}
                                ${toast.type === 'info' ? 'bg-blue-900/90 border-blue-500/30 text-blue-200' : ''}
                                backdrop-blur-md
                            `}
                        >
                            <div className="flex-1 pt-0.5">{toast.message}</div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className={`
                                    p-0.5 rounded-full hover:bg-white/10 transition-colors
                                    ${toast.type === 'success' ? 'text-green-200/70 hover:text-green-100' : ''}
                                    ${toast.type === 'error' ? 'text-red-200/70 hover:text-red-100' : ''}
                                    ${toast.type === 'info' ? 'text-blue-200/70 hover:text-blue-100' : ''}
                                `}
                                aria-label="Dismiss"
                            >
                                <CloseIcon className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}
