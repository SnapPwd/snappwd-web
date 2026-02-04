// Utilities
const $ = (id) => document.getElementById(id);
const API_URL = window.config?.API_URL || 'http://localhost:8080';

// App State
const state = {
    id: null,
    keyString: null
};

// Base64 Helpers
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

// Crypto Logic
async function generateKey() {
    return window.crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

async function exportKey(key) {
    const exported = await window.crypto.subtle.exportKey("raw", key);
    return arrayBufferToBase64(exported);
}

async function importKey(base64Key) {
    const rawKey = base64ToArrayBuffer(base64Key);
    return window.crypto.subtle.importKey(
        "raw",
        rawKey,
        { name: "AES-GCM" },
        true,
        ["encrypt", "decrypt"]
    );
}

async function encrypt(content, key) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(content);
    
    const ciphertext = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encoded
    );

    // Combine IV + Ciphertext
    const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.byteLength);

    return arrayBufferToBase64(combined.buffer);
}

async function decrypt(encryptedBase64, key) {
    const combined = base64ToArrayBuffer(encryptedBase64);
    const combinedArray = new Uint8Array(combined);
    
    // Extract IV (first 12 bytes) and Ciphertext
    const iv = combinedArray.slice(0, 12);
    const ciphertext = combinedArray.slice(12);

    const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        ciphertext
    );

    return new TextDecoder().decode(decrypted);
}

// UI Handlers
async function handleCreate() {
    clearError();
    const content = $('secret-content').value;
    const expiration = parseInt($('expiration').value);

    if (!content) {
        showError("Please enter some content.");
        return;
    }

    const btn = $('btn-encrypt');
    btn.disabled = true;
    btn.textContent = 'Encrypting...';

    try {
        const key = await generateKey();
        const encrypted = await encrypt(content, key);
        
        // POST to API
        const response = await fetch(`${API_URL}/v1/secrets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                encryptedSecret: encrypted,
                expiration: expiration
            })
        });

        if (!response.ok) throw new Error('Failed to create secret');
        
        const data = await response.json();
        const keyString = await exportKey(key);
        
        // Construct Link
        // Current logic: use hash for key so it's not sent to server
        const secretId = data.id || data.secretId;
        const shareUrl = `${window.location.origin}${window.location.pathname}?id=${secretId}#key=${encodeURIComponent(keyString)}`;
        
        $('share-link').value = shareUrl;
        
        $('view-create').classList.add('hidden');
        $('view-result').classList.remove('hidden');

    } catch (e) {
        showError(e.message);
        console.error(e);
    } finally {
        const btn = $('btn-encrypt');
        btn.disabled = false;
        btn.textContent = 'Encrypt & Create Link';
    }
}

function handleRead(id) {
    clearError();
    // Validate ID format
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
        showError("Invalid secret ID.");
        return;
    }

    // Validate key exists before showing confirm
    const hash = window.location.hash;
    const keyString = new URLSearchParams(hash.substring(1)).get('key');

    if (!keyString) {
        showError("Encryption key missing from URL.");
        return;
    }

    // Store for reveal
    state.id = id;
    state.keyString = keyString;

    // Show confirm view
    $('view-create').classList.add('hidden');
    $('view-confirm').classList.remove('hidden');
}

async function revealSecret() {
    $('view-confirm').classList.add('hidden');
    $('view-read').classList.remove('hidden');

    try {
        const response = await fetch(`${API_URL}/v1/secrets/${state.id}`);

        if (response.status === 404) {
            throw new Error("Secret not found or already viewed.");
        }

        if (!response.ok) throw new Error("Failed to fetch secret.");

        const data = await response.json();
        const key = await importKey(state.keyString);
        const decrypted = await decrypt(data.encryptedSecret, key);

        $('read-loading').classList.add('hidden');
        $('read-content').classList.remove('hidden');
        $('decrypted-text').textContent = decrypted;

    } catch (e) {
        $('read-loading').classList.add('hidden');
        showError(e.message);
    }
}

// Init
function init() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (id) {
        handleRead(id);
    }

    // Event Listeners
    $('btn-encrypt').addEventListener('click', handleCreate);
    $('btn-reveal').addEventListener('click', revealSecret);
    
    $('btn-copy').addEventListener('click', () => {
        navigator.clipboard.writeText($('share-link').value);
        $('btn-copy').textContent = 'Copied!';
        setTimeout(() => $('btn-copy').textContent = 'Copy', 2000);
    });

    $('btn-copy-secret').addEventListener('click', () => {
        navigator.clipboard.writeText($('decrypted-text').textContent);
        $('btn-copy-secret').textContent = 'Copied!';
        setTimeout(() => $('btn-copy-secret').textContent = 'Copy Secret', 2000);
    });

    $('btn-reset').addEventListener('click', () => {
        window.location.href = window.location.pathname; // Reload clear
    });
}

function showError(msg) {
    const el = $('error-box');
    el.textContent = msg;
    el.classList.remove('hidden');
}

function clearError() {
    $('error-box').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', init);
