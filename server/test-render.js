const https = require('https');

const data = JSON.stringify({
    agent_id: "NPA_ORCHESTRATOR",
    query: "hello",
    response_mode: "streaming",
    inputs: {}
});

const options = {
    hostname: 'npa-workbench.onrender.com',
    port: 443,
    path: '/api/dify/chat',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, res => {
    console.log(`statusCode: ${res.statusCode}`);
    res.on('data', d => process.stdout.write(d));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
