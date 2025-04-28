import { Prisma, PrismaClient } from '@prisma/client';
import { CheckoutRepository } from './CheckoutRepository';
import { Basket } from './IBasket';
import { CheckoutSession, CheckoutSessionWithBasket } from './ICheckout';

type PAYMENT_STATUSES = 'pending' | 'paid' | 'failed';

export class CheckoutRepositoryPrismaImplementation implements CheckoutRepository {
    constructor(private prisma: PrismaClient) {}

    public createBasketSession = async (basketSession: Basket): Promise<Basket> => {
        const basketSessionCreated = await this.prisma.basketSession.create({
            data: {
                id: basketSession.id,
                customer: { connect: { id: basketSession.customerId } },
                items: {
                    create: basketSession.items.map((item) => ({
                        name: item.name,
                        price: item.price,
                        productVariantId: item.productVariantId,
                        productId: item.productId,
                        quantity: item.quantity,
                    })),
                },
                total: basketSession.total,
                paymentStatus: basketSession.paymentStatus,
                address: basketSession.address?.id
                    ? {
                          connectOrCreate: {
                              where: { id: basketSession.address.id },
                              create: {
                                  id: basketSession.address.id,
                                  postalCode: basketSession.address.postalCode,
                                  address: basketSession.address.address,
                                  city: basketSession.address.city,
                                  country: basketSession.address.country,
                                  name: basketSession.address.name,
                                  type: basketSession.address.type,
                              },
                          },
                      }
                    : basketSession.address
                      ? {
                            create: {
                                postalCode: basketSession.address.postalCode,
                                address: basketSession.address.address,
                                city: basketSession.address.city,
                                country: basketSession.address.country,
                                name: basketSession.address.name,
                                type: basketSession.address.type,
                            },
                        }
                      : undefined,
                deliveryCost: basketSession.deliveryCost,
                deliveryDay: basketSession.deliveryDay,
                delivered: basketSession.delivered,
                retrieved: basketSession.retrieved,
            },
            include: {
                items: true,
                address: true,
            },
        });
        return new Basket(basketSessionCreated);
    };

    public getBasketSessions = async (): Promise<Basket[]> => {
        const basketSessions = await this.prisma.basketSession.findMany({
            include: {
                items: true,
                address: true,
                checkoutSession: {
                    select: {
                        id: true,
                        basketSessionId: true,
                        paymentStatus: true,
                        paymentAmount: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
            },
        });
        return basketSessions.map((basketSession) => new Basket(basketSession));
    };

    public getCheckoutSessionById = async (checkoutSessionId: string): Promise<CheckoutSessionWithBasket> => {
        return (await this.prisma.checkoutSession.findUniqueOrThrow({
            where: { id: checkoutSessionId },
            include: {
                basketSession: {
                    include: { items: true },
                },
            },
        })) as CheckoutSessionWithBasket;
    };

    public saveCheckoutSession = async (checkoutSession: CheckoutSession): Promise<CheckoutSession> => {
        const checkoutSessionSaved = await this.prisma.checkoutSession.upsert({
            where: { id: checkoutSession.id },
            update: { ...checkoutSession },
            create: { ...checkoutSession },
            select: {
                id: true,
                basketSessionId: true,
                paymentAmount: true,
                paymentStatus: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return new CheckoutSession(checkoutSessionSaved);
    };

    public markCheckoutSessionAsPaid = async (checkoutSession: CheckoutSession, rawPayload: Prisma.JsonObject) => {
        await this.prisma.checkoutSession.update({
            where: { id: checkoutSession.id },
            data: {
                paymentStatus: 'paid' as PAYMENT_STATUSES,
                basketSession: {
                    update: {
                        paymentStatus: 'paid' as PAYMENT_STATUSES,
                    },
                },
                successPayload: rawPayload,
            },
        });
    };
}
