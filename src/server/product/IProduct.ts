export interface IProduct {
    id: string;
    category?: string | null;
    name: string;
    imageUrl: string;
    description?: string | null;
    wallet_address?: string | null;
    producer_name?: string | null;
    variants: IProductVariant[];
}
export type ProductDtoForCreation = {
    id?: string;
    category?: string;
    name: string;
    imageUrl: string;
    description?: string;
};
export type IProductVariant = {
    id: string;
    optionSet: string;
    optionValue: string;
    productId: string;
    description: string | null;
    imageUrl: string | null;
    price: number;
    stock: number;
};
