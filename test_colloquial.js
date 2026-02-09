const http = require('http');

const data = JSON.stringify({
    messages: [
        { role: 'user', content: '사장님이 왕따시켜서 너무 힘들어요.' }
    ]
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/chat',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

console.log("Testing colloquial query: '사장님이 왕따시켜서 너무 힘들어요'...");

const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);

    const precedentsHeader = res.headers['x-cpla-precedents'];
    if (precedentsHeader) {
        try {
            const precedentsJson = Buffer.from(precedentsHeader, 'base64').toString('utf-8');
            const precedents = JSON.parse(precedentsJson);

            const fs = require('fs');
            let logContent = `[Precedents Found]: ${precedents.length}\n`;
            precedents.forEach((p, i) => {
                const title = p.title || "No Title";
                const number = p.caseNumber || "";
                logContent += `${i + 1}. ${title} (${number})\n`;
                if (p.content) {
                    logContent += `   Summary: ${p.content.substring(0, 50)}...\n`;
                }
            });
            const isRelevant = precedents.some(p => (p.title && p.title.includes('괴롭힘')) || (p.content && p.content.includes('괴롭힘')));
            logContent += `\n[Relevance Check]: Found '괴롭힘' in results? ${isRelevant}\n`;
            fs.writeFileSync('result_log.txt', logContent);

            console.log(logContent); // Keep console log too
        } catch (e) {
            console.error("Error parsing precedents header:", e);
        }
    } else {
        console.log("No precedents header found.");
    }

    let body = '';
    res.on('data', (d) => {
        body += d;
    });

    res.on('end', () => {
        const fs = require('fs');
        fs.writeFileSync('test_output.txt', `Status: ${res.statusCode}\nBody: ${body}`);
        if (res.statusCode !== 200) {
            console.log(`Error Response logged to test_output.txt`);
        }
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(data);
req.end();
