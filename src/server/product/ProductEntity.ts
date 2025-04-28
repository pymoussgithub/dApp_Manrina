import { IProduct, IProductVariant } from './IProduct';

export class ProductEntity implements IProduct {
    id: string;
    category?: string;
    name: string;
    description?: string;
    imageUrl: string;
    wallet_address?: string;
    producer_name?: string;
    variants: IProductVariant[];

    constructor(product: IProduct) {
        this.id = product.id;
        this.category = product.category || undefined;
        this.name = product.name;
        this.description = product.description || undefined;
        this.imageUrl = product.imageUrl;
        this.wallet_address = product.wallet_address || undefined;
        this.producer_name = product.producer_name || undefined;
        this.variants = product.variants;
    }
}
