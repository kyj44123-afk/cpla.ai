const http = require('http');

// Test Scenarios covering diverse Labor Law areas
const scenarios = [
    { category: "HR Evaluation", query: "직원들의 평가보상체계를 개편하고 싶습니다." },
    { category: "Discipline", query: "지각이 잦은 직원을 징계하고 싶습니다." },
    { category: "Harassment", query: "상사가 지속적으로 폭언을 합니다." },
    { category: "Wages", query: "포괄임금제를 폐지하려고 합니다." },
    { category: "Safety", query: "출퇴근 중에 교통사고가 났는데 산재 되나요?" },
    { category: "Dismissal", query: "경영상 이유로 해고를 해야 할 것 같습니다." },
    { category: "Contract", query: "수습기간을 3개월에서 6개월로 연장하고 싶습니다." },
    { category: "Sexual Harassment", query: "회식 자리에서 성희롱을 당했습니다." }
];

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/chat',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

async function runTest(scenario) {
    return new Promise((resolve) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                // Parse precedents from header if available
                const precedentsHeader = res.headers['x-cpla-precedents'];
                let precedents = [];
                if (precedentsHeader) {
                    try {
                        const jsonStr = Buffer.from(precedentsHeader, 'base64').toString('utf-8');
                        precedents = JSON.parse(jsonStr);
                    } catch (e) {
                        console.error("Failed to parse precedents header:", e.message);
                    }
                }

                console.log(`\n[${scenario.category}] Query: "${scenario.query}"`);
                console.log(`Found ${precedents.length} precedents.`);
                if (precedents.length > 0) {
                    console.log(`Top 1: ${precedents[0].title}`);
                    // console.log(`Summary: ${precedents[0].content.substring(0, 100)}...`);
                }
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with request: ${e.message}`);
            resolve();
        });

        // Use a dummy session ID
        req.write(JSON.stringify({
            messages: [{ role: 'user', content: scenario.query }],
            sessionId: 'test-benchmark-' + Date.now()
        }));
        req.end();
    });
}

async function runAll() {
    console.log("Starting Keyword Extraction Benchmark...");
    for (const scenario of scenarios) {
        await runTest(scenario);
        // Small delay to avoid rate limits if any
        await new Promise(r => setTimeout(r, 1000));
    }
    console.log("\nBenchmark Complete.");
}

runAll();
