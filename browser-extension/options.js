// Saves options to chrome.storage.local (API keys should not sync across browsers for security)
const saveOptions = () => {
    const apiKeyElement = document.getElementById('apiKey');
    const apiUrlElement = document.getElementById('apiUrl');

    if (!apiKeyElement || !apiUrlElement) {
        console.error('Required form elements not found');
        return;
    }

    const apiKey = apiKeyElement.value.trim();
    const apiUrl = apiUrlElement.value.trim();

    // Validate inputs
    const status = document.getElementById('status');

    if (!apiKey) {
        if (status) {
            status.textContent = 'Warning: API key is empty. Extension features will not work.';
            status.style.color = '#f59e0b';
            setTimeout(() => {
                status.textContent = '';
            }, 3000);
        }
        console.warn('API key is empty');
    }

    try {
        new URL(apiUrl);
    } catch (e) {
        if (status) {
            status.textContent = 'Error: Invalid API URL format. Please enter a valid URL.';
            status.style.color = '#ef4444';
        }
        console.error('Invalid API URL format:', e);
        return;
    }

    chrome.storage.local.set(
        { apiKey: apiKey, apiUrl: apiUrl },
        () => {
            if (chrome.runtime.lastError) {
                if (status) {
                    status.textContent = 'Error saving options: ' + chrome.runtime.lastError.message;
                    status.style.color = '#ef4444';
                }
                return;
            }

            // Update status to let user know options were saved.
            if (status) {
                status.textContent = 'Options saved.';
                status.style.color = '#4ade80';
                setTimeout(() => {
                    status.textContent = '';
                }, 2000);
            }
        }
    );
};

// Restores input field values using the preferences
// stored in chrome.storage.
const restoreOptions = () => {
    chrome.storage.local.get(
        { apiKey: '', apiUrl: 'http://localhost:8000' },
        (items) => {
            if (chrome.runtime.lastError) {
                console.error('Error loading options:', chrome.runtime.lastError);
                return;
            }

            const apiKeyElement = document.getElementById('apiKey');
            const apiUrlElement = document.getElementById('apiUrl');

            if (!apiKeyElement || !apiUrlElement) {
                console.error('Required form elements not found');
                return;
            }

            apiKeyElement.value = items.apiKey;
            apiUrlElement.value = items.apiUrl;
        }
    );
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.addEventListener('DOMContentLoaded', () => {
    restoreOptions();

    const saveButton = document.getElementById('save');
    if (saveButton) {
        saveButton.addEventListener('click', saveOptions);
    } else {
        console.error('Save button not found');
    }
});