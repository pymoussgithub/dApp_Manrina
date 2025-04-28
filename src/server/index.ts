import { NotificationManager } from '../pwa/actions';
import { AdminRepositoryPrismaImplementation } from './admin/AdminRepositoryPrismaImplementation';
import { AdminUseCases } from './admin/AdminUseCases';
import { ApiUseCases } from './ApiUseCases';
import { CheckoutRepositoryPrismaImplementation } from './checkout/CheckoutRepositoryPrismaImplementation';
import { CheckoutUseCases } from './checkout/CheckoutUseCases';
import { CustomerRepositoryPrismaImplementation } from './customer/CustomerRepositoryPrismaImplementation';
import { prisma } from './database/prisma';
import { PaymentUseCases } from './payment/PaymentUseCases';
import { StripeServiceImplementation } from './payment/StripeServiceImplementation';
import { ProductRepositoryPrismaImplementation } from './product/ProductRepositoryPrismaImplementation';
import { ProductUseCases } from './product/ProductUseCases';
import { JwtService } from './services/JwtService';
import { PasswordService } from './services/PasswordService';
import { StockRepositoryPrismaImplementation } from './stock/StockRepositoryPrismaImplementation';
import { StockUseCases } from './stock/StockUseCases';

const stripeService = new StripeServiceImplementation(process.env.STRIPE_SECRET_KEY as string);

const productRepository = new ProductRepositoryPrismaImplementation(prisma);
const productUseCases = new ProductUseCases(productRepository);

const stockRepository = new StockRepositoryPrismaImplementation(prisma);
const checkoutRepository = new CheckoutRepositoryPrismaImplementation(prisma);
const stockUseCases = new StockUseCases(stockRepository);
const customerRepository = new CustomerRepositoryPrismaImplementation(prisma);
const checkoutUseCases = new CheckoutUseCases(checkoutRepository, stockUseCases, customerRepository);

export const paymentUseCases = new PaymentUseCases(stripeService, checkoutUseCases);
const notificationManager = new NotificationManager();

// Admin services and repositories
const jwtService = new JwtService();
const passwordService = new PasswordService();
const adminRepository = new AdminRepositoryPrismaImplementation(prisma, passwordService);
const adminUseCases = new AdminUseCases(adminRepository, jwtService);

export const apiUseCases = new ApiUseCases(
    paymentUseCases,
    productUseCases,
    stockUseCases,
    checkoutUseCases,
    notificationManager,
    adminUseCases,
);
