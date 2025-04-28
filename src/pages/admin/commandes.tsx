import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { withAdminAuth } from '../../components/admin/withAdminAuth';
import { OrderDetails } from '../../components/Commandes/OrderDetails';
import { OrderListItem } from '../../components/Commandes/OrderListItem';
import { PageContainer } from '../../components/products/PageContainer';
import { IBasket } from '../../server/checkout/IBasket';
import { backendFetchService } from '../../service/BackendFetchService';
import { colorUsages } from '../../theme';

function Commandes() {
    const [selectedOrder, setSelectedOrder] = useState<IBasket | null>(null);

    const commandsQuery = useQuery({
        queryKey: ['commands'],
        queryFn: () => backendFetchService.getBasketSessions(),
    });

    if (commandsQuery.isLoading) {
        return <ActivityIndicator />;
    }

    return (
        <PageContainer
            header={{
                CentralSection: <Text>Commandes</Text>,
                hideBasket: true,
            }}
        >
            <View style={styles.container}>
                <View style={styles.ordersList}>
                    {(commandsQuery.data || []).map((order, index) => (
                        <OrderListItem
                            key={order.id}
                            order={order}
                            index={index}
                            isSelected={selectedOrder?.id === order.id}
                            onSelect={setSelectedOrder}
                        />
                    ))}
                </View>

                <View style={styles.orderDetails}>
                    {selectedOrder ? (
                        <OrderDetails order={selectedOrder} />
                    ) : (
                        <View style={styles.noSelection}>
                            <Text>Sélectionnez une commande pour voir les détails</Text>
                        </View>
                    )}
                </View>
            </View>
        </PageContainer>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        height: '100%',
    },
    ordersList: {
        width: '40%',
        borderRightWidth: 1,
        borderRightColor: colorUsages.borderColor,
        overflow: 'auto',
    },
    orderDetails: {
        flex: 1,
    },
    noSelection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default withAdminAuth(Commandes);
