
// Use native fetch (Node 18+)
async function run() {
    try {
        console.log("Sending request...");
        const response = await fetch('http://localhost:3000/api/manual-eval', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                testTitle: "Manual Eval Repro Node",
                testQuestionId: "REPRO-002",
                commonTestEnv: "Test Env",
                question: "Test Question Node",
                responseA: { content: "A content", env: "Env A" },
                responseB: { content: "B content", env: "Env B" }
            })
        });

        if (!response.ok) {
            console.error('Error:', response.status, response.statusText);
            const text = await response.text();
            console.error(text);
            return;
        }

        console.log("Response OK. Reading stream...");
        // Node fetch body is a ReadableStream (web standard)
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            console.log(decoder.decode(value));
        }

    } catch (e) {
        console.error("Exception:", e);
    }
}

run();
