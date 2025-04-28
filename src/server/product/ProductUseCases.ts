import deliveryMethods from '../../mock/deliveryMethods.json';
import { DeliveryMethodsData } from '../../types/DeliveryMethodsType';
import { IProduct } from './IProduct';
import { ProductEntity } from './ProductEntity';
import { ProductRepository } from './ProductRepository';

export class ProductUseCases {
    constructor(private productRepository: ProductRepository) {}

    public createProducts = (products: IProduct[]) => {
        const allProducts = Promise.all(
            products.map((product) => this.productRepository.createProduct(new ProductEntity(product))),
        );
        return allProducts;
    };

    public getAllProductsWithStock = () => {
        return this.productRepository.getAllProductsWithStock();
    };

    public getAllProducts = this.productRepository.getAllProducts;

    public getDeliveryMethods = () => {
        return deliveryMethods as DeliveryMethodsData;
    };
}
