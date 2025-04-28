import { Basket } from '../checkout/IBasket';
import { ICustomer } from '../customer/Customer';

export interface PaymentService {
    getPaymentLink: (
        customer: ICustomer,
        basket: Basket,
        checkoutSessionId: string,
        checkoutStatusUrl: string,
    ) => Promise<{ id: string; url: string; total: number }>;
    handleWebhook: (
        reqBody: string | Buffer,
        reqHeaders: Record<string, string>,
    ) => Promise<BasketPaid & { rawPayload: any }>;
}

type BasketPaid = {
    type: 'basketPaid';
    basketId: string;
    customerId: string;
    checkoutSessionId: string;
};
