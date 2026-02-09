// verify_chat.js
async function testChat() {
    console.log("Sending request to http://localhost:3000/api/chat...");
    try {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: '수습기간 해고에 대해 알려줘' }],
                sessionId: 'test-session-123'
            }),
        });

        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`);
            try {
                const text = await response.text();
                console.error(text);
            } catch (e) { }
            return;
        }

        console.log("Headers:");
        const precedents = response.headers.get('x-cpla-precedents');
        if (precedents) {
            console.log("X-CPLA-Precedents header found.");
            try {
                const decoded = Buffer.from(precedents, 'base64').toString('utf-8');
                // Decode unicode characters
                const parsed = JSON.parse(decoded);
                console.log("Precedents Data (First item):", JSON.stringify(parsed[0], null, 2));
            } catch (e) {
                console.log("Failed to decode precedents header:", e.message);
            }
        } else {
            console.log("X-CPLA-Precedents header NOT found.");
        }

        console.log("\nResponse Body:");
        // For Node.js fetch, body is a stream but we can also get text
        // But since it's a stream response, let's try to read it
        if (response.body && response.body.getReader) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                process.stdout.write(decoder.decode(value, { stream: true }));
            }
        } else {
            // Fallback for Node 18 native fetch which might return a web stream or node stream depending on implementation
            for await (const chunk of response.body) {
                process.stdout.write(Buffer.from(chunk).toString());
            }
        }
        console.log("\n\nStream ended.");

    } catch (error) {
        console.error("Request failed:", error);
    }
}

testChat();
