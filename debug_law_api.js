const https = require('https');
const http = require('http');
const fs = require('fs');

// Mocking the environment variable or reading from .settings.json if possible, 
// but for this script we might need to assume the key is available or hardcode a placeholder for testing if we can't access env.
// However, the previous code uses `process.env.national_law_api_key`. 
// I will try to read it from the file system or ask the user if it fails. 
// For now, I'll try to replicate the logic from nationalLaw.ts but in pure JS.



// Function to read API key (simulated based on project structure)
function getApiKey() {
    // In the real app, this comes from process.env or a settings file.
    // I'll try to read .settings.json
    try {
        const settings = fs.readFileSync('.settings.json', 'utf8');
        const parsed = JSON.parse(settings);
        const rawKey = parsed.national_law_api_key;
        return decrypt(rawKey);
    } catch (e) {
        console.error("Could not read API key from .settings.json:", e.message);
        return null;
    }
}

const SEARCH_USER = "kd_uck";
const API_KEY = "kd_uck";

if (!API_KEY) {
    console.error("CRITICAL: No API Key found.");
    process.exit(1);
} else {
    console.log("Using Hardcoded API Key: " + API_KEY);
}

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
        }).on('error', reject);
    });
}

async function testSearch(query) {
    console.log(`\n--- Testing Search with query: "${query}" ---`);
    const target = "prec";
    const url = `http://www.law.go.kr/DRF/lawSearch.do?OC=${API_KEY}&target=${target}&type=XML&query=${encodeURIComponent(query)}&display=3`;

    try {
        const res = await fetchUrl(url);
        const ids = [];
        const regex = /<판례일련번호>(\d+)<\/판례일련번호>/g;
        let match;
        while ((match = regex.exec(res.body)) !== null) {
            ids.push(match[1]);
        }
        console.log(`Query "${query}" found ${ids.length} results.`);
        return ids.length;
    } catch (e) {
        console.error("Request failed:", e);
        return 0;
    }
}

async function testDetail(id) {
    console.log(`\n--- Testing Detail for ID: ${id} ---`);
    const url = `http://www.law.go.kr/DRF/lawService.do?OC=${API_KEY}&target=prec&ID=${id}&type=XML`;
    console.log(`Requesting: ${url}`);

    try {
        const res = await fetchUrl(url);
        console.log(`Status: ${res.statusCode}`);

        // extract content
        const summaryRegex = /<판결요지>([\s\S]*?)<\/판결요지>/;
        const contentRegex = /<판례내용>([\s\S]*?)<\/판례내용>/;

        const summaryMatch = summaryRegex.exec(res.body);
        const contentMatch = contentRegex.exec(res.body);

        if (summaryMatch) {
            console.log("Found <판결요지> (Summary): Yes");
            console.log("Summary Preview:", summaryMatch[1].replace(/<[^>]*>?/gm, "").trim().substring(0, 100));
        } else {
            console.log("Found <판결요지> (Summary): NO");
        }

        if (contentMatch) {
            console.log("Found <판례내용> (Content): Yes");
        } else {
            console.log("Found <판례내용> (Content): NO");
        }

    } catch (e) {
        console.error("Detail Request failed:", e);
    }
}

// Test with variations
async function testSearchAndFilter(query, filterKeyword) {
    console.log(`\n--- Testing Search "${query}" and Filter "${filterKeyword}" ---`);
    const target = "prec";
    // Fetch 20 results
    const url = `http://www.law.go.kr/DRF/lawSearch.do?OC=${API_KEY}&target=${target}&type=XML&query=${encodeURIComponent(query)}&display=20`;

    try {
        const res = await fetchUrl(url);
        // Extract IDs and Titles
        const cases = [];
        const regex = /<판례일련번호>(\d+)<\/판례일련번호>[\s\S]*?<사건명><!\[CDATA\[(.*?)\]\]><\/사건명>/g;
        // Note: Regex parsing of XML is brittle, but sufficient for test. 
        // Or cleaner regex looping.
        const idRegex = /<판례일련번호>(\d+)<\/판례일련번호>/g;
        const ids = [];
        let match;
        while ((match = idRegex.exec(res.body)) !== null) {
            ids.push(match[1]);
        }

        console.log(`Found ${ids.length} candidates.`);

        let matches = 0;
        for (const id of ids) {
            console.log(`Checking ID: ${id}...`);
            // Fetch detail
            const detailUrl = `http://www.law.go.kr/DRF/lawService.do?OC=${API_KEY}&target=prec&ID=${id}&type=XML`;
            const detailRes = await fetchUrl(detailUrl);

            console.log(`Detail Status: ${detailRes.statusCode}, Body Len: ${detailRes.body.length}`);

            fs.writeFileSync('debug_detail_body.txt', detailRes.body);
            console.log("Wrote detail body to debug_detail_body.txt");

            if (detailRes.body.includes(filterKeyword)) {
                console.log(`MATCH FOUND! ID: ${id}`);
                matches++;
            }
            break; // Stop after checking 1 ID for debugging purposes
        }
        console.log(`Total Matches for filter "${filterKeyword}": ${matches}`);
        return matches;
    } catch (e) {
        console.error("Error:", e);
        return 0;
    }
}

async function runTests() {
    await testSearchAndFilter("근로기준법", "근로"); // Should match everything
    await testSearchAndFilter("근로기준법", "괴롭힘");
}
runTests();
