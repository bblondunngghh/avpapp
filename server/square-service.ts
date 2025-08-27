import { SquareClient, SquareEnvironment } from 'squareup';

interface SquareConfig {
  accessToken: string;
  locationId: string;
  environment: SquareEnvironment;
}

interface DailySales {
  date: string;
  totalSales: number;
  cardTransactions: number;
  cardSales: number;
  tips: number;
  transactions: SquareTransaction[];
}

interface SquareTransaction {
  id: string;
  amount: number;
  tipAmount: number;
  createdAt: string;
  cardBrand?: string;
  lastFour?: string;
}

class SquareService {
  private client: SquareClient;
  private locationId: string;

  constructor(config: SquareConfig) {
    console.log('[SQUARE] Initializing client with:', {
      environment: config.environment,
      accessTokenLength: config.accessToken?.length,
      locationId: config.locationId
    });
    
    this.client = new SquareClient({
      environment: config.environment,
      token: config.accessToken,
    });
    this.locationId = config.locationId;
  }

  /**
   * Get daily sales data for revenue reconciliation
   */
  async getDailySales(date: string): Promise<DailySales> {
    try {
      const startTime = `${date}T00:00:00.000Z`;
      const endTime = `${date}T23:59:59.999Z`;

      console.log(`[SQUARE] Fetching payments for ${date} (${startTime} to ${endTime})`);

      const response = await this.client.payments.list({
        locationId: this.locationId,
        beginTime: startTime,
        endTime: endTime,
        sortOrder: 'ASC'
      });

      const payments = response.payments || [];
      console.log(`[SQUARE] Found ${payments.length} payments for ${date}`);

      return this.processDailyPayments(payments, date);
    } catch (error) {
      console.error('[SQUARE] Error fetching daily sales:', error);
      throw error;
    }
  }

  /**
   * Process payments into daily sales summary
   */
  private processDailyPayments(payments: any[], date: string): DailySales {
    let totalSales = 0;
    let cardTransactions = 0;
    let cardSales = 0;
    let tips = 0;
    const transactions: SquareTransaction[] = [];

    payments.forEach(payment => {
      // Only process completed payments
      if (payment.status !== 'COMPLETED') {
        return;
      }

      const amount = payment.amountMoney?.amount ? payment.amountMoney.amount / 100 : 0; // Convert from cents
      const tipAmount = payment.tipMoney?.amount ? payment.tipMoney.amount / 100 : 0;
      
      // Get card details if available
      const cardDetails = payment.cardDetails;
      const cardBrand = cardDetails?.card?.cardBrand;
      const lastFour = cardDetails?.card?.last4;

      totalSales += amount;
      cardTransactions += 1;
      cardSales += amount;
      tips += tipAmount;

      transactions.push({
        id: payment.id || '',
        amount,
        tipAmount,
        createdAt: payment.createdAt || '',
        cardBrand,
        lastFour
      });
    });

    return {
      date,
      totalSales,
      cardTransactions,
      cardSales,
      tips,
      transactions
    };
  }

  /**
   * Compare Square data with shift report for reconciliation
   */
  async reconcileWithShiftReport(shiftReport: any, date: string): Promise<{
    match: boolean;
    discrepancies: string[];
    squareData: DailySales;
    differences: {
      creditTransactions: number;
      creditSales: number;
      tips: number;
    };
  }> {
    const squareData = await this.getDailySales(date);
    const discrepancies: string[] = [];
    
    // Compare credit card transactions
    const creditTransactionDiff = squareData.cardTransactions - shiftReport.creditTransactions;
    if (creditTransactionDiff !== 0) {
      discrepancies.push(`Credit transactions: Square shows ${squareData.cardTransactions}, shift report shows ${shiftReport.creditTransactions} (difference: ${creditTransactionDiff})`);
    }

    // Compare credit card sales
    const creditSalesDiff = Math.round((squareData.cardSales - shiftReport.totalCreditSales) * 100) / 100;
    if (Math.abs(creditSalesDiff) > 0.01) { // Allow for penny differences due to rounding
      discrepancies.push(`Credit sales: Square shows $${squareData.cardSales.toFixed(2)}, shift report shows $${shiftReport.totalCreditSales.toFixed(2)} (difference: $${creditSalesDiff.toFixed(2)})`);
    }

    // Compare tips (if tracked in shift report)
    const tipsDiff = Math.round((squareData.tips - (shiftReport.ccTips || 0)) * 100) / 100;
    if (Math.abs(tipsDiff) > 0.01) {
      discrepancies.push(`Credit card tips: Square shows $${squareData.tips.toFixed(2)}, shift report shows $${(shiftReport.ccTips || 0).toFixed(2)} (difference: $${tipsDiff.toFixed(2)})`);
    }

    return {
      match: discrepancies.length === 0,
      discrepancies,
      squareData,
      differences: {
        creditTransactions: creditTransactionDiff,
        creditSales: creditSalesDiff,
        tips: tipsDiff
      }
    };
  }

  /**
   * Create a test payment in sandbox (for testing purposes)
   */
  async createTestPayment(amount: number, tipAmount: number = 0): Promise<any> {
    try {
      console.log(`[SQUARE] Creating test payment: $${amount/100} + $${tipAmount/100} tip`);
      
      const paymentRequest: any = {
        sourceId: 'cnon:card-nonce-ok', // Square's test card nonce
        idempotencyKey: `test-payment-${Date.now()}-${Math.random()}`, // Unique key for each payment
        amountMoney: {
          amount: amount, // Keep as number - Square SDK should handle conversion
          currency: 'USD'
        },
        locationId: this.locationId
      };

      if (tipAmount > 0) {
        paymentRequest.tipMoney = {
          amount: tipAmount, // Keep as number - Square SDK should handle conversion
          currency: 'USD'
        };
      }

      const response = await this.client.payments.create(paymentRequest);
      
      console.log('[SQUARE] Test payment created successfully:', response.id);
      return response;
    } catch (error) {
      console.error('[SQUARE] Error creating test payment:', error);
      console.error('[SQUARE] Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  /**
   * Get Square transaction details for a specific transaction ID
   */
  async getTransactionDetails(paymentId: string): Promise<SquareTransaction | null> {
    try {
      const response = await this.client.payments.get(paymentId);
      
      const payment = response;
      if (!payment) return null;

      return {
        id: payment.id || '',
        amount: payment.amountMoney?.amount ? payment.amountMoney.amount / 100 : 0,
        tipAmount: payment.tipMoney?.amount ? payment.tipMoney.amount / 100 : 0,
        createdAt: payment.createdAt || '',
        cardBrand: payment.cardDetails?.card?.cardBrand,
        lastFour: payment.cardDetails?.card?.last4
      };
    } catch (error) {
      console.error('[SQUARE] Error fetching transaction details:', error);
      return null;
    }
  }
}

// Create and export the service instance
let squareService: SquareService | null = null;

export function initializeSquareService(): SquareService | null {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  
  if (!accessToken || !locationId) {
    console.log('[SQUARE] Square credentials not configured - Square integration disabled');
    return null;
  }

  const environment = process.env.NODE_ENV === 'production' 
    ? SquareEnvironment.Production 
    : SquareEnvironment.Sandbox;

  console.log(`[SQUARE] Initializing Square service for ${environment} environment`);
  
  squareService = new SquareService({
    accessToken,
    locationId,
    environment
  });

  return squareService;
}

export function getSquareService(): SquareService | null {
  return squareService;
}

export { SquareService, DailySales, SquareTransaction };