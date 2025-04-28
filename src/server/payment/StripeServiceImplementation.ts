import stripeLib from 'stripe';
import { Basket } from '../checkout/IBasket';
import { ICustomer } from '../customer/Customer';
import { PaymentService } from './PaymentService';

const SESSION_EXPIRATION_TIME = 60 * 60 * 2; // 2 hours
export class StripeServiceImplementation implements PaymentService {
    stripe: stripeLib;
    constructor(private secretKey: string) {
        if (!this.secretKey) {
            throw new Error('Stripe secret key is not set');
        }
        this.stripe = new stripeLib(this.secretKey);
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            throw new Error('STRIPE_WEBHOOK_SECRET is not set --> stripe webhooks cannot be verified');
        }
    }
    getBillingLink = async (customer: IStripeCustomer) => {
        const session = await this.stripe.billingPortal.sessions.create({
            customer: customer.getStripeCustomerId(),
        });
        return session.url;
    };
    createNewCustomerBilling = async (customer: IStripeCustomer) => {
        const stripeCustomer = await this.stripe.customers.create({
            email: customer.email,
        });
        customer.setStripeCustomerId(stripeCustomer.id);
        return customer;
    };

    createCustomer = async (customer: IStripeCustomer) => {
        const params: stripeLib.CustomerCreateParams = {
            email: customer.email,
            metadata: {
                dbCustomerId: customer.id,
            },
        };
        const stripeCustomer: stripeLib.Customer = await this.stripe.customers.create(params);

        return stripeCustomer;
    };

    getSuccessUrl = (checkoutStatusUrl: string, checkoutId: string, status: 'success' | 'fail') => {
        return `${checkoutStatusUrl}/${status}?checkoutId=${checkoutId}`;
    };

    getPaymentLink = async (
        customer: ICustomer,
        basket: Basket,
        checkoutSessionId: string,
        checkoutStatusUrl: string,
    ) => {
        const items = basket.items.map((item) => {
            return {
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: item.name,
                    },
                    unit_amount: Math.round(item.price * 100),
                },
                quantity: item.quantity,
            };
        });
        if(basket.deliveryCost > 0) {
            items.push({
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: 'Livraison',
                    },
                    unit_amount: Math.round(basket.deliveryCost * 100),
                },
                quantity: 1,
            });
        }
        const params: stripeLib.Checkout.SessionCreateParams = {
            customer_email: customer.email,
            payment_method_types: ['card'],
            line_items: items,
            metadata: {
                customerId: customer.id,
                basketId: basket.id,
                checkoutSessionId,
            },
            mode: 'payment',
            allow_promotion_codes: true,
            expires_at: Math.floor(Date.now() / 1000) + SESSION_EXPIRATION_TIME,
            success_url: this.getSuccessUrl(checkoutStatusUrl, checkoutSessionId, 'success'),
            cancel_url: this.getSuccessUrl(checkoutStatusUrl, checkoutSessionId, 'fail'),
        };
        const session: stripeLib.Checkout.Session = await this.stripe.checkout.sessions.create(params);
        if (!session.url) {
            throw new Error('Error creating checkout session, please retry later');
        }
        if (!session.amount_total) {
            throw new Error('Error creating checkout session: amount_total is missing');
        }
        return { id: session.id, total: session.amount_total, url: session.url };
    };

    verifyWebhook = async (payload: string | Buffer, sig: string) => {
        return this.stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET as string);
    };

    handleWebhook = async (reqBody: string | Buffer, reqHeaders: Record<string, string>) => {
        const sig = reqHeaders['stripe-signature'] as string;
        const event = await this.verifyWebhook(reqBody, sig);
        if (event.type === 'checkout.session.completed') {
            const checkoutSession = event.data.object;
            const checkoutSessionMetadata = checkoutSession.metadata;
            if (!checkoutSessionMetadata) {
                throw new Error(`Checkout session metadata is missing from ${event.type} ${event.id}`);
            }
            if (
                !checkoutSessionMetadata.basketId ||
                !checkoutSessionMetadata.customerId ||
                !checkoutSessionMetadata.checkoutSessionId
            ) {
                throw new Error(
                    `Checkout session metadata is missing basketId or customerId or checkoutSessionId from ${event.type} ${event.id}`,
                );
            }
            return {
                type: 'basketPaid',
                basketId: checkoutSessionMetadata.basketId,
                customerId: checkoutSessionMetadata.customerId,
                checkoutSessionId: checkoutSessionMetadata.checkoutSessionId,
                rawPayload: checkoutSession,
            } as const;
        }
        throw new Error(`Webhook event not handled: ${event.type}`);
    };
}
export interface IStripeCustomer {
    email: string;
    id: string;
    getStripeCustomerId: () => string;
    setStripeCustomerId: (stripeCustomerId: string) => void;
}
