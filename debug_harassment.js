const http = require('http');
const https = require('https');
const fs = require('fs');

// Hardcoded for debug
const API_KEY = "kd_uck";

const logFile = 'debug_harassment_log.txt';

function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + "\n");
}

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
        });
        req.on('error', reject);
    });
}

async function checkCategoryForKeyword(category, keyword) {
    log(`\n--- Searching Category: "${category}" for Keyword: "${keyword}" ---`);
    const target = "prec";
    const url = `http://www.law.go.kr/DRF/lawSearch.do?OC=${API_KEY}&target=${target}&type=XML&query=${encodeURIComponent(category)}&display=20`;

    try {
        const res = await fetchUrl(url);
        const ids = [];
        const regex = /<판례일련번호>(\d+)<\/판례일련번호>/g;
        let match;
        while ((match = regex.exec(res.body)) !== null) {
            ids.push(match[1]);
        }

        log(`Fetched ${ids.length} case IDs for category "${category}".`);

        let hits = 0;
        for (const id of ids) {
            const detailUrl = `http://www.law.go.kr/DRF/lawService.do?OC=${API_KEY}&target=prec&ID=${id}&type=XML`;
            const detailRes = await fetchUrl(detailUrl);

            if (detailRes.body.includes(keyword)) {
                log(`[HIT] Case ID ${id} contains "${keyword}"`);
                hits++;
            }
        }

        log(`Result: ${hits} / ${ids.length} cases in "${category}" contain "${keyword}".`);
        return hits;
    } catch (e) {
        log("Error: " + e);
        return 0;
    }
}

async function fetchDetail(id) {
    const detailUrl = `http://www.law.go.kr/DRF/lawService.do?OC=${API_KEY}&target=prec&ID=${id}&type=XML`;
    const detailRes = await fetchUrl(detailUrl);

    fs.writeFileSync('debug_case_608457.txt', detailRes.body);
    console.log(`Wrote detail for ${id} to debug_case_608457.txt`);
}

fetchDetail("608457");
