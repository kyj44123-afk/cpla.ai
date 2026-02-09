// Test National Law API directly with decrypted OC
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const SECRET_KEY_PATH = path.join(process.cwd(), '.secret.key');
const SETTINGS_PATH = path.join(process.cwd(), '.settings.json');

function getKey() {
    const hexKey = fs.readFileSync(SECRET_KEY_PATH, 'utf-8');
    return Buffer.from(hexKey, 'hex');
}

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

// Get decrypted OC value
const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
const oc = settings.national_law_api_key.includes(':')
    ? decrypt(settings.national_law_api_key)
    : settings.national_law_api_key;

console.log("=== National Law API 연결 테스트 ===");
console.log("OC 값:", oc);

// Build API URL
const url = new URL("https://www.law.go.kr/DRF/lawSearch.do");
url.searchParams.set("OC", oc);
url.searchParams.set("target", "prec");
url.searchParams.set("type", "XML");
url.searchParams.set("query", "해고");
url.searchParams.set("display", "3");

console.log("요청 URL:", url.toString());
console.log("\n요청 중...\n");

// Make request
https.get(url.toString(), (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log("=== API 응답 (처음 2000자) ===\n");
        console.log(data.substring(0, 2000));

        // Check response type
        if (data.includes('<!DOCTYPE html')) {
            console.log("\n\n❌ 결과: HTML 오류 페이지 반환 - OC가 유효하지 않거나 IP 등록이 필요합니다.");
        } else if (data.includes('<?xml')) {
            console.log("\n\n✅ 결과: XML 데이터 반환 - API 연결 성공!");

            // Count results
            const caseMatches = data.match(/<사건명>/g);
            if (caseMatches) {
                console.log(`📊 검색된 판례 수: ${caseMatches.length}개`);
            }
        }
    });
}).on('error', (err) => {
    console.error("요청 오류:", err.message);
});
