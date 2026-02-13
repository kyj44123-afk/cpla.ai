// Detailed API debug
const fs = require("fs");

const settings = JSON.parse(fs.readFileSync(".settings.json", "utf8"));
const apiKey = settings.national_law_api_key;

console.log("API Key:", apiKey);

async function debugAPI() {
    const lawUrl = `https://www.law.go.kr/DRF/lawSearch.do?OC=${apiKey}&target=law&type=XML&query=${encodeURIComponent("근로기준법")}&display=3`;

    console.log("\nRequest URL:", lawUrl);

    try {
        const response = await fetch(lawUrl);
        console.log("Status:", response.status);
        console.log("Headers:", Object.fromEntries(response.headers));

        const text = await response.text();
        console.log("\n=== Full Response (first 2000 chars) ===");
        console.log(text.substring(0, 2000));
        console.log("\n=== End ===");
    } catch (e) {
        console.error("Error:", e);
    }
}

debugAPI();
