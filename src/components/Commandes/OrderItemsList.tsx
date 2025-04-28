import { StyleSheet, Text, View } from 'react-native';
import { useAppContext } from '../../context/AppContext';
import { IBasket } from '../../server/checkout/IBasket';
import { numberFormat } from '../../service/NumberFormat';
import { colorUsages, common } from '../../theme';
import { AppImage } from '../Image';

export const OrderItemsList = ({ order }: { order: IBasket }) => {
    const { products } = useAppContext();

    const getProductInfo = (productId: string) => {
        return products.find((p) => p.id === productId);
    };

    return (
        <View style={styles.container}>
            {order.items.map((item, index) => {
                const product = getProductInfo(item.productId);
                return (
                    <View
                        key={index}
                        style={styles.itemContainer}
                    >
                        {product && (
                            <AppImage
                                source={product.imageUrl}
                                style={styles.productImage}
                                alt={item.name}
                            />
                        )}
                        <View style={styles.itemInfo}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemVariant}>
                                {product?.variants.find((v) => v.id === item.productVariantId)?.optionValue}
                            </Text>
                        </View>
                        <View style={styles.quantityPrice}>
                            <Text style={styles.quantity}>x{item.quantity}</Text>
                            <Text style={styles.price}>{numberFormat.toPrice(item.price * item.quantity)}</Text>
                        </View>
                    </View>
                );
            })}
            <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>{numberFormat.toPrice(order.total)}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 12,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 8,
        backgroundColor: colorUsages.white,
        borderRadius: 8,
    },
    productImage: {
        width: 50,
        height: 50,
        borderRadius: 4,
    },
    itemInfo: {
        flex: 1,
        gap: 4,
    },
    itemName: {
        ...common.text.text,
        fontSize: 14,
        fontWeight: '500',
    },
    itemVariant: {
        fontSize: 12,
    },
    quantityPrice: {
        alignItems: 'flex-end',
        gap: 4,
    },
    quantity: {
        fontSize: 12,
        color: colorUsages.lightInfo,
    },
    price: {
        ...common.text.h3Subtitle,
        fontSize: 14,
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colorUsages.borderColor,
        paddingTop: 12,
        marginTop: 8,
    },
    totalLabel: {
        ...common.text.h2Title,
        fontSize: 16,
    },
    totalAmount: {
        ...common.text.h2Title,
        fontSize: 18,
        color: colorUsages.primary,
    },
});
