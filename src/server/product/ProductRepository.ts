import { ProductEntity } from './ProductEntity';

export interface ProductRepository {
    createProduct: (productDto: ProductEntity) => Promise<ProductEntity>;
    getAllProducts: () => Promise<ProductEntity[]>;
    getAllProductsWithStock: () => Promise<ProductEntity[]>;
}
