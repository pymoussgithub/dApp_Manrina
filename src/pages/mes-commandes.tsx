import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Header, HeaderTitle } from '../components/Header/Header';
import { BackButton } from '../components/products/BackButton';
import { useWallet } from '../contexts/WalletContext';
import { IBasket } from '../server/checkout/IBasket';
import { colorUsages, common, variables, palette } from '../theme';
import { AppButton } from '../components/button';
import { numberFormat } from '../service/NumberFormat';
import { AppImage } from '../components/Image';
import { useRouter } from 'next/router';
import { Args } from "@massalabs/massa-web3";
import { MassaStationWallet } from "@massalabs/wallet-provider";
import { CONTRACT_ADDRESS, getProducerName } from '../config/contracts';



interface Product {
    name: string;
    price: number;
    quantity: number;
}

interface ProducerPayment {
    amount: number;
    producerAddress: string;
    producerName?: string;
    products?: {
        name: string;
        quantity: number;
        price: number;
    }[];
}

interface OrderData {
    invoice: string;
    totalAmount: number;
    producerPayments: ProducerPayment[];
}

export default function MesCommandes() {
    const { isWalletConnected, currentWallet } = useWallet();
    const [orders, setOrders] = useState<IBasket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [expandedProducerId, setExpandedProducerId] = useState<string | null>(null);
    const [orderDataList, setOrderDataList] = useState<OrderData[]>([]);
    const router = useRouter();

    const toggleExpand = (orderId: string) => {
        setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
        setExpandedProducerId(null);
    };

    const toggleExpandProducer = (producerId: string) => {
        setExpandedProducerId(expandedProducerId === producerId ? null : producerId);
    };

    useEffect(() => {
        const fetchContractData = async () => {
            if (!isWalletConnected || !currentWallet) {
                setIsLoading(false);
                return;
            }

            try {
                const massaWallet = new MassaStationWallet();
                const accounts = await massaWallet.accounts();
                
                if (!accounts || accounts.length === 0) {
                    throw new Error('No accounts found in MassaStation');
                }

                const account = accounts.find((acc: { address: string }) => acc.address === currentWallet.address);
                if (!account) {
                    throw new Error('Selected account not found in MassaStation');
                }

                const args = new Args().addString(currentWallet.address);
                const response = await account.readSC({
                    target: CONTRACT_ADDRESS,
                    func: "getKey",
                    parameter: args.serialize(),
                });

                if (response && response.value) {
                    const decoder = new TextDecoder();
                    const value = decoder.decode(response.value);
                    
                    const matches = value.match(/fc\d+/g);
                    if (matches) {
                        const newOrderDataList: OrderData[] = [];
                        
                        for (const element of matches) {
                            try {
                                const elementArgs = new Args().addString(element);
                                const elementResponse = await account.readSC({
                                    target: CONTRACT_ADDRESS,
                                    func: "getKey",
                                    parameter: elementArgs.serialize(),
                                });
                                
                                if (elementResponse && elementResponse.value) {
                                    const elementValue = decoder.decode(elementResponse.value);
                                    const producerPayments = elementValue.split('-').map(payment => {
                                        const [amount, producerAddress] = payment.split('_');
                                        return {
                                            amount: parseFloat(amount),
                                            producerAddress,
                                            producerName: getProducerName(producerAddress)
                                        };
                                    });

                                    const totalAmount = producerPayments.reduce((sum, payment) => sum + payment.amount, 0);

                                    newOrderDataList.push({
                                        invoice: element,
                                        totalAmount,
                                        producerPayments
                                    });
                                }
                            } catch (error) {
                                console.error(`Erreur lors de la lecture de ${element}:`, error);
                            }
                        }
                        
                        setOrderDataList(newOrderDataList);
                    }
                }
            } catch (error) {
                console.error("Error reading from smart contract:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchContractData();
    }, [currentWallet, isWalletConnected]);

    if (!isWalletConnected) {
        return (
            <View style={{ height: '100vh' }}>
                <Header
                    backgroundStyle={{
                        backgroundColor: colorUsages.secondary,
                    }}
                    LeftSection={<BackButton color={colorUsages.white} href="/" />}
                    CentralSection={<HeaderTitle style={{ color: colorUsages.white }}>Mes Commandes</HeaderTitle>}
                />
                <View style={styles.container}>
                    <View style={styles.connectWalletMessage}>
                        <Text style={styles.title}>Connectez votre wallet</Text>
                        <Text style={styles.description}>
                            Pour voir vos commandes, vous devez d'abord connecter votre wallet Massa.
                        </Text>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={{ height: '100vh' }}>
            <Header
                backgroundStyle={{
                    backgroundColor: colorUsages.secondary,
                }}
                LeftSection={<BackButton color={colorUsages.white} href="/" />}
                CentralSection={<HeaderTitle style={{ color: colorUsages.white }}>Mes Commandes</HeaderTitle>}
            />
            <ScrollView style={styles.scrollView}>
                <View style={styles.container}>
                    {isLoading ? (
                        <ActivityIndicator size="large" color={colorUsages.primary} />
                    ) : !isWalletConnected ? (
                        <View style={styles.connectWalletMessage}>
                            <Text style={styles.title}>Connectez votre wallet</Text>
                            <Text style={styles.description}>
                                Pour voir vos commandes, vous devez d'abord connecter votre wallet Massa.
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.mainContainer}>
                            <View style={styles.contentWrapper}>
                                {orderDataList.length > 0 ? (
                                    <View style={styles.ordersGrid}>
                                        {orderDataList.map((order, index) => (
                                            <View key={index} style={styles.orderCard}>
                                                <TouchableOpacity 
                                                    style={[
                                                        styles.orderHeader,
                                                        expandedOrderId === order.invoice && styles.orderHeaderExpanded
                                                    ]}
                                                    onPress={() => toggleExpand(order.invoice)}
                                                >
                                                    <View style={styles.orderHeaderContent}>
                                                        <Text style={styles.orderTitle}>
                                                            Facture :{' '}
                                                            <Text style={styles.orderNumber}>
                                                                {order.invoice}
                                                            </Text>
                                                        </Text>
                                                        <View style={styles.orderAmountContainer}>
                                                            <Text style={styles.totalAmount}>
                                                                {numberFormat.toPrice(order.totalAmount)}
                                                            </Text>
                                                            <Text style={[
                                                                styles.expandIcon,
                                                                expandedOrderId === order.invoice && styles.expandIconRotated
                                                            ]}>
                                                                ▼
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                                {expandedOrderId === order.invoice && (
                                                    <View style={styles.producersList}>
                                                        {order.producerPayments.map((payment, index) => (
                                                            <View key={index} style={styles.producerPayment}>
                                                                <View style={styles.producerInfo}>
                                                                    <View style={styles.producerHeader}>
                                                                        <Text style={styles.producerName}>
                                                                            {payment.producerName}
                                                                        </Text>
                                                                        <Text style={styles.producerAddress} numberOfLines={1}>
                                                                            {payment.producerAddress}
                                                                        </Text>
                                                                    </View>
                                                                    <Text style={styles.paymentAmount}>
                                                                        Total : {numberFormat.toPrice(payment.amount)} massas
                                                                    </Text>
                                                                    
                                                                    <TouchableOpacity
                                                                        style={styles.productsButton}
                                                                        onPress={() => toggleExpandProducer(payment.producerAddress)}
                                                                    >
                                                                        <Text style={styles.productsButtonText}>
                                                                            Détail des produits achetés
                                                                        </Text>
                                                                        <Text style={styles.productsButtonText}>
                                                                            {expandedProducerId === payment.producerAddress ? '▼' : '▶'}
                                                                        </Text>
                                                                    </TouchableOpacity>
                                                                    
                                                                    {expandedProducerId === payment.producerAddress && (
                                                                        <View style={styles.productsList}>
                                                                            {[
                                                                                { name: "Ananas bio", quantity: 2, price: 6.00 },
                                                                                { name: "Avocat bio", quantity: 3, price: 3.50 },
                                                                                { name: "Citron caviar bio (100g)", quantity: 1, price: 28.60 }
                                                                            ].map((product, productIndex) => (
                                                                                <View key={productIndex} style={styles.productItem}>
                                                                                    <Text style={styles.productName}>
                                                                                        {product.name} (x{product.quantity})
                                                                                    </Text>
                                                                                    <Text style={styles.productPrice}>
                                                                                        {(product.price * product.quantity).toFixed(2)} MAS
                                                                                    </Text>
                                                                                </View>
                                                                            ))}
                                                                        </View>
                                                                    )}
                                                                </View>
                                                            </View>
                                                        ))}
                                                    </View>
                                                )}
                                            </View>
                                        ))}
                                    </View>
                                ) : (
                                    <View style={styles.emptyOrdersMessage}>
                                        <Text style={styles.title}>Aucune commande</Text>
                                        <Text style={styles.description}>
                                            Vous n'avez pas encore passé de commande. Découvrez nos produits !
                                        </Text>
                                        <AppButton
                                            label="Voir les produits"
                                            action={() => router.push('/')}
                                            btnStyle={{
                                                backgroundColor: colorUsages.secondary,
                                                marginTop: variables.spaceXL,
                                            }}
                                        />
                                    </View>
                                )}
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: variables.spaceXL,
        backgroundColor: colorUsages.background,
    },
    scrollView: {
        flex: 1,
    },
    connectWalletMessage: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: variables.spaceXL,
        gap: variables.space,
    },
    emptyOrdersMessage: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: variables.spaceXL,
        gap: variables.space,
    },
    title: {
        ...common.text.h2Title,
        color: colorUsages.secondary,
        textAlign: 'center',
    },
    description: {
        ...common.text.text,
        color: colorUsages.secondary,
        textAlign: 'center',
        maxWidth: 400,
    },
    mainContainer: {
        flex: 1,
        alignItems: 'center',
        width: '100%',
    },
    contentWrapper: {
        width: '100%',
        maxWidth: 1200,
        alignItems: 'center',
        padding: variables.spaceXL,
    },
    walletInfo: {
        alignItems: 'center',
        marginBottom: variables.spaceXL,
        width: '100%',
    },
    walletAddress: {
        ...common.text.text,
        fontSize: 14,
        color: colorUsages.secondary,
        opacity: 0.7,
    },
    ordersGrid: {
        display: 'flex',
        flexDirection: 'column',
        gap: variables.spaceXL,
        width: '100%',
        padding: variables.space,
        maxWidth: 800,
        alignSelf: 'center',
    },
    orderCard: {
        backgroundColor: colorUsages.white,
        borderRadius: variables.smallRadius,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: `${colorUsages.secondary}15`,
        width: '100%',
    },
    orderHeader: {
        borderBottomWidth: 0,
        cursor: 'pointer',
        padding: variables.space,
        minHeight: 80,
        display: 'flex',
        justifyContent: 'center',
    },
    orderHeaderExpanded: {
        borderBottomWidth: 1,
        borderBottomColor: `${colorUsages.secondary}15`,
        marginBottom: variables.space,
    },
    orderHeaderContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        backgroundColor: colorUsages.white,
        height: 56,
        paddingHorizontal: variables.space,
        borderRadius: variables.smallRadius,
    },
    orderTitle: {
        ...common.text.h2Title,
        color: colorUsages.secondary,
        fontSize: 20,
        lineHeight: 20,
        fontWeight: '600',
    },
    orderNumber: {
        fontWeight: '400',
        color: `${colorUsages.secondary}90`,
    },
    orderAmountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: variables.spaceXL,
        height: '100%',
    },
    totalAmount: {
        ...common.text.text,
        fontSize: 18,
        fontWeight: '800',
        color: palette.lightGreen,
        lineHeight: 18,
    },
    expandIcon: {
        fontSize: 16,
        color: colorUsages.primary,
        transform: [{ rotate: '0deg' }],
        transition: 'transform 0.3s ease',
        height: 16,
        lineHeight: 16,
        textAlign: 'center',
        position: 'relative',
        top: -1,
    },
    expandIconRotated: {
        transform: [{ rotate: '180deg' }],
    },
    producersList: {
        gap: variables.space,
        marginTop: variables.spaceXL,
        backgroundColor: colorUsages.white,
        padding: variables.space,
        borderRadius: variables.smallRadius,
    },
    producerPayment: {
        backgroundColor: `${colorUsages.secondary}08`,
        borderRadius: variables.middleRadius,
        borderWidth: 1,
        borderColor: `${colorUsages.secondary}20`,
        padding: variables.space,
        marginBottom: variables.space,
        boxShadow: `0 1px 3px ${colorUsages.secondary}15`,
    },
    producerInfo: {
        flex: 1,
    },
    producerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: variables.space,
    },
    producerName: {
        ...common.text.text,
        fontSize: 16,
        color: colorUsages.secondary,
        fontWeight: '600',
    },
    producerAddress: {
        ...common.text.text,
        fontSize: 13,
        color: `${colorUsages.secondary}80`,
        textAlign: 'right',
        flex: 1,
        marginLeft: variables.space,
    },
    paymentAmount: {
        ...common.text.text,
        fontSize: 13,
        color: palette.lightGreen,
        fontWeight: '600',
        textAlign: 'right',
        marginTop: variables.space,
    },
    productsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: variables.space,
        backgroundColor: colorUsages.white,
        borderRadius: variables.middleRadius,
        borderWidth: 1,
        borderColor: `${colorUsages.secondary}15`,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        width: '100%',
    },
    productsButtonText: {
        ...common.text.text,
        fontSize: 13,
        color: colorUsages.secondary,
        fontWeight: '500',
    },
    productsList: {
        marginTop: variables.space,
        padding: variables.space,
        backgroundColor: colorUsages.white,
        borderRadius: variables.middleRadius,
        gap: variables.space,
    },
    productItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productName: {
        ...common.text.text,
        fontSize: 13,
        color: colorUsages.secondary,
    },
    productPrice: {
        ...common.text.text,
        fontSize: 13,
        color: colorUsages.secondary,
        fontWeight: '500',
    },
}); 