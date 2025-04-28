import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IProduct } from '../../server/product/IProduct';
import { numberFormat } from '../../service/NumberFormat';
import { colorUsages, common, variables } from '../../theme';
import { BasketElement } from '../../types/BasketElement';
import { AppImage } from '../Image';
import { productItemStyles } from './ProductItem';
import { VariantElement } from './VariantSelector';

export const BasketItem = ({
    element,
    decrementProductQuantity,
    addProductToBasket,
    canUpdate,
}: {
    element: BasketElement;
    decrementProductQuantity: (productId: string, variantId: string) => void;
    addProductToBasket: (product: IProduct, quantity: number, variantId: string) => void;
    canUpdate?: boolean;
}) => {
    const itemPrice = numberFormat.toPrice(element.quantity * element.price);
    return (
        <View
            style={productStyles.basketItemContainer}
            key={`${element.product.id}-${element.productVariant.id}`}
        >
            <AppImage
                source={element.product.imageUrl}
                style={productStyles.productImage}
                alt={element.name}
            />
            <View style={productStyles.productInfo}>
                <Text style={productStyles.productTitle}>{element.name}</Text>
                <View
                    style={{
                        flexDirection: 'row',
                        gap: 8,
                        alignItems: 'center',
                    }}
                >
                    <VariantElement
                        variant={element.productVariant}
                        selected
                    />
                    <Text style={productStyles.productPrice}>
                        {element.price} MAS l'unité
                    </Text>
                </View>
            </View>

            <View style={{ gap: 8, alignItems: 'flex-end' }}>
                <Text style={productItemStyles.price}>{itemPrice}</Text>
                {canUpdate ? (
                    <UpdateQuantityButtons
                        increment={() => {
                            addProductToBasket(element.product, 1, element.productVariant.id);
                        }}
                        decrement={() => {
                            decrementProductQuantity(element.product.id, element.productVariant.id);
                        }}
                        quantity={element.quantity}
                    />
                ) : (
                    <Text style={productStyles.quantityViewTextOnly}>x{element.quantity}</Text>
                )}
            </View>

            {/* <TouchableOpacity
                onPress={() => {
                    removeProductFromBasket(
                        element.product.id,
                        element.productVariant.id
                    );
                }}
            >
                <Text style={productStyles.deleteIcon}>X</Text>
            </TouchableOpacity> */}
        </View>
    );
};

export const UpdateQuantityButtons = ({
    increment,
    decrement,
    quantity,
    disabled,
}: {
    increment: () => void;
    decrement: () => void;
    quantity: number;
    disabled?: boolean;
}) => {
    return (
        <View style={productStyles.quantityControl}>
            <TouchableOpacity
                style={[productStyles.quantityButton, productStyles.quantityButtonLeft]}
                onPress={decrement}
                disabled={disabled}
            >
                <Text style={productStyles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={productStyles.quantityText}>{quantity}</Text>
            <TouchableOpacity
                style={[productStyles.quantityButton, productStyles.quantityButtonRight]}
                onPress={increment}
                disabled={disabled}
            >
                <Text style={productStyles.quantityButtonText}>+</Text>
            </TouchableOpacity>
        </View>
    );
};

export const unitPriceStyle = {
    ...common.text.h5Infos,
    lineHeight: 12,
};
const productStyles = StyleSheet.create({
    basketItemContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: colorUsages.borderColor,
        paddingVertical: variables.spaceXL,
        gap: variables.space,
    },
    productImage: {
        width: 70,
        height: 70,
        borderRadius: 5,
    },
    productInfo: {
        flex: 2,
    },
    productTitle: {
        ...common.text.h2Title,
    },
    productPrice: unitPriceStyle,
    quantityControl: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quantityButton: {
        backgroundColor: colorUsages.primary,
        padding: 5,
    },
    quantityButtonLeft: {
        borderTopStartRadius: 4,
        borderBottomStartRadius: 4,
    },
    quantityButtonRight: {
        borderTopEndRadius: 4,
        borderBottomEndRadius: 4,
    },
    quantityButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        lineHeight: 16,
        color: colorUsages.white,
    },
    quantityText: {
        marginHorizontal: 10,
        fontSize: 14,
    },
    productTotal: {
        flex: 1,
        textAlign: 'center',
        fontSize: 14,
    },
    deleteIcon: {
        fontSize: 18,
        color: '#888',
    },
    quantityViewTextOnly: {
        ...common.text.h2Title,
        fontSize: 20,
        color: colorUsages.lightInfo,
    },
});
