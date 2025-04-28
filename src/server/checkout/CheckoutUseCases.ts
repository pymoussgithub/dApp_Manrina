import { CustomerRepository } from '../customer/CustomerRepository';
import { ICheckoutCreatePayload } from '../payment/CheckoutSession';
import { StockUseCases } from '../stock/StockUseCases';
import { CheckoutRepository } from './CheckoutRepository';
import { Basket } from './IBasket';
import { CheckoutSession } from './ICheckout';

export class CheckoutUseCases {
    constructor(
        private checkoutRepository: CheckoutRepository,
        private stockUseCases: StockUseCases,
        private customerRepository: CustomerRepository,
    ) {}

    public saveBasketSession = async (checkoutPayload: ICheckoutCreatePayload) => {
        const customer = await this.customerRepository.getMatchingCustomerOrCreate(checkoutPayload.contact);
        const basketToSave = Basket.fromCheckoutPayload(customer.id, checkoutPayload);
        const basketSaved = await this.checkoutRepository.createBasketSession(basketToSave);
        return {
            basket: basketSaved,
            customer,
        };
    };

    public getBasketSessions = async () => {
        return await this.checkoutRepository.getBasketSessions();
    };

    public createCheckoutSession = async (basket: Basket) => {
        const checkoutSessionToSave = CheckoutSession.newCheckoutSession(basket.id, basket.total);
        const checkoutSession = await this.checkoutRepository.saveCheckoutSession(checkoutSessionToSave);
        return checkoutSession;
    };

    public getCheckoutSessionById = this.checkoutRepository.getCheckoutSessionById;

    public handleSuccessfulPayment = async (checkoutSessionId: string, rawPayload: any) => {
        const checkoutSession = await this.checkoutRepository.getCheckoutSessionById(checkoutSessionId);

        if (!checkoutSession) {
            throw new Error('Checkout session not found');
        }

        await this.checkoutRepository.markCheckoutSessionAsPaid(checkoutSession, rawPayload);

        await this.stockUseCases.updateStockAfterCheckout({
            checkoutSessionId,
            items: checkoutSession.basketSession.items.map((item) => ({
                variantId: item.productVariantId,
                quantity: item.quantity,
            })),
            reason: 'Checkout completed',
        });
    };
}
