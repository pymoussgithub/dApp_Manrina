import { Basket } from './IBasket';
import { CheckoutSession, CheckoutSessionWithBasket } from './ICheckout';

export interface CheckoutRepository {
    createBasketSession: (basketSession: Basket) => Promise<Basket>;
    getBasketSessions: () => Promise<Basket[]>;
    getCheckoutSessionById: (checkoutSessionId: string) => Promise<CheckoutSessionWithBasket>;
    saveCheckoutSession: (checkoutSession: CheckoutSession) => Promise<CheckoutSession>;
    markCheckoutSessionAsPaid: (checkoutSession: CheckoutSession, rawPayload: any) => Promise<void>;
}
