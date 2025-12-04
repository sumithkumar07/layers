// Content Script: Injected into pages
let verifyButton = null;
let tooltip = null;

document.addEventListener('mouseup', handleSelection);

function handleSelection(event) {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    // Remove existing button if any
    if (verifyButton) {
        verifyButton.remove();
        verifyButton = null;
    }
    if (tooltip) {
        tooltip.remove();
        tooltip = null;
    }
    // Ignore empty or short selections
    if (text.length < 10) return;

    // Create "Verify" Button
    verifyButton = document.createElement('div');
    verifyButton.innerText = "🛡️ Verify";
    verifyButton.style.position = "absolute";
    verifyButton.style.left = `${event.pageX + 10}px`;
    verifyButton.style.top = `${event.pageY + 10}px`;
    verifyButton.style.background = "#000";
    verifyButton.style.color = "#fff";
    verifyButton.style.padding = "5px 10px";
    verifyButton.style.borderRadius = "5px";
    verifyButton.style.cursor = "pointer";
    verifyButton.style.fontSize = "12px";
    verifyButton.style.zIndex = "10000";
    verifyButton.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
    verifyButton.style.fontFamily = "sans-serif";
    verifyButton.style.border = "1px solid rgba(255,255,255,0.2)";

    verifyButton.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Prevent losing selection
        e.stopPropagation();
        verifySelection(text, event.pageX, event.pageY);
    });

    document.body.appendChild(verifyButton);
}

function verifySelection(text, x, y) {
    // Show Loading State
    verifyButton.innerText = "⏳ Verifying...";

    // Send message to background script
    chrome.runtime.sendMessage({ action: "verifyText", text: text }, (response) => {
        // Check for runtime errors
        if (chrome.runtime.lastError) {
            if (verifyButton) verifyButton.remove();
            showResult({ success: false, error: chrome.runtime.lastError.message }, x, y);
            return;
        }
        if (!response) {
            if (verifyButton) verifyButton.remove();
            showResult({ success: false, error: "No response from background script." }, x, y);
            return;
        }
        if (verifyButton) verifyButton.remove();
        showResult(response, x, y);
    });
}
function showResult(response, x, y) {
    if (tooltip) tooltip.remove();

    tooltip = document.createElement('div');

    // Basic Tooltip Styling
    tooltip.style.position = "absolute";

    // Viewport Boundary Check
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = 300; // Fixed width defined below
    const tooltipHeight = 200; // Estimated height

    let left = x;
    let top = y + 20;

    // Adjust horizontal position if off-screen
    if (left + tooltipWidth > viewportWidth) {
        left = viewportWidth - tooltipWidth - 20;
    }
    // Adjust vertical position if off-screen
    if (top + tooltipHeight > viewportHeight) {
        top = y - tooltipHeight - 20;
    }

    tooltip.style.left = `${Math.max(10, left)}px`;
    tooltip.style.top = `${Math.max(10, top)}px`;
    tooltip.style.background = "#1a1a1a";
    tooltip.style.color = "#fff";
    tooltip.style.padding = "15px";
    tooltip.style.borderRadius = "8px";
    tooltip.style.fontSize = "12px";
    tooltip.style.zIndex = "10001";
    tooltip.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)";
    tooltip.style.fontFamily = "sans-serif";
    tooltip.style.border = "1px solid rgba(255,255,255,0.1)";
    tooltip.style.width = "300px";
    tooltip.style.maxWidth = "90vw";

    if (response.success) {
        const { result, confidence, evidence } = response.data;
        const color = result === "True" ? "#4ade80" : (result === "False" ? "#f87171" : "#fbbf24");

        tooltip.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <span style="font-weight:bold; font-size:14px;">Layers Verification</span>
                <span style="color:${color}; font-weight:bold; font-size:12px; border:1px solid ${color}; padding:2px 6px; border-radius:4px;">${result}</span>
            </div>
            <div id="evidence-text" style="font-size:12px; color:#ccc; margin-bottom:10px; line-height:1.4;"></div>
            <div style="font-size:10px; color:#666; text-align:right;">
                Confidence: ${Math.round(confidence * 100)}%
            </div>
            <div style="margin-top:10px; text-align:center;">
                <button id="close-layers-tooltip" style="background:rgba(255,255,255,0.1); border:none; color:#fff; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:10px;">Close</button>
            </div>
        `;

    } else {
        tooltip.innerHTML = `
            <div style="color:#f87171; font-weight:bold; margin-bottom:5px;">Error</div>
            <div id="error-text" style="font-size:12px; color:#ccc;"></div>
            <div style="margin-top:10px; text-align:center;">
                <button id="close-layers-tooltip" style="background:rgba(255,255,255,0.1); border:none; color:#fff; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:10px;">Close</button>
            </div>
        `;

    }

    document.body.appendChild(tooltip);

    // Post-render setup: safe text insertion and event binding
    setTimeout(() => {
        if (response.success) {
            const evidenceEl = document.getElementById('evidence-text');
            const { evidence } = response.data;
            if (evidenceEl) evidenceEl.textContent = evidence || "No specific evidence found, but our model analyzed the claim.";
        } else {
            const errorEl = document.getElementById('error-text');
            if (errorEl) errorEl.textContent = response.error || "Failed to connect to Layers API.";
        }

        const closeBtn = document.getElementById('close-layers-tooltip');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (tooltip) {
                    tooltip.remove();
                    tooltip = null;
                }
            });
        }
    }, 0);

    // Auto-close after 10 seconds
    setTimeout(() => {
        if (tooltip) {
            tooltip.remove();
            tooltip = null;
        }
    }, 10000);
}

// --- VISION LAYER (VeriSnap) ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showImageResult") {
        const { srcUrl, data } = request;
        const img = findImageByUrl(srcUrl);

        if (img) {
            drawVisionOverlay(img, data);
        } else {
            console.warn("Layers: Could not find image to overlay", srcUrl);
        }
    }
});

function findImageByUrl(url) {
    // Try exact match first
    let img = document.querySelector(`img[src="${url}"]`);
    if (img) return img;

    // Try fuzzy match (sometimes URLs get modified)
    const images = document.getElementsByTagName('img');
    for (let i = 0; i < images.length; i++) {
        if (images[i].src === url) return images[i];
    }
    return null;
}

function drawVisionOverlay(img, data) {
    // Remove existing overlay if any
    const existingOverlay = img.parentElement.querySelector('.layers-vision-overlay');
    if (existingOverlay) existingOverlay.remove();

    // Create wrapper if needed (to position overlay relative to image)
    // Actually, let's just use absolute positioning relative to the image's bounding rect
    // to avoid breaking site layout.

    const rect = img.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    const overlay = document.createElement('div');
    overlay.className = 'layers-vision-overlay';
    overlay.style.position = 'absolute';
    overlay.style.top = `${rect.top + scrollTop}px`;
    overlay.style.left = `${rect.left + scrollLeft}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
    overlay.style.pointerEvents = 'none'; // Let clicks pass through
    overlay.style.zIndex = '10000';
    overlay.style.boxSizing = 'border-box';

    const isFake = data.status === "FAKE" || data.score < 50; // Assuming API returns score 0-100
    const color = isFake ? '#ef4444' : '#22c55e'; // Red or Green

    overlay.style.border = `4px solid ${color}`;
    overlay.style.borderRadius = '4px';

    // Badge
    const badge = document.createElement('div');
    badge.innerText = isFake ? "⚠️ FAKE DETECTED" : "✅ VERIFIED REAL";
    badge.style.position = 'absolute';
    badge.style.top = '-30px';
    badge.style.left = '0';
    badge.style.background = color;
    badge.style.color = 'white';
    badge.style.padding = '4px 8px';
    badge.style.fontWeight = 'bold';
    badge.style.fontSize = '12px';
    badge.style.borderRadius = '4px';
    badge.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';

    overlay.appendChild(badge);
    document.body.appendChild(overlay);

    // Remove after 10 seconds
    setTimeout(() => overlay.remove(), 10000);
}
