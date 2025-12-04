'use client'

import Script from "next/script";
import { useToast } from "@/components/Toast";

export function RazorpayScript() {
    const { showToast } = useToast();

    return (
        <Script
            id="razorpay-checkout"
            src="https://checkout.razorpay.com/v1/checkout.js"
            strategy="afterInteractive"
            onError={(e) => {
                console.error('Failed to load Razorpay script:', e);
                showToast('Payment system unavailable. Please check your connection or try again later.', 'error');
            }}
        />
    );
}
