import { IdGenerator } from '../../service/IdGenerator';
import { ICheckoutCreatePayload } from '../payment/CheckoutSession';

interface IAddress {
    id: string;
    postalCode: string;
    address: string;
    city: string;
    country: string;
    name: string;
    type: string; // customer, relay, other
}

export interface IBasket {
    id: string;
    customerId: string;
    items: Array<{
        productId: string;
        productVariantId: string;
        quantity: number;
        name: string;
        price: number;
    }>;
    total: number;
    paymentStatus: string;
    address: IAddress | null;
    deliveryCost: number;
    deliveryDay: string | null;
    delivered: string | null;
    retrieved: string | null;
}

const PAYMENT_STATUS = {
    PENDING: 'pending',
    PAID: 'paid',
    CANCELLED: 'cancelled',
};

export class Basket implements IBasket {
    readonly id: string;
    readonly customerId: string;
    readonly items: Array<{
        productId: string;
        productVariantId: string;
        quantity: number;
        name: string;
        price: number;
    }>;
    readonly total: number;
    readonly paymentStatus: string;
    readonly address: IAddress | null;
    readonly deliveryCost: number;
    readonly delivered: string | null;
    readonly retrieved: string | null;
    readonly deliveryDay: string | null;

    constructor(basket: IBasket) {
        this.id = basket.id;
        this.customerId = basket.customerId;
        this.items = basket.items;
        this.total = basket.total;
        this.paymentStatus = basket.paymentStatus;
        this.address = basket.address;
        this.deliveryCost = basket.deliveryCost;
        this.delivered = basket.delivered;
        this.retrieved = basket.retrieved;
        this.deliveryDay = basket.deliveryDay;
    }

    static fromCheckoutPayload(customerId: string, checkoutPayload: ICheckoutCreatePayload) {
        const totalPanier = checkoutPayload.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const deliveryCost = checkoutPayload.deliveryMethod.basePrice || 0;
        const total = totalPanier + deliveryCost;
        return new Basket({
            id: IdGenerator.generateIdWithPrefix('bas'),
            customerId: customerId,
            items: checkoutPayload.items.map((item) => {
                return {
                    productId: item.product.id,
                    productVariantId: item.productVariant.id,
                    quantity: item.quantity,
                    name: item.product.name,
                    price: item.productVariant.price,
                };
            }),
            total: total,
            paymentStatus: PAYMENT_STATUS.PENDING,
            address: {
                id: checkoutPayload.deliveryMethod.id,
                postalCode: checkoutPayload.deliveryMethod.location.postalCode,
                address: checkoutPayload.deliveryMethod.location.address,
                city: checkoutPayload.deliveryMethod.location.city,
                country: 'MQ',
                name: checkoutPayload.contact.name,
                type: 'customer',
            },
            deliveryCost: deliveryCost,
            deliveryDay: checkoutPayload.dayChosen,
            delivered: null,
            retrieved: null,
        });
    }
}
