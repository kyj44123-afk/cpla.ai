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

async function debugDetail() {
    // 1. Get OC
    const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
    const oc = settings.national_law_api_key.includes(':')
        ? decrypt(settings.national_law_api_key)
        : settings.national_law_api_key;

    // 2. Fetch Detail
    // https://www.law.go.kr/DRF/lawService.do?OC=...&target=prec&ID=612851&type=XML
    const url = new URL("https://www.law.go.kr/DRF/lawService.do");
    url.searchParams.set("OC", oc);
    url.searchParams.set("target", "prec");
    url.searchParams.set("ID", "612851");
    url.searchParams.set("type", "XML");

    console.log("Fetching Detail: " + url.toString());

    https.get(url.toString(), (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            fs.writeFileSync('debug_detail_utf8.xml', data, { encoding: 'utf8' });
            console.log("Saved detail XML to debug_detail_utf8.xml");

            // Check for 판결요지
            const summaryMatch = data.match(/<판결요지>([\s\S]*?)<\/판결요지>/);
            if (summaryMatch) {
                console.log("Found Summary! Length:", summaryMatch[1].length);
            } else {
                console.log("Summary NOT found in detail response.");
                // Maybe it is wrapped in CDATA
                const cdataMatch = data.match(/<판결요지><!\[CDATA\[([\s\S]*?)\]\]><\/판결요지>/);
                if (cdataMatch) console.log("Found CDATA Summary! Length:", cdataMatch[1].length);
            }
        });
    });
}

debugDetail();
