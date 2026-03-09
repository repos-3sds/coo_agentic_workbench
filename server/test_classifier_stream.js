const axios = require('axios');

async function test() {
  try {
    console.log("Sending POST to http://localhost:3000/api/dify/workflow (streaming)...");
    const res = await axios.post('http://localhost:3000/api/dify/workflow', {
      agent_id: 'CLASSIFIER',
      response_mode: 'streaming',
      inputs: {
        product_description: 'Auto-Callable Note linked to S&P 500...',
        product_category: 'Structured Product',
        underlying_asset: 'S&P 500',
        notional_amount: '5000000',
        currency: 'USD',
        customer_segment: 'Accredited Investors',
        booking_location: 'Singapore',
        is_cross_border: 'false',
        agent_id: 'CLASSIFIER'
      }
    }, { responseType: 'stream' });

    res.data.on('data', chunk => {
      console.log('CHUNK:', chunk.toString());
    });
    
    res.data.on('end', () => {
      console.log('Stream ended');
    });
  } catch (err) {
    if (err.response) {
      console.error('API Error:', err.response.status);
      err.response.data.on('data', chunk => console.error(chunk.toString()));
    } else {
      console.error('Error:', err.message);
    }
  }
}
test();
