import { useLocalStorage } from 'react-use';
import { IProduct } from '../server/product/IProduct';
import { BasketElement } from '../types/BasketElement';

export type BasketStorage = BasketElement[];

const BASKET_STORAGE_KEY = '__basket__';

export const useBasketStorage = () => {
    const [_basketStorage, updateBasketStorage] = useLocalStorage<BasketStorage>(BASKET_STORAGE_KEY, []);
    const basketStorage = _basketStorage || [];

    const addProductToBasket = (product: IProduct, quantity: number, variantId?: string) => {
        // Default to first variant if none specified
        const variant = variantId ? product.variants.find((v) => v.id === variantId) : product.variants[0];

        if (!variant) {
            console.error('No variant found for product', product);
            return;
        }

        const name = `${product.name} ${variant.optionSet} ${variant.optionValue}`.trim();

        const existingProduct = basketStorage.find(
            (element) => element.product.id === product.id && element.productVariant.id === variant.id,
        );

        if (existingProduct) {
            existingProduct.quantity += quantity;
            updateBasketStorage([...basketStorage]);
        } else {
            updateBasketStorage([
                ...basketStorage,
                {
                    product,
                    productVariant: variant,
                    quantity,
                    name,
                    price: variant.price,
                },
            ]);
        }
    };

    const removeProductFromBasket = (productId: string, variantId: string) => {
        const updatedBasket = basketStorage.filter(
            (basketItem) => !(basketItem.product.id === productId && basketItem.productVariant.id === variantId),
        );
        updateBasketStorage(updatedBasket);
    };

    const decrementProductQuantity = (productId: string, variantId: string) => {
        const updatedBasket = basketStorage
            .map((basketItem) => {
                if (basketItem.product.id === productId && basketItem.productVariant.id === variantId) {
                    return {
                        ...basketItem,
                        quantity: basketItem.quantity > 1 ? basketItem.quantity - 1 : 0,
                    };
                }
                return basketItem;
            })
            .filter((basketItem) => basketItem.quantity > 0);

        updateBasketStorage(updatedBasket);
    };

    const resetBasketStorage = () => {
        updateBasketStorage([]);
    };

    const totalProducts = basketStorage.reduce((total, basketElement) => {
        total += basketElement.quantity;
        return total;
    }, 0);

    return {
        basketStorage,
        totalProducts,
        addProductToBasket,
        removeProductFromBasket,
        decrementProductQuantity,
        resetBasketStorage,
    };
};
