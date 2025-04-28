import productsAndVariants from '../mock/products.json';
import { INotificationManager } from '../pwa/INotificationManager';
import { ReqInfos } from '../service/BackendFetchService';
import { AdminUseCases } from './admin/AdminUseCases';
import { IAdminLoginPayload } from './admin/IAdmin';
import { CheckoutUseCases } from './checkout/CheckoutUseCases';
import { ICheckoutCreatePayload } from './payment/CheckoutSession';
import { PaymentUseCases } from './payment/PaymentUseCases';
import { IProduct } from './product/IProduct';
import { ProductUseCases } from './product/ProductUseCases';
import { StockUseCases } from './stock/StockUseCases';

export class ApiUseCases {
    constructor(
        private paymentUseCases: PaymentUseCases,
        private productUseCases: ProductUseCases,
        private stockUseCases: StockUseCases,
        private checkoutUseCases: CheckoutUseCases,
        private notificationManager: INotificationManager,
        private adminUseCases: AdminUseCases,
    ) {}

    // Admin methods
    public adminLogin = async (loginPayload: IAdminLoginPayload, { res }: ReqInfos) => {
        try{
            const jwt = await this.adminUseCases.login(loginPayload);
            res.setHeader('Set-Cookie', `adminToken=${jwt.jwt}; HttpOnly; Path=/; Max-Age=3600;`);
            return { success: true };
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    };

    public adminLogout = ({ res }: ReqInfos) => {
        res.setHeader('Set-Cookie', 'adminToken=; HttpOnly; Path=/; Max-Age=0;');
        return { success: true };
    };

    public verifyAdminToken = ({ req }: ReqInfos) => {
        const token = req.cookies.adminToken;
        if (!token) return false;
        return this.adminUseCases.verifyToken(token);
    };

    public createCheckoutSession = async (checkoutCreatePayload: ICheckoutCreatePayload, checkoutStatusUrl: string) => {
        const { basket, customer } = await this.checkoutUseCases.saveBasketSession(checkoutCreatePayload);
        const checkoutSession = await this.checkoutUseCases.createCheckoutSession(basket);
        const { paymentUrl } = await this.paymentUseCases.getPaymentLink(
            customer,
            basket,
            checkoutSession,
            checkoutStatusUrl,
        );

        return {
            basketId: basket.id,
            paymentUrl,
            checkoutSessionId: checkoutSession.id,
        };
    };
    public getCheckoutSessionById = this.checkoutUseCases.getCheckoutSessionById;

    public createProductsFromMock = async () => {
        return await this.createProducts(productsAndVariants);
    };

    public createProducts = async (productsToCreate: any[] = []) => {
        // const productsGroupedByItemName = productsAndVariants.reduce((acc, product) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const productsGroupedByItemName = productsToCreate.reduce(
            (acc, product) => {
                const productId = product['Item id (Do not change)'];
                const productName = product['Item name'];
                if (!acc[productName]) {
                    acc[productName] = {
                        id: productId,
                        category: product.Category,
                        name: product['Item name'],
                        imageUrl: product['Image 1'],
                        description: product['Description (Online Store and Invoices only)'],
                        wallet_address: product['Wallet Address'] || undefined,
                        producer_name: product['Producer Name'] || undefined,
                        variants: [],
                    };
                }
                if (product['Variant id (Do not change)']) {
                    acc[productName].variants.push({
                        id: product['Variant id (Do not change)'],
                        optionSet: product['Option set 1'],
                        optionValue: product['Option 1'] || product['Variations'],
                        productId: productId,
                        description: product['Description (Online Store and Invoices only)'],
                        imageUrl: product['Image 1'],
                        price: +product.Price,
                        stock: +product.Quantity,
                    });
                }
                return acc;
            },
            {} as Record<string, IProduct>,
        );
        const products: IProduct[] = Object.values(productsGroupedByItemName);
        return await this.productUseCases.createProducts(products);
    };

    public getAllProductsWithStock = async () => {
        return await this.productUseCases.getAllProductsWithStock();
    };
    public getAllProducts = this.productUseCases.getAllProducts;

    public getDeliveryMethods = async () => {
        return await this.productUseCases.getDeliveryMethods();
    };

    public subscribeUser = this.notificationManager.subscribeUser;
    public unsubscribeUser = this.notificationManager.unsubscribeUser;
    public sendNotification = this.notificationManager.sendNotification;

    public adjustStock = this.stockUseCases.adjustStock;
    public getStockMovements = this.stockUseCases.getStockMovements;

    public getBasketSessions = this.checkoutUseCases.getBasketSessions;
}
