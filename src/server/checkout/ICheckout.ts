import { IdGenerator } from '../../service/IdGenerator';

export interface ICheckoutSession {
    id: string;
    basketSessionId: string;
    paymentStatus: string; // pending, paid, failed
    paymentAmount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CheckoutSessionWithBasket extends ICheckoutSession {
    basketSession: {
        items: Array<{
            productVariantId: string;
            quantity: number;
        }>;
    };
}

export const isCheckoutSessionPaid = (checkoutSession: ICheckoutSession) => {
    return checkoutSession.paymentStatus === 'paid';
};

export class CheckoutSession implements ICheckoutSession {
    id: string;
    basketSessionId: string;
    paymentStatus: string; // pending, paid, failed
    paymentAmount: number;
    createdAt: Date;
    updatedAt: Date;

    constructor(checkoutSession: ICheckoutSession) {
        this.id = checkoutSession.id;
        this.basketSessionId = checkoutSession.basketSessionId;
        this.paymentStatus = checkoutSession.paymentStatus;
        this.paymentAmount = checkoutSession.paymentAmount;
        this.createdAt = checkoutSession.createdAt;
        this.updatedAt = checkoutSession.updatedAt;
    }

    public static newCheckoutSession(basketSessionId: string, paymentAmount: number) {
        return new CheckoutSession({
            id: IdGenerator.generateIdWithPrefix('cs'),
            basketSessionId,
            paymentStatus: 'pending',
            paymentAmount,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
}
