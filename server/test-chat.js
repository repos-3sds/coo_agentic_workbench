const http = require('http');

const data = JSON.stringify({
    agent_id: "AG_NPA_BIZ",
    query: "hello",
    response_mode: "streaming",
    inputs: {}
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/dify/chat',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, res => {
    console.log(`statusCode: ${res.statusCode}`);
    res.on('data', d => process.stdout.write(d));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
