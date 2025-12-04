'use client'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { createClient } from '@/utils/supabase'
import { useToast } from '@/components/Toast'

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function PricingPage() {
    const { showToast } = useToast()
    const supabase = createClient()

    const handlePurchase = async (amount: number, credits: number) => {
        try {
            if (!window.Razorpay) {
                throw new Error("Razorpay SDK failed to load. Please check your internet connection.")
            }

            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                window.location.href = '/login'
                return
            }

            // 1. Create Order
            // 1. Create Order
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/billing/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ amount, credits }),
                signal: controller.signal
            })
            clearTimeout(timeoutId)

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                throw new Error(errorData.message || "Failed to create order")
            }
            const order = await res.json()

            const options = {
                key: order.key_id,
                amount: order.amount,
                currency: order.currency,
                name: "Layers",
                description: "Credits Purchase",
                order_id: order.id,
                handler: async function (response: any) {
                    try {
                        // 3. Verify Payment
                        const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/billing/verify-payment`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${session.access_token}`
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        })

                        if (verifyRes.ok) {
                            showToast("Payment Successful! Credits Added.", "success")
                            // Redirect to dashboard after short delay
                            setTimeout(() => window.location.href = '/dashboard', 1500)
                        } else {
                            const errorData = await verifyRes.json().catch(() => ({}))
                            showToast(errorData.message || "Payment verification failed", "error")
                        }
                    } catch (error) {
                        console.error('Payment verification error:', error)
                        showToast("Payment verification failed. Please contact support.", "error")
                    }
                },
                prefill: {
                    email: session.user.email
                },
                theme: {
                    color: "#2563EB"
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.open();
        } catch (error) {
            console.error(error)
            showToast("Payment failed to initialize", "error")
        }
    }
    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            {/* Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[1000px] h-[1000px] bg-blue-900/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-20%] right-[20%] w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[150px]" />
            </div>

            <div className="relative max-w-6xl mx-auto px-6 py-24">
                <div className="text-center mb-20">
                    <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500 mb-6">
                        Universal Credits
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        One simple currency for all your agent's actions. Scale from prototype to production without changing your code.
                    </p>
                </div>

                {/* Pricing Grid */}
                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-24">

                    {/* Starter */}
                    <div className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition duration-300 backdrop-blur-sm">
                        <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
                        <div className="text-4xl font-bold mb-2">$20</div>
                        <div className="text-sm text-green-400 font-mono mb-8 bg-green-900/20 inline-block px-3 py-1 rounded-full">2,000 Credits</div>
                        <ul className="space-y-4 text-gray-400 text-sm mb-8">
                            <li className="flex items-center gap-2">✓ Access to Trust OS</li>
                            <li className="flex items-center gap-2">✓ Basic Memory Storage</li>
                            <li className="flex items-center gap-2">✓ Community Support</li>
                        </ul>
                        <button onClick={() => handlePurchase(20, 2000)} className="block w-full py-4 text-center rounded-xl bg-white/10 hover:bg-white/20 font-bold transition">
                            Buy Credits
                        </button>
                    </div>

                    {/* Pro (Highlighted) */}
                    <div className="relative p-8 rounded-3xl bg-gradient-to-b from-blue-900/20 to-black border border-blue-500/50 shadow-2xl shadow-blue-900/20 transform md:-translate-y-4 backdrop-blur-md">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide shadow-lg">
                            Most Popular
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
                        <div className="text-4xl font-bold mb-2">$50</div>
                        <div className="text-sm text-blue-400 font-mono mb-8 bg-blue-900/20 inline-block px-3 py-1 rounded-full">6,000 Credits</div>
                        <ul className="space-y-4 text-gray-300 text-sm mb-8">
                            <li className="flex items-center gap-2 text-white">✓ Priority Processing</li>
                            <li className="flex items-center gap-2 text-white">✓ Advanced Forensics</li>
                            <li className="flex items-center gap-2 text-white">✓ Email Support</li>
                        </ul>
                        <button onClick={() => handlePurchase(50, 6000)} className="block w-full py-4 text-center rounded-xl bg-blue-600 hover:bg-blue-500 font-bold transition shadow-lg shadow-blue-900/50">
                            Buy Credits
                        </button>
                    </div>

                    {/* Enterprise */}
                    <div className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition duration-300 backdrop-blur-sm">
                        <h3 className="text-xl font-bold text-white mb-2">Scale</h3>
                        <div className="text-4xl font-bold mb-2">$100</div>
                        <div className="text-sm text-purple-400 font-mono mb-8 bg-purple-900/20 inline-block px-3 py-1 rounded-full">25,000 Credits</div>
                        <ul className="space-y-4 text-gray-400 text-sm mb-8">
                            <li className="flex items-center gap-2">✓ High Concurrency</li>
                            <li className="flex items-center gap-2">✓ Dedicated Support</li>
                            <li className="flex items-center gap-2">✓ Custom Integrations</li>
                        </ul>
                        <button onClick={() => handlePurchase(100, 25000)} className="block w-full py-4 text-center rounded-xl bg-white/10 hover:bg-white/20 font-bold transition">
                            Buy Credits
                        </button>
                    </div>

                </div>

                {/* Consumption Table */}
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">Consumption Rates</h2>
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-gray-400 uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="p-6 font-medium">Action</th>
                                    <th className="p-6 font-medium">Layer</th>
                                    <th className="p-6 font-medium text-right">Cost</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                <tr className="hover:bg-white/5 transition">
                                    <td className="p-6 font-medium">Verify Fact</td>
                                    <td className="p-6 text-blue-400">Trust OS</td>
                                    <td className="p-6 text-right font-mono text-gray-300">1 Credit</td>
                                </tr>
                                <tr className="hover:bg-white/5 transition">
                                    <td className="p-6 font-medium">Search Memory</td>
                                    <td className="p-6 text-purple-400">Synapse</td>
                                    <td className="p-6 text-right font-mono text-gray-300">1 Credit</td>
                                </tr>
                                <tr className="hover:bg-white/5 transition">
                                    <td className="p-6 font-medium">Store Memory</td>
                                    <td className="p-6 text-purple-400">Synapse</td>
                                    <td className="p-6 text-right font-mono text-gray-300">2 Credits</td>
                                </tr>
                                <tr className="hover:bg-white/5 transition">
                                    <td className="p-6 font-medium">Verify & Store</td>
                                    <td className="p-6 text-gray-400">Hybrid</td>
                                    <td className="p-6 text-right font-mono text-gray-300">3 Credits</td>
                                </tr>
                                <tr className="hover:bg-white/5 transition">
                                    <td className="p-6 font-medium">Forensic Analysis</td>
                                    <td className="p-6 text-red-400">VeriSnap</td>
                                    <td className="p-6 text-right font-mono text-gray-300">10 Credits</td>
                                </tr>
                                <tr className="hover:bg-white/5 transition">
                                    <td className="p-6 font-medium">Liveness Check</td>
                                    <td className="p-6 text-red-400">VeriSnap</td>
                                    <td className="p-6 text-right font-mono text-gray-300">5 Credits</td>
                                </tr>
                                <tr className="hover:bg-white/5 transition">
                                    <td className="p-6 font-medium">Register Image</td>
                                    <td className="p-6 text-red-400">VeriSnap</td>
                                    <td className="p-6 text-right font-mono text-gray-300">1 Credit</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
