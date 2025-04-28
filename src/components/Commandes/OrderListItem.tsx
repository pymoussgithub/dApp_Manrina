import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IBasket } from '../../server/checkout/IBasket';
import { numberFormat } from '../../service/NumberFormat';
import { colorUsages, common } from '../../theme';

interface OrderListItemProps {
    order: IBasket;
    index: number;
    isSelected: boolean;
    onSelect: (order: IBasket) => void;
}

export const OrderListItem = ({ order, index, isSelected, onSelect }: OrderListItemProps) => {
    const formattedDate = order.deliveryDay || '';

    return (
        <TouchableOpacity
            onPress={() => onSelect(order)}
            style={[styles.container, isSelected && styles.selectedContainer]}
        >
            <View style={styles.leftSection}>
                <Text style={styles.orderNumber}>#{index + 1}</Text>
                <StatusBadge status={order.paymentStatus} />
            </View>

            <View style={styles.mainSection}>
                {order.address && <Text style={styles.location}>📍 {order.address.city}</Text>}
                <Text style={styles.date}>📅 {formattedDate}</Text>
            </View>

            <Text style={styles.price}>{numberFormat.toPrice(order.total)}</Text>
        </TouchableOpacity>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const getStatusStyle = () => {
        switch (status) {
            case 'paid':
                return styles.statusPaid;
            case 'pending':
                return styles.statusPending;
            case 'cancelled':
                return styles.statusCancelled;
            default:
                return {};
        }
    };

    return (
        <View style={[styles.badge, getStatusStyle()]}>
            <Text style={styles.badgeText}>{status}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: colorUsages.borderColor,
        backgroundColor: colorUsages.white,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    selectedContainer: {
        backgroundColor: `${colorUsages.primary}10`,
        borderLeftWidth: 4,
        borderLeftColor: colorUsages.primary,
    },
    leftSection: {
        alignItems: 'center',
        gap: 4,
        width: 60,
    },
    mainSection: {
        flex: 1,
        gap: 4,
    },
    orderNumber: {
        ...common.text.h2Title,
        fontSize: 16,
    },
    price: {
        ...common.text.h2Title,
        color: colorUsages.primary,
        fontSize: 16,
    },
    location: {
        ...common.text.text,
        fontSize: 14,
    },
    date: {
        fontSize: 12,
        color: colorUsages.lightInfo,
    },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 12,
        minWidth: 50,
        alignItems: 'center',
    },
    statusPaid: {
        backgroundColor: '#4CAF50',
    },
    statusPending: {
        backgroundColor: '#FF9800',
    },
    statusCancelled: {
        backgroundColor: '#F44336',
    },
    badgeText: {
        color: colorUsages.white,
        fontSize: 10,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
});
