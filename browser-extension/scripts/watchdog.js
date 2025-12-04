// Layers Watchdog: Active AI Chat Monitoring
// This script runs on ChatGPT, Gemini, Claude, and X (Grok)

console.log("Layers Watchdog: Active");

const CONFIG = {
    "chatgpt.com": {
        selector: ".markdown", // ChatGPT responses
        container: "main"
    },
    "gemini.google.com": {
        selector: ".model-response-text", // Gemini responses
        container: "body"
    },
    "claude.ai": {
        selector: ".font-claude-message", // Claude responses
        container: "body"
    },
    "x.com": {
        selector: "[data-testid='tweetText']", // Grok/Twitter (needs refinement for Grok specifically)
        container: "body"
    }
};

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function detectPlatform() {
    const host = window.location.hostname;
    if (host.includes("chatgpt")) return CONFIG["chatgpt.com"];
    if (host.includes("gemini")) return CONFIG["gemini.google.com"];
    if (host.includes("claude")) return CONFIG["claude.ai"];
    if (host.includes("x.com") || host.includes("twitter")) return CONFIG["x.com"];
    return null;
}

const platform = detectPlatform();

if (platform) {
    console.log(`Layers Watchdog: Monitoring ${window.location.hostname}`);

    // Main Observation Logic
    // Main Observation Logic
    let pendingMutations = [];
    let debounceTimeout = null;

    function processPendingMutations() {
        const mutations = pendingMutations;
        pendingMutations = [];
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach((node) => {
                    // Check if node is an element and matches selector (or contains it)
                    if (node.nodeType === 1) { // Element node
                        if (node.matches && node.matches(platform.selector)) {
                            processMessage(node);
                        } else if (node.querySelector) {
                            const child = node.querySelector(platform.selector);
                            if (child) processMessage(child);
                        }
                    }
                });
            }
        });
    }

    const observer = new MutationObserver((mutations) => {
        pendingMutations.push(...mutations);
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(processPendingMutations, 1000);
    });

    // Start Observing
    const targetNode = document.querySelector(platform.container) || document.body;
    observer.observe(targetNode, {
        childList: true,
        subtree: true
    });
}

async function processMessage(node) {
    // Avoid re-processing
    if (node.dataset.layersChecked) return;

    const text = node.innerText;
    if (!text || text.length < 50) return; // Ignore short messages

    console.log("Layers Watchdog: Verifying...", text.substring(0, 50) + "...");

    // Mark as pending
    node.dataset.layersChecked = "pending";

    // Send to Background Script (which calls API)
    // Send to Background Script (which calls API)
    try {
        chrome.runtime.sendMessage({
            action: "verifyText",
            text: text
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn("Layers Watchdog: Extension context invalidated");
                node.dataset.layersChecked = "error";
                return;
            }
            if (response && response.success) {
                node.dataset.layersChecked = "done";
                handleVerificationResult(node, response.data);
            } else {
                console.error("Layers Watchdog: Verification failed", response?.error);
                node.dataset.layersChecked = "error";
            }
        });
    } catch (e) {
        console.warn("Layers Watchdog: Failed to send message", e);
        node.dataset.layersChecked = "error";
    }
}

function handleVerificationResult(node, data) {
    // Only warn if FALSE or Low Confidence
    if (data.result === "FALSE" || (data.result === "UNCERTAIN" && data.confidence < 0.5)) {
        injectWarning(node, data);
    } else {
        console.log("Layers Watchdog: Verified TRUE");
    }
}

function injectWarning(node, data) {
    const warningDiv = document.createElement("div");
    warningDiv.style.cssText = `
        background: rgba(220, 38, 38, 0.1);
        border: 1px solid rgba(220, 38, 38, 0.5);
        border-radius: 8px;
        padding: 12px;
        margin-top: 8px;
        margin-bottom: 8px;
        color: #ef4444;
        font-family: sans-serif;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
    `;

    // Create SVG icon
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.innerHTML = `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>`;

    const textDiv = document.createElement("div");
    const strong = document.createElement("strong");
    strong.textContent = "Layers Warning:";
    const mainText = document.createTextNode(" This claim is disputed. ");
    const evidenceSpan = document.createElement("span");
    evidenceSpan.style.opacity = "0.8";
    evidenceSpan.textContent = `(${data.evidence ? data.evidence.substring(0, 50) + '...' : 'Check sources'})`;

    textDiv.appendChild(strong);
    textDiv.appendChild(mainText);
    textDiv.appendChild(evidenceSpan);
    warningDiv.appendChild(svg);
    warningDiv.appendChild(textDiv);
    // Insert after the message
    if (!node.parentNode) return;
    node.parentNode.insertBefore(warningDiv, node.nextSibling);
}
// --- Context Injection Logic ---

const INPUT_SELECTORS = {
    "chatgpt.com": "#prompt-textarea",
    "gemini.google.com": ".ql-editor", // Gemini uses a rich text editor
    "claude.ai": "[contenteditable='true']",
    "x.com": "[data-testid='tweetTextarea_0']"
};

function setupContextInjection() {
    const selector = INPUT_SELECTORS[window.location.hostname];
    if (!selector) return;

    // Wait for element to appear
    const interval = setInterval(() => {
        const input = document.querySelector(selector);
        if (input) {
            clearInterval(interval);
            attachInputListener(input);
        }
    }, 1000);
}

function attachInputListener(input) {
    console.log("Layers Watchdog: Monitoring Input for Context Injection");

    input.addEventListener('input', debounce(async (e) => {
        const text = e.target.innerText || e.target.value;
        if (!text || text.length < 5) return;

        // Search Memory (Debounced)
        console.log("Layers: Searching Memory for...", text);

        // Send to Background to search
        chrome.runtime.sendMessage({
            action: "searchMemory",
            query: text
        }, (response) => {
            if (response && response.results && response.results.length > 0) {
                showContextSuggestion(input, response.results[0]);
            }
        });
    }, 1500));
}

function showContextSuggestion(input, memory) {
    // Check if already suggested
    if (document.getElementById("layers-context-suggestion")) return;

    const suggestion = document.createElement("div");
    suggestion.id = "layers-context-suggestion";
    suggestion.style.cssText = `
        position: absolute;
        bottom: 100%;
        left: 0;
        background: #1e1e1e;
        border: 1px solid #3b82f6;
        color: #fff;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 12px;
        cursor: pointer;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
    `;

    const labelSpan = document.createElement("span");
    labelSpan.style.color = "#3b82f6";
    labelSpan.textContent = "🧠 Layers Memory:";

    const contentSpan = document.createElement("span");
    contentSpan.textContent = memory.content.substring(0, 40) + "...";

    const injectBtn = document.createElement("button");
    injectBtn.style.cssText = "background: #3b82f6; border: none; color: white; padding: 2px 6px; border-radius: 4px; cursor: pointer; margin-left: auto;";
    injectBtn.textContent = "Inject";

    suggestion.appendChild(labelSpan);
    suggestion.appendChild(contentSpan);
    suggestion.appendChild(injectBtn);
    suggestion.onclick = () => {
        injectContext(input, memory.content);
        suggestion.remove();
    };

    // Position relative to input container
    input.parentElement.style.position = "relative";
    input.parentElement.appendChild(suggestion);

    // Auto-hide after 10s
    setTimeout(() => suggestion.remove(), 10000);
}

function injectContext(input, context) {
    const injection = `\n\n[Context: ${context}]`;

    if (input.tagName === "TEXTAREA" || input.tagName === "INPUT") {
        input.value += injection;
    } else {
        // ContentEditable
        input.innerText += injection;
    }

    // Trigger input event to notify React/Framework
    input.dispatchEvent(new Event('input', { bubbles: true }));
}

// Initialize
if (platform) {
    setupContextInjection();
}
