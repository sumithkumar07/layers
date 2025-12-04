document.addEventListener('DOMContentLoaded', async () => {
    const statusIndicator = document.getElementById('status-indicator');
    const creditCount = document.getElementById('credit-count');
    const creditBar = document.getElementById('credit-bar');
    const btnOpenDash = document.getElementById('btn-open-dash');
    const btnSettings = document.getElementById('btn-settings');
    const settingsPanel = document.getElementById('settings-panel');
    const apiUrlInput = document.getElementById('api-url');
    const btnSaveSettings = document.getElementById('btn-save-settings');

    // Validate all required elements
    const requiredElements = {
        statusIndicator,
        creditCount,
        creditBar,
        btnOpenDash,
        btnSettings,
        settingsPanel,
        apiUrlInput,
        btnSaveSettings
    };

    const missingElements = Object.entries(requiredElements)
        .filter(([name, element]) => !element)
        .map(([name]) => name);

    if (missingElements.length > 0) {
        console.error("Required elements not found:", missingElements.join(', '));
        return;
    }

    // Load Settings
    try {
        const { apiUrl } = await chrome.storage.local.get({ apiUrl: 'http://localhost:8000/verify' });
        if (apiUrlInput) apiUrlInput.value = apiUrl;

        // 1. Check Connection
        checkConnection(apiUrl);
    } catch (error) {
        console.error("Failed to load settings:", error);
        // Fallback to default
        if (apiUrlInput) apiUrlInput.value = 'http://localhost:8000/verify';
        checkConnection('http://localhost:8000/verify');
    }

    // 2. Button Listeners
    btnOpenDash.addEventListener('click', () => {
        chrome.tabs.create({ url: 'http://localhost:3000/dashboard' });
    });

    btnSettings.addEventListener('click', () => {
        settingsPanel.classList.toggle('hidden');
    });

    btnSaveSettings.addEventListener('click', async () => {
        const newUrl = apiUrlInput.value.trim();
        if (newUrl) {
            try {
                // Validate URL format
                new URL(newUrl);
                await chrome.storage.local.set({ apiUrl: newUrl });
                settingsPanel.classList.add('hidden');
                checkConnection(newUrl);
            } catch (error) {
                console.error("Failed to save settings:", error);
                alert(error instanceof TypeError ? 'Invalid URL format' : 'Failed to save settings');
            }
        }
    });

    // Helper Functions
    async function checkConnection(url) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            // Try to fetch the URL. Even 405/404 means server is reachable.
            const response = await fetch(url, {
                method: 'POST', // Assume it's the verify endpoint
                body: JSON.stringify({ claim: "ping" }),
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            // We consider it online if we get a response, even if it's an error from the API
            // (e.g. 422 Validation Error means the server processed the request)
            if (response.ok || response.status < 500) {
                setOnline();
                fetchCredits();
            } else {
                setOffline();
            }
        } catch (error) {
            console.error("Connection check failed:", error);
            setOffline();
        }
    }

    function setOnline() {
        statusIndicator.className = "flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-[10px] font-medium";
        const dot = document.createElement('div');
        dot.className = 'w-1.5 h-1.5 rounded-full bg-green-500';
        statusIndicator.replaceChildren(dot, ' Online');
    }

    function setOffline() {
        statusIndicator.className = "flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-[10px] font-medium";
        const dot = document.createElement('div');
        dot.className = 'w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse';
        statusIndicator.replaceChildren(dot, ' Offline');
        creditCount.textContent = "--";
        creditBar.style.width = "0%";
    }

    async function fetchCredits() {
        // TODO: Implement real credit fetching with API key from chrome.storage
        // TODO: Add error handling for credit fetch failures
        // MOCK DATA for V1 - replace with actual API call
        creditCount.textContent = "85 / 100";
        creditBar.style.width = "85%";
    }
});
