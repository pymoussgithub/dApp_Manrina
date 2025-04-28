import { StyleSheet, Text, View } from 'react-native';
import { IBasket } from '../../server/checkout/IBasket';
import { colorUsages, common } from '../../theme';
import { OrderItemsList } from './OrderItemsList';

interface OrderDetailsProps {
    order: IBasket;
}

export const OrderDetails = ({ order }: OrderDetailsProps) => {
    if (!order) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Détails de la commande</Text>
                    <Text style={styles.subtitle}>ID: {order.id}</Text>
                </View>
                <Text style={styles.status}>{order.paymentStatus.toUpperCase()}</Text>
            </View>

            <View style={styles.infoGrid}>
                <InfoCard
                    title="Livraison"
                    icon="📍"
                    content={
                        order.address && (
                            <>
                                <Text style={styles.text}>{order.address.name}</Text>
                                <Text style={styles.text}>{order.address.address}</Text>
                                <Text style={styles.text}>
                                    {order.address.city}, {order.address.postalCode}
                                </Text>
                            </>
                        )
                    }
                />

                <InfoCard
                    title="Date"
                    icon="📅"
                    content={<Text style={styles.text}>{order.deliveryDay || ''}</Text>}
                />

                <InfoCard
                    title="Statut"
                    icon="📦"
                    content={
                        <>
                            {order.delivered && <Text style={styles.text}>Livré: {order.delivered}</Text>}
                            {order.retrieved && <Text style={styles.text}>Récupéré: {order.retrieved}</Text>}
                        </>
                    }
                />
            </View>

            <Section title="Articles commandés">
                <OrderItemsList order={order} />
            </Section>
        </View>
    );
};

const InfoCard = ({ title, icon, content }: { title: string; icon: string; content: React.ReactNode }) => (
    <View style={styles.infoCard}>
        <View style={styles.infoCardHeader}>
            <Text style={styles.infoCardIcon}>{icon}</Text>
            <Text style={styles.infoCardTitle}>{title}</Text>
        </View>
        <View style={styles.infoCardContent}>{content}</View>
    </View>
);

const Section = ({ title, children }: React.PropsWithChildren<{ title: string }>) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {children}
    </View>
);

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: colorUsages.white,
        height: '100%',
        overflow: 'auto',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    title: {
        ...common.text.h2Title,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 12,
        color: colorUsages.lightInfo,
    },
    status: {
        ...common.text.h2Title,
        fontSize: 14,
        color: colorUsages.primary,
    },
    infoGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
        flexWrap: 'wrap',
    },
    infoCard: {
        flex: 1,
        minWidth: 200,
        backgroundColor: `${colorUsages.primary}05`,
        borderRadius: 8,
        padding: 12,
    },
    infoCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    infoCardIcon: {
        fontSize: 16,
    },
    infoCardTitle: {
        ...common.text.h2Title,
        fontSize: 14,
    },
    infoCardContent: {
        gap: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        ...common.text.h2Title,
        fontSize: 16,
        marginBottom: 16,
    },
    text: {
        ...common.text.text,
        fontSize: 13,
    },
});
