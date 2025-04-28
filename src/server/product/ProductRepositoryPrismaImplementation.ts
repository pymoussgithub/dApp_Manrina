import { Prisma, PrismaClient } from '@prisma/client';
import { ProductDtoForCreation } from './IProduct';
import { ProductEntity } from './ProductEntity';
import { ProductRepository } from './ProductRepository';

export class ProductRepositoryPrismaImplementation implements ProductRepository {
    constructor(private prisma: PrismaClient) {}

    public createProduct = async (productDto: ProductEntity) => {
        const result = await this.prisma.product.create({
            data: {
                id: productDto.id,
                category: productDto.category,
                name: productDto.name,
                description: productDto.description ?? Prisma.skip,
                imageUrl: productDto.imageUrl,
                wallet_address: productDto.wallet_address ?? Prisma.skip,
                producer_name: productDto.producer_name ?? Prisma.skip,
                variants: {
                    createMany: {
                        data: productDto.variants.map((variant) => ({
                            id: variant.id,
                            optionSet: variant.optionSet,
                            optionValue: variant.optionValue,
                            description: variant.description,
                            imageUrl: variant.imageUrl,
                            price: variant.price,
                            stock: variant.stock,
                        })),
                    },
                },
            },
            include: {
                variants: true,
            },
        });
        return new ProductEntity(result);
    };

    public updateProduct = (productDto: ProductDtoForCreation) => {
        return this.prisma.product.update({
            where: { id: productDto.id },
            data: {
                category: productDto.category,
                name: productDto.name,
                description: productDto.description,
                imageUrl: productDto.imageUrl,
                variants: {
                    updateMany: [],
                },
            },
        });
    };

    public getAllProducts = async () => {
        const products = await this.prisma.product.findMany({
            include: {
                variants: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        return products.map((product) => new ProductEntity(product));
    };

    public getAllProductsWithStock = async () => {
        const products = await this.prisma.product.findMany({
            where: {
                variants: {
                    some: {
                        stock: { gt: 0 },
                    },
                },
            },
            include: {
                variants: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        return products.map((product) => new ProductEntity(product));
    };
}
