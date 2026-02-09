// Test script to verify SecretsManager decryption
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SECRET_KEY_PATH = path.join(process.cwd(), '.secret.key');
const SETTINGS_PATH = path.join(process.cwd(), '.settings.json');

// Load secret key
function getKey() {
    if (fs.existsSync(SECRET_KEY_PATH)) {
        const hexKey = fs.readFileSync(SECRET_KEY_PATH, 'utf-8');
        return Buffer.from(hexKey, 'hex');
    }
    throw new Error("No secret key file found!");
}

// Decrypt function
function decrypt(text) {
    const parts = text.split(':');
    if (parts.length !== 2) return text;

    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const key = getKey();
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// Test
try {
    const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
    console.log("=== Settings File Contents ===");
    console.log("national_law_api_key (encrypted):", settings.national_law_api_key);

    if (settings.national_law_api_key && settings.national_law_api_key.includes(':')) {
        const decrypted = decrypt(settings.national_law_api_key);
        console.log("national_law_api_key (decrypted):", decrypted);
        console.log("Decrypted length:", decrypted.length);
        console.log("First 5 chars:", decrypted.substring(0, 5));
    } else {
        console.log("national_law_api_key is not encrypted or empty");
    }
} catch (e) {
    console.error("Error:", e.message);
}
