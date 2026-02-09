const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// --- Helper to get OC key ---
const SECRET_KEY_PATH = path.join(process.cwd(), '.secret.key');
const SETTINGS_PATH = path.join(process.cwd(), '.settings.json');

function getKey() {
    try {
        const hexKey = fs.readFileSync(SECRET_KEY_PATH, 'utf-8');
        return Buffer.from(hexKey, 'hex');
    } catch (e) { return null; }
}

function decrypt(text) {
    try {
        const parts = text.split(':');
        if (parts.length !== 2) return text;
        const iv = Buffer.from(parts[0], 'hex');
        const encryptedText = parts[1];
        const key = getKey();
        if (!key) return text;
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) { return text; }
}

async function debugPrecedent() {
    // 1. Get OC
    const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
    const oc = settings.national_law_api_key.includes(':')
        ? decrypt(settings.national_law_api_key)
        : settings.national_law_api_key;

    // 2. Search
    const url = new URL("https://www.law.go.kr/DRF/lawSearch.do");
    url.searchParams.set("OC", oc);
    url.searchParams.set("target", "prec");
    url.searchParams.set("type", "XML");
    url.searchParams.set("query", "부당해고");
    url.searchParams.set("display", "1");

    console.log("Fetching: " + url.toString());

    https.get(url.toString(), (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log("Data received length:", data.length);

            // Save to file (UTF-8)
            fs.writeFileSync('debug_xml_utf8.xml', data, { encoding: 'utf8' });
            console.log("Saved raw XML to debug_xml_utf8.xml");

            // Try existing extraction logic
            const tagName = "판결요지";
            // Original regex from source
            const regex = new RegExp(`<${tagName}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))<\\/${tagName}>`, "g");

            let match = regex.exec(data);
            if (match) {
                console.log("Regex Match Found!");
                console.log("Group 1 (CDATA):", (match[1] ? "YES" : "NO"));
                console.log("Group 2 (Normal):", (match[2] ? "YES" : "NO"));
                const content = match[1] || match[2] || "";
                console.log("Extracted Content (first 100 chars):", content.substring(0, 100));
            } else {
                console.log("Regex Match FAILED for tag:", tagName);
                // Print the area around the tag manually
                const tagIndex = data.indexOf(`<${tagName}`);
                if (tagIndex !== -1) {
                    console.log("Context around tag start:", data.substring(tagIndex, tagIndex + 200));
                } else {
                    console.log("Tag literal not found in response.");
                    // Check <판례내용>
                    const altIndex = data.indexOf("<판례내용");
                    if (altIndex !== -1) console.log("Found <판례내용> instead at index", altIndex);
                }
            }
        });
    });
}

debugPrecedent();
