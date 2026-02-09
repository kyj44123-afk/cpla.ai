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

console.log("Testing query: '직원들의 평가보상체계를 개편하고 싶습니다. 관련 판례가 있을까요?'...");
const query = "직원들의 평가보상체계를 개편하고 싶습니다. 관련 판례가 있을까요?";

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
                logContent += `${i + 1}. ${title} (${p.caseNumber})\n`;
                logContent += `   Content Length: ${p.content.length}\n`;
                logContent += `   Sample: ${p.content.substring(0, 50)}...\n`;
            });

            // Check if results are labor related
            const isLabor = precedents.every(p => {
                const keywords = ["근로", "노동", "임금", "해고", "퇴직", "산재", "취업규칙", "단체협약", "파업", "노조", "휴업", "수당"];
                return keywords.some(k => (p.title + p.content).includes(k));
            });
            logContent += `\n[Labor Law Validation]: All results are labor-related? ${isLabor}\n`;

            fs.writeFileSync('test_labor_log.txt', logContent);
            console.log(logContent);

        } catch (e) {
            console.error("Error parsing precedents header:", e);
        }
    } else {
        console.log("No precedents header found.");
    }
});

req.on('error', (error) => {
    console.error(error);
});

req.write(data);
req.end();
