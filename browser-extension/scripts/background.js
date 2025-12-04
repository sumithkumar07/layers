// Initialize Context Menu
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "verifyText",
        title: "Verify with Layers",
        contexts: ["selection"]
    });

    chrome.contextMenus.create({
        id: "saveToMemory",
        title: "Save to Layers Brain",
        contexts: ["selection", "page"]
    });

    chrome.contextMenus.create({
        id: "verifyImage",
        title: "Verify Image with VeriSnap",
        contexts: ["image"]
    });
});

// Handle Context Menu Clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "verifyText") {
        if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, {
                action: "verifySelection",
                text: info.selectionText
            });
        }
    } else if (info.menuItemId === "saveToMemory") {
        const text = info.selectionText || info.pageUrl;
        const isUrl = !info.selectionText;

        saveToMemory(text, isUrl)
            .then(res => {
                chrome.notifications.create({
                    type: "basic",
                    iconUrl: "../icons/icon48.png",
                    title: "Layers Memory",
                    message: "Saved to Brain successfully!"
                });
            })
            .catch(err => {
                console.error("Memory Save Failed", err);
                chrome.notifications.create({
                    type: "basic",
                    iconUrl: "../icons/icon48.png",
                    title: "Layers Error",
                    message: "Failed to save memory. Check API Key."
                });
            });
    } else if (info.menuItemId === "verifyImage") {
        const imageUrl = info.srcUrl;

        chrome.notifications.create({
            type: "basic",
            iconUrl: "../icons/icon48.png",
            title: "VeriSnap",
            message: "Analyzing image..."
        });

        verifyImage(imageUrl)
            .then(data => {
                if (tab?.id) {
                    chrome.tabs.sendMessage(tab.id, {
                        action: "showImageResult",
                        srcUrl: imageUrl,
                        data: data
                    });
                }
            })
            .catch(err => {
                console.error("Image Verification Failed", err);
                chrome.notifications.create({
                    type: "basic",
                    iconUrl: "../icons/icon48.png",
                    title: "VeriSnap Error",
                    message: "Failed to verify image. Check API Key."
                });
            });
    }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "verifyText") {
        if (!sender.tab) return; // Ignore if not from tab

        verifyText(request.text)
            .then(data => sendResponse({ success: true, data }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Async response
    } else if (request.action === "searchMemory") {
        searchMemory(request.query)
            .then(data => sendResponse({ success: true, results: data.results }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Async response
    }
});

// Configuration
const API_TIMEOUT = 5000;

async function verifyText(text) {
    try {
        // Get API URL and Key from storage
        const { apiUrl, apiKey } = await chrome.storage.local.get({
            apiUrl: 'http://localhost:8000',
            apiKey: ''
        });

        if (!apiKey) {
            throw new Error("Missing API Key. Please set it in Extension Options.");
        }

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

        try {
            // Call API
            const response = await fetch(`${apiUrl}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey
                },
                body: JSON.stringify({
                    claim: text,
                }),
                signal: controller.signal
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.message || errorData.error || response.statusText;
                throw new Error(`API Error (${response.status}): ${errorMessage}`);
            }

            const data = await response.json();

            // --- TRUST + MEMORY SYNERGY ---
            // If the claim is TRUE, automatically save it to the Brain.
            if (data.result === "TRUE" && data.confidence > 0.8) {
                console.log("Layers: Auto-Saving Verified Fact to Memory...");
                saveToMemory(`[Verified Fact] ${text}`, false).catch(err => console.warn("Auto-save failed", err));
            }
            // ------------------------------

            return data;
        } finally {
            clearTimeout(timeoutId);
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        console.error("Verification failed:", error);
        throw error;
    }
}

async function saveToMemory(content, isUrl = false) {
    const { apiUrl, apiKey } = await chrome.storage.local.get({
        apiUrl: 'http://localhost:8000',
        apiKey: ''
    });

    if (!apiKey) throw new Error("Missing API Key");

    const endpoint = isUrl ? `${apiUrl}/memory/capture` : `${apiUrl}/memory/add`;
    const body = isUrl ? { url: content } : { content: content };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            },
            body: JSON.stringify(body),
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        console.error("Save to Memory failed:", error);
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

async function searchMemory(query) {
    const { apiUrl, apiKey } = await chrome.storage.local.get({
        apiUrl: 'http://localhost:8000',
        apiKey: ''
    });

    if (!apiKey) throw new Error("Missing API Key");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
        const response = await fetch(`${apiUrl}/memory/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            },
            body: JSON.stringify({ query: query }),
            signal: controller.signal
        });

        if (!response.ok) throw new Error("Search failed");
        return await response.json();
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        console.error("Search Memory failed:", error);
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

async function verifyImage(imageUrl) {
    const { apiUrl, apiKey } = await chrome.storage.local.get({
        apiUrl: 'http://localhost:8000',
        apiKey: ''
    });

    if (!apiKey) throw new Error("Missing API Key");

    const imageController = new AbortController();
    const imageTimeoutId = setTimeout(() => imageController.abort(), API_TIMEOUT);

    try {
        const imageRes = await fetch(imageUrl, { signal: imageController.signal });
        const blob = await imageRes.blob();
        clearTimeout(imageTimeoutId);

        const urlPath = new URL(imageUrl).pathname;
        const filename = urlPath.split('/').pop()?.split('?')[0] || 'image.jpg';
        const formData = new FormData();
        formData.append('file', blob, filename);

        const apiController = new AbortController();
        const apiTimeoutId = setTimeout(() => apiController.abort(), API_TIMEOUT);

        try {
            const response = await fetch(`${apiUrl}/images/verify`, {
                method: 'POST',
                headers: {
                    'X-API-Key': apiKey
                },
                body: formData,
                signal: apiController.signal
            });

            if (!response.ok) throw new Error("Image API Failed");
            return await response.json();
        } finally {
            clearTimeout(apiTimeoutId);
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        console.error("Verify Image failed:", error);
        throw error;
    }
}
