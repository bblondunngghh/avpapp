// Test script to create a Square sandbox payment
import { SquareClient, SquareEnvironment } from 'squareup';

const client = new SquareClient({
  environment: SquareEnvironment.Sandbox,
  accessToken: 'EAAAl1-0RHBrNdF01YDv8I1qjOF5r0FEeQHgU25ERPe-zFxrhBIZzSMP1jWLPgGS'
});

async function createTestPayment() {
  try {
    console.log('Creating test payment...');
    
    const response = await client.payments.createPayment({
      sourceId: 'cnon:card-nonce-ok', // Test card nonce
      amountMoney: {
        amount: 2000, // $20.00
        currency: 'USD'
      },
      tipMoney: {
        amount: 300, // $3.00 tip
        currency: 'USD'
      },
      locationId: 'L4800NSKCAZK5'
    });

    console.log('✅ Payment created successfully!');
    console.log('Payment ID:', response.id);
    console.log('Amount:', response.amountMoney?.amount / 100);
    console.log('Tip:', response.tipMoney?.amount / 100);
    console.log('Created:', response.createdAt);
    
    return response;
  } catch (error) {
    console.error('❌ Error creating payment:', error);
  }
}

// Run the test
createTestPayment();