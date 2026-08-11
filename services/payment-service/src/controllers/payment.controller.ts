import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';

export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  checkout = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId, amount, currency, cardToken } = req.body;
      const result = await this.paymentService.processCheckout({
        orderId,
        amount,
        currency,
        cardToken,
      });

      res.status(200).json({
        status: 'success',
        message: 'Payment processed successfully and webhook dispatched',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'fail',
        message: error.message || 'Payment processing failed',
      });
    }
  };

  getTransactions = (_req: Request, res: Response): void => {
    const transactions = this.paymentService.getTransactions();
    res.status(200).json({
      status: 'success',
      results: transactions.length,
      data: { transactions },
    });
  };

  healthCheck = (_req: Request, res: Response): void => {
    res.status(200).json({
      status: 'UP',
      service: 'payment-service',
      timestamp: new Date().toISOString(),
    });
  };
}
