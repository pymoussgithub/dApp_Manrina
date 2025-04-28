import { useMutation } from '@tanstack/react-query';
import { PropsWithChildren, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { getWallets, WalletName, MassaStationWallet } from "@massalabs/wallet-provider";
import {
  Args,
  Provider,
  OperationStatus,
} from "@massalabs/massa-web3";
import { AppButton } from '../components/button';
import { useAppContext } from '../context/AppContext';
import { useWallet } from '../contexts/WalletContext';
import { anonymizeCheckoutSession, ICheckoutCreatePayload } from '../server/payment/CheckoutSession';
import { backendFetchService } from '../service/BackendFetchService';
import { checkoutSessionService } from '../service/CheckoutSessionService';
import { numberFormat } from '../service/NumberFormat';
import { colorUsages, common, palette, variables } from '../theme';
import { DeliveryMethod } from '../types/DeliveryMethodsType';
import { BasketContentFromAppContext } from './BasketContent';
import { ContactInfo } from './ContactInfo';
import { DeliveryPageContainer } from './DeliveryPageContainer';
import { getTotalPriceWithDelivery } from './getTotalPrice';
import { useRouter } from 'next/router';
const Buffer = require('buffer').Buffer;

declare global {
    interface Window {
        massa?: any;
    }
}

export const SummaryPage = ({
    category,
    deliveryMethod,
    contactData,
    dayChosen,
}: {
    category: string;
    deliveryMethod: DeliveryMethod;
    contactData: ContactInfo;
    dayChosen: string;
}) => {
    const { basketStorage, resetBasketStorage } = useAppContext();
    const { isWalletConnected, currentWallet } = useWallet();
    const { totalPrice } = getTotalPriceWithDelivery(basketStorage, deliveryMethod);
    const formatedTotal = numberFormat.toPrice(totalPrice);
    const [isLoadingMassaPayment, setIsLoadingMassaPayment] = useState(false);
    const [showInsufficientBalanceMessage, setShowInsufficientBalanceMessage] = useState(false);
    const [showTransactionStatus, setShowTransactionStatus] = useState(false);
    const [showEventMessage, setShowEventMessage] = useState(false);
    const [eventMessage, setEventMessage] = useState('');
    const [transactionId, setTransactionId] = useState<string | null>(null);
    const [expandedPaymentDetails, setExpandedPaymentDetails] = useState(false);
    const [expandedTransactionDetails, setExpandedTransactionDetails] = useState(false);
    const [isTransactionSuccessful, setIsTransactionSuccessful] = useState(false);
    const [finalEvents, setFinalEvents] = useState<any[]>([]);
    const router = useRouter();

    type TransactionStatus = 'pending' | 'loading' | 'success' | 'error' | 'warning';
    interface TransactionStep {
        status: TransactionStatus;
        message: string;
        payments?: Payment[];
    }

    interface Payment {
        producerName: string;
        address: string;
        amount: string;
    }

    type TransactionSteps = {
        submitted: TransactionStep;
        speculative: TransactionStep;
        final: TransactionStep;
    };

    const [transactionSteps, setTransactionSteps] = useState<TransactionSteps>({
        submitted: { status: 'pending', message: '' },
        speculative: { status: 'pending', message: '' },
        final: { status: 'pending', message: '' }
    });

    const CONTRACT_ADDRESS = "AS18MUXDRKk43sQYDPxa3XBH8uhtS19eW9hyCNEprQ4ZA9Fy5s92";
    const producer_addresses: string[] = ['AU12ayLauvK9gzZKnJdh5JrSGDK5PZo2jLzEjk6bDMmqEvMc6cehQ', 'AU1vqiMSrNCzWAoKcQfGBXciJZmQiuXtQbR2VuhVKcVn6JdWsFHA', 'AU197qguMdoKkKtd4GeMUCngf97Jr6QzS8HZQUJJY66nmJqs2iVv'];

    const getSmartContractEvents = async (account: any) => {
        try {
            console.log("Fetching smart contract events...");
            const events = await account.getEvents({
                smartContractAddress: CONTRACT_ADDRESS,
            });

            if (events && events.length > 0) {
                console.log("Smart contract events:");
                events.forEach((event: any, index: number) => {
                    console.log(`Event ${index + 1}:`, {
                        data: event.data,
                        context: {
                            slot: event.context?.slot,
                            block: event.context?.block,
                            timestamp: new Date(event.context?.timestamp || 0).toLocaleString(),
                        }
                    });
                });
            } else {
                console.log("No events found for the smart contract");
            }
            return events;
        } catch (error) {
            console.error("Error fetching events:", error);
            return [];
        }
    };

    const getStatusColor = (status: TransactionStatus) => {
        switch (status) {
            case 'pending':
                return palette.darkgrey;
            case 'loading':
                return '#3498db';
            case 'success':
                return '#2ecc71';
            case 'error':
                return '#e74c3c';
            case 'warning':
                return '#f1c40f';
            default:
                return palette.darkgrey;
        }
    };

    const resetPaymentState = () => {
        setIsLoadingMassaPayment(false);
        setShowTransactionStatus(false);
        setTransactionId(null);
        setTransactionSteps({
            submitted: { status: 'pending', message: '' },
            speculative: { status: 'pending', message: '' },
            final: { status: 'pending', message: '' }
        });
    };

    const handleCloseTransaction = () => {
        if (transactionSteps.final.status !== 'success') {
            resetPaymentState();
        }
        setShowTransactionStatus(false);
    };

    const handleMassaPayment = async () => {
        if (!isWalletConnected || !currentWallet) {
            Alert.alert('Error', 'Please connect your Massa wallet first');
            return;
        }

        try {
            setIsLoadingMassaPayment(true);
            setShowTransactionStatus(true);
            setTransactionSteps({
                submitted: { status: 'loading', message: 'Veuillez signer la transaction via MassaStation...' },
                speculative: { status: 'pending', message: '' },
                final: { status: 'pending', message: '' }
            });

            console.log("Starting Massa payment with wallet:", currentWallet.address);
            
            interface ProductSummary {
                name: string;
                quantity: number;
                price: number;
            }

            interface ProducerSummary {
                products: ProductSummary[];
                totalMassa: number;
                walletAddress: string;
            }

            const producerSummary = new Map<string, ProducerSummary>();
            
            basketStorage.forEach((item) => {
                const producerName = item.product.producer_name || 'Non spécifié';
                if (!producerSummary.has(producerName)) {
                    producerSummary.set(producerName, {
                        products: [],
                        totalMassa: 0,
                        walletAddress: item.product.wallet_address || producer_addresses[0]
                    });
                }
                
                const summary = producerSummary.get(producerName);
                if (summary) {
                    summary.products.push({
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price
                    });
                    summary.totalMassa += item.quantity * item.price;
                }
            });

            // Log du résumé par producteur
            console.log("\nRésumé par producteur:");
            producerSummary.forEach((summary, producerName) => {
                console.log(`\nProducteur: ${producerName}`);
                console.log(`Wallet: ${summary.walletAddress}`);
                console.log("Produits:");
                summary.products.forEach(product => {
                    console.log(`- ${product.name} (x${product.quantity}) : ${product.price} MAS`);
                });
                console.log(`Total à payer: ${summary.totalMassa} MAS`);
                console.log("---");
            });
            
            // Construire la chaîne de paramètres pour chaque producteur
            let paramString = "";
            const producerEntries = Array.from(producerSummary.values());
            
            console.log("\nParamètres du smart contract:");
            for (let i = 0; i < producerEntries.length; i++) {
                const summary = producerEntries[i];
                const joined = `${summary.walletAddress}_${summary.totalMassa}`;
                paramString += i === 0 ? joined : `-${joined}`;
                console.log(`Producteur ${i + 1}: ${joined}`);
            }
            console.log("Chaîne finale:", paramString);

            let args = new Args().addString(paramString);
            const amount_to_pay = producerEntries.reduce((acc, summary) => acc + summary.totalMassa, 0) + 1;

            // Vérifier si le solde est suffisant
            if (currentWallet.balance < amount_to_pay) {
                setShowInsufficientBalanceMessage(true);
                setShowTransactionStatus(false);
                return;
            }
            
            // Initialize MassaStation wallet
            const massaWallet = new MassaStationWallet();
            const accounts = await massaWallet.accounts();
            
            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found in MassaStation');
            }

            const account = accounts.find(acc => acc.address === currentWallet.address);
            if (!account) {
                throw new Error('Selected account not found in MassaStation');
            }

            const op = await account.callSC({
                parameter: args.serialize(),
                func: "paiement",
                target: CONTRACT_ADDRESS,
                maxGas: BigInt(21000000),
                coins: BigInt(Math.round(amount_to_pay * 1000000000)),
            });

            setTransactionId(op.id);
            setTransactionSteps(prev => ({
                ...prev,
                submitted: { 
                    status: 'success',
                    message: 'Transaction soumise avec succès'
                },
                speculative: { status: 'loading', message: 'Vérification de l\'exécution spéculative...' }
            }));

            // Attendre et vérifier le statut spéculatif
            const speculativeStatus = await op.waitSpeculativeExecution();
            console.log("Speculative status:", speculativeStatus);

            if (speculativeStatus === OperationStatus.SpeculativeSuccess) {
                const speculativeEvents = await op.getSpeculativeEvents();
                setTransactionSteps(prev => ({
                    ...prev,
                    speculative: { 
                        status: 'success',
                        message: 'Exécution spéculative réussie!'
                    },
                    final: { status: 'loading', message: 'Attente de la confirmation finale...' }
                }));
            } else {
                setTransactionSteps(prev => ({
                    ...prev,
                    speculative: { 
                        status: 'warning',
                        message: `Status: ${speculativeStatus}`
                    },
                    final: { status: 'loading', message: 'Attente de la confirmation finale...' }
                }));
            }

            // Attendre et vérifier le statut final
            const finalStatus = await op.waitFinalExecution();
            console.log("Final status:", finalStatus);

            if (finalStatus === OperationStatus.Success) {
                const finalEvents = await op.getFinalEvents();
                setFinalEvents(finalEvents);
                console.log("Final events:", finalEvents);

                // Formater les paiements pour l'affichage
                let formattedPayments: Payment[] = [];
                const contractEvent = finalEvents?.[finalEvents.length - 1];
                if (contractEvent?.data) {
                    try {
                        console.log("Last event data:", contractEvent.data);
                        // 1. Split avec le séparateur "-"
                        const payments = contractEvent.data.split('-');
                        
                        // 2 & 3. Traiter chaque paiement et récupérer les infos producteur
                        formattedPayments = payments
                            .filter(payment => payment.trim()) // Enlever les chaînes vides
                            .map(payment => {
                                // 2. Split avec le séparateur "_"
                                const [amount, address] = payment.trim().split('_');
                                
                                // 3. Retrouver le nom du producteur en comparant l'adresse
                                const producerEntry = Array.from(producerSummary.entries())
                                    .find(([_, summary]) => summary.walletAddress === address);                            
                                
                                return {
                                    producerName: producerEntry ? producerEntry[0] : 'Producteur',
                                    address: address,
                                    amount: amount
                                };
                            });
                            
                        console.log("Formatted payments:", formattedPayments);
                    } catch (error) {
                        console.error("Error formatting payments:", error);
                    }
                }

                setTransactionSteps(prev => ({
                    ...prev,
                    final: { 
                        status: 'success',
                        message: 'Transaction confirmée avec succès!',
                        payments: formattedPayments
                    }
                }));
                setIsTransactionSuccessful(true);
                // Vider le panier
                resetBasketStorage();
            } else {
                setTransactionSteps(prev => ({
                    ...prev,
                    final: { 
                        status: 'error',
                        message: `Échec de la transaction. Status: ${finalStatus}`
                    }
                }));
            }

        } catch (error) {
            console.error("Payment error:", error);
            setTransactionSteps(prev => ({
                ...prev,
                final: { 
                    status: 'error',
                    message: error instanceof Error ? error.message : 'Une erreur inconnue est survenue'
                }
            }));
        } finally {
            setIsLoadingMassaPayment(false);
        }
    };

    const createCheckoutSessionMutation = useMutation({
        mutationFn: (checkoutCreatePayload: ICheckoutCreatePayload) => {
            const checkoutStatusUrl = `${window.location.origin}/checkout_over`;
            return backendFetchService.createCheckoutSession(checkoutCreatePayload, checkoutStatusUrl);
        },
        onSuccess: (data, checkoutSession) => {
            const { basketId, checkoutSessionId, paymentUrl } = data;
            checkoutSessionService.saveCheckoutSession(
                anonymizeCheckoutSession({ id: checkoutSessionId, ...checkoutSession }),
            );
        },
        onError: (error) => {
            Alert.alert('Error', error.message);
        },
    });
    const hasPaymentUrl = createCheckoutSessionMutation.data?.paymentUrl;

    const renderInsufficientBalanceMessage = () => {
        if (!showInsufficientBalanceMessage) return null;

        return (
            <View style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999,
            }}>
                <View style={{
                    backgroundColor: palette.white,
                    padding: 24,
                    borderRadius: 12,
                    maxWidth: 400,
                    width: '90%',
                    alignItems: 'center',
                    gap: 16,
                }}>
                    <Text style={{
                        color: palette.secondary,
                        fontSize: 20,
                        fontWeight: '600',
                        textAlign: 'center',
                        fontFamily: 'Fredoka',
                    }}>
                        Solde insuffisant
                    </Text>
                    <Text style={{
                        color: palette.secondary,
                        fontSize: 16,
                        textAlign: 'center',
                        fontFamily: 'Fredoka',
                        opacity: 0.8,
                        lineHeight: 24,
                    }}>
                        Le solde de votre wallet ({currentWallet?.balance} MAS) est insuffisant pour effectuer ce paiement ({totalPrice + 1} MAS).
                    </Text>
                    <AppButton
                        label="Fermer"
                        action={() => setShowInsufficientBalanceMessage(false)}
                        btnStyle={{
                            backgroundColor: palette.secondary,
                            paddingHorizontal: 24,
                            paddingVertical: 12,
                        }}
                    />
                </View>
            </View>
        );
    };

    const renderEventMessage = () => {
        if (!showEventMessage) return null;

        return (
            <View style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 10000,
            }}>
                <View style={{
                    backgroundColor: palette.white,
                    padding: 24,
                    borderRadius: 12,
                    maxWidth: 500,
                    width: '90%',
                    alignItems: 'center',
                    gap: 24,
                }}>
                    <Text style={{
                        color: palette.secondary,
                        fontSize: 24,
                        fontWeight: '600',
                        textAlign: 'center',
                        fontFamily: 'Fredoka',
                    }}>
                        Résultat de la Transaction
                    </Text>

                    <View style={{
                        backgroundColor: `${palette.secondary}15`,
                        padding: 16,
                        borderRadius: 8,
                        width: '100%',
                    }}>
                        <Text style={{
                            color: palette.secondary,
                            fontSize: 16,
                            fontFamily: 'Fredoka',
                            textAlign: 'center',
                            lineHeight: 24,
                        }}>
                            {eventMessage}
                        </Text>
                    </View>

                    <AppButton
                        label="Fermer"
                        action={() => setShowEventMessage(false)}
                        btnStyle={{
                            backgroundColor: palette.secondary,
                            paddingHorizontal: 24,
                            paddingVertical: 12,
                        }}
                    />
                </View>
            </View>
        );
    };

    const renderTransactionStatus = () => {
        if (!showTransactionStatus) return null;

        const explorerUrl = transactionId ? 
            `https://explorer.massa.net/mainnet/operation/${transactionId}` : null;

        // Fonction pour formater le message avec des retours à la ligne
        const formatMessage = (message: string) => {
            return message.split('\n').map((line, index) => (
                <Text
                    key={index}
                    style={{
                        color: palette.darkgrey,
                        fontSize: 14,
                        fontFamily: 'Fredoka',
                        textAlign: 'left',
                    }}
                >
                    {line}
                </Text>
            ));
        };

        // Fonction pour copier l'ID de la transaction
        const copyTransactionId = () => {
            if (transactionId) {
                navigator.clipboard.writeText(transactionId);
                // Optionnel : Ajouter un retour visuel temporaire
                const button = document.getElementById('copyButton');
                if (button) {
                    const originalText = button.innerText;
                    button.innerText = '✓';
                    setTimeout(() => {
                        button.innerText = originalText;
                    }, 1000);
                }
            }
        };

        return (
            <View style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999,
            }}>
                <View style={{
                    backgroundColor: palette.white,
                    padding: 24,
                    borderRadius: 12,
                    maxWidth: 500,
                    width: '90%',
                    alignItems: 'center',
                    gap: 24,
                    position: 'relative',
                }}>
                    {/* Bouton de fermeture */}
                    <TouchableOpacity
                        onPress={handleCloseTransaction}
                        style={{
                            position: 'absolute',
                            right: 16,
                            top: 16,
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: `${palette.secondary}15`,
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 1,
                        }}
                    >
                        <Text style={{
                            color: palette.secondary,
                            fontSize: 18,
                            fontWeight: '500',
                        }}>
                            ✕
                        </Text>
                    </TouchableOpacity>

                    <Text style={{
                        color: palette.secondary,
                        fontSize: 24,
                        fontWeight: '600',
                        textAlign: 'center',
                        fontFamily: 'Fredoka',
                        marginBottom: 8,
                        marginTop: 8,
                    }}>
                        {transactionSteps.final.status === 'success' ? (
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 16,
                            }}>
                                <View style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    backgroundColor: `${palette.secondary}15`,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}>
                                    <Text style={{ fontSize: 20 }}>✅</Text>
                                </View>
                                <Text style={{
                                    color: palette.secondary,
                                    fontSize: 24,
                                    fontWeight: '600',
                                    fontFamily: 'Fredoka',
                                }}>Commande effectuée!</Text>
                            </View>
                        ) : (
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 16,
                            }}>
                                <View style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    backgroundColor: `${palette.secondary}15`,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}>
                                    <Text style={{ fontSize: 20 }}>⌛</Text>
                                </View>
                                <Text style={{
                                    color: palette.secondary,
                                    fontSize: 24,
                                    fontWeight: '600',
                                    fontFamily: 'Fredoka',
                                }}>
                                    {transactionSteps.speculative.status === 'success' || 
                                     transactionSteps.speculative.status === 'loading' 
                                        ? "Vérification en cours..."
                                        : "Signature de la transaction"}
                                </Text>
                            </View>
                        )}
                    </Text>

                    {transactionId && (
                        <View style={{ marginTop: 8, width: '100%' }}>
                            <TouchableOpacity
                                onPress={() => setExpandedTransactionDetails(!expandedTransactionDetails)}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 8,
                                    paddingVertical: 4,
                                    justifyContent: 'center',
                                }}
                            >
                                <Text style={{
                                    color: palette.secondary,
                                    fontSize: 14,
                                    fontFamily: 'Fredoka',
                                    textDecorationLine: 'underline',
                                }}>
                                    Détails de la transaction
                                </Text>
                                <Text style={{
                                    fontSize: 12,
                                    transform: [{ rotate: expandedTransactionDetails ? '180deg' : '0deg' }],
                                }}>
                                    ▼
                                </Text>
                            </TouchableOpacity>
                            {expandedTransactionDetails && (
                                <View style={{
                                    marginTop: 8,
                                    paddingLeft: 8,
                                    borderLeftWidth: 2,
                                    borderLeftColor: `${palette.secondary}30`,
                                }}>
                                    <View style={{
                                        backgroundColor: `${palette.secondary}08`,
                                        padding: 16,
                                        borderRadius: 12,
                                        width: '100%',
                                        gap: 16,
                                    }}>
                                        <View style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 8,
                                            backgroundColor: palette.white,
                                            padding: 12,
                                            borderRadius: 8,
                                        }}>
                                            <Text style={{
                                                color: palette.darkgrey,
                                                fontSize: 14,
                                                fontFamily: 'Fredoka',
                                                flex: 1,
                                                overflow: 'hidden',
                                            }} numberOfLines={1} ellipsizeMode="middle">
                                                ID Transaction : {transactionId}
                                            </Text>
                                            <TouchableOpacity
                                                id="copyButton"
                                                onPress={copyTransactionId}
                                                style={{
                                                    backgroundColor: `${palette.secondary}15`,
                                                    padding: 8,
                                                    borderRadius: 6,
                                                    width: 32,
                                                    height: 32,
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <Text style={{ fontSize: 14 }}>📋</Text>
                                            </TouchableOpacity>
                                        </View>
                                        
                                        {explorerUrl && (
                                            <TouchableOpacity 
                                                onPress={() => window.open(explorerUrl, '_blank')}
                                                style={{
                                                    backgroundColor: palette.white,
                                                    padding: 12,
                                                    borderRadius: 8,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: 8,
                                                }}
                                            >
                                                <Text style={{
                                                    color: palette.secondary,
                                                    fontSize: 14,
                                                    fontFamily: 'Fredoka',
                                                }}>
                                                    Voir sur l'explorateur Massa
                                                </Text>
                                                <Text style={{ fontSize: 14 }}>↗️</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Étapes de la transaction */}
                    <View style={{ width: '100%', gap: 16 }}>
                        {/* Soumission */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={{
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                backgroundColor: getStatusColor(transactionSteps.submitted.status),
                                opacity: transactionSteps.submitted.status === 'pending' ? 0.5 : 1,
                            }} />
                            <View style={{ flex: 1 }}>
                                <Text style={{
                                    color: palette.secondary,
                                    fontSize: 16,
                                    fontWeight: '500',
                                    fontFamily: 'Fredoka',
                                }}>
                                    Soumission de la Transaction
                                </Text>
                                {transactionSteps.submitted.message && (
                                    <View style={{ gap: 4, paddingLeft: 8, marginTop: 4 }}>
                                        {formatMessage(transactionSteps.submitted.message)}
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Exécution spéculative */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={{
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                backgroundColor: getStatusColor(transactionSteps.speculative.status),
                                opacity: transactionSteps.speculative.status === 'pending' ? 0.5 : 1,
                            }} />
                            <View style={{ flex: 1 }}>
                                <Text style={{
                                    color: palette.secondary,
                                    fontSize: 16,
                                    fontWeight: '500',
                                    fontFamily: 'Fredoka',
                                }}>
                                    Simulation sur la blockchain Massa
                                </Text>
                                {transactionSteps.speculative.message && (
                                    <View style={{ gap: 4, paddingLeft: 8, marginTop: 4 }}>
                                        {formatMessage(transactionSteps.speculative.status === 'success' 
                                            ? 'Simulation réussie!' 
                                            : transactionSteps.speculative.message)}
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Exécution finale */}
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                            <View style={{
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                backgroundColor: getStatusColor(transactionSteps.final.status),
                                opacity: transactionSteps.final.status === 'pending' ? 0.5 : 1,
                                marginTop: 2,
                            }} />
                            <View style={{ flex: 1 }}>
                                <Text style={{
                                    color: palette.secondary,
                                    fontSize: 16,
                                    fontWeight: '500',
                                    fontFamily: 'Fredoka',
                                }}>
                                    Exécution Finale
                                </Text>
                                {transactionSteps.final.message && (
                                    <View style={{ gap: 4, paddingLeft: 8, marginTop: 4 }}>
                                        {transactionSteps.final.status === 'loading' && (
                                            <Text style={{
                                                color: palette.darkgrey,
                                                fontSize: 14,
                                                fontFamily: 'Fredoka',
                                            }}>
                                                En attente de la confirmation finale...
                                            </Text>
                                        )}
                                        {transactionSteps.final.status === 'error' && (
                                            <View style={{
                                                backgroundColor: '#fff5f5',
                                                padding: 12,
                                                borderRadius: 8,
                                                borderLeftWidth: 4,
                                                borderLeftColor: '#e74c3c',
                                                marginTop: 4,
                                            }}>
                                                <Text style={{
                                                    color: '#e74c3c',
                                                    fontSize: 14,
                                                    fontFamily: 'Fredoka',
                                                    fontWeight: '500',
                                                }}>
                                                    La transaction a échoué
                                                </Text>
                                                <Text style={{
                                                    color: '#e74c3c',
                                                    fontSize: 14,
                                                    fontFamily: 'Fredoka',
                                                    marginTop: 4,
                                                    opacity: 0.8,
                                                }}>
                                                    {transactionSteps.final.message}
                                                </Text>
                                            </View>
                                        )}
                                        {transactionSteps.final.status === 'success' && (
                                            <>
                                                <Text style={{
                                                    color: palette.darkgrey,
                                                    fontSize: 14,
                                                    fontFamily: 'Fredoka',
                                                }}>
                                                    Transaction confirmée avec succès!
                                                </Text>
                                                {transactionSteps.final.payments && (
                                                    <View style={{ marginTop: 8 }}>
                                                        <TouchableOpacity
                                                            onPress={() => setExpandedPaymentDetails(!expandedPaymentDetails)}
                                                            style={{
                                                                flexDirection: 'row',
                                                                alignItems: 'center',
                                                                gap: 8,
                                                                paddingVertical: 4,
                                                            }}
                                                        >
                                                            <Text style={{
                                                                color: palette.secondary,
                                                                fontSize: 14,
                                                                fontFamily: 'Fredoka',
                                                                textDecorationLine: 'underline',
                                                            }}>
                                                                Détails des paiements faits aux producteurs
                                                            </Text>
                                                            <Text style={{
                                                                fontSize: 12,
                                                                transform: [{ rotate: expandedPaymentDetails ? '180deg' : '0deg' }],
                                                            }}>
                                                                ▼
                                                            </Text>
                                                        </TouchableOpacity>
                                                        {expandedPaymentDetails && (
                                                            <View style={{
                                                                marginTop: 8,
                                                                paddingLeft: 8,
                                                                borderLeftWidth: 2,
                                                                borderLeftColor: `${palette.secondary}30`,
                                                            }}>
                                                                {transactionSteps.final.payments.map((payment, index: number) => (
                                                                    <View
                                                                        key={index}
                                                                        style={{
                                                                            backgroundColor: '#f8f9fa',
                                                                            borderRadius: 8,
                                                                            padding: 16,
                                                                            marginBottom: 12,
                                                                            borderWidth: 1,
                                                                            borderColor: '#e9ecef',
                                                                        }}
                                                                    >
                                                                        <Text style={{
                                                                            fontSize: 16,
                                                                            fontWeight: '600',
                                                                            color: '#2c3e50',
                                                                            marginBottom: 8,
                                                                            fontFamily: 'Fredoka',
                                                                        }}>
                                                                            {payment.producerName}
                                                                        </Text>
                                                                        <Text style={{
                                                                            fontSize: 12,
                                                                            fontFamily: 'monospace',
                                                                            color: '#6c757d',
                                                                            marginBottom: 8,
                                                                        }}>
                                                                            {payment.address}
                                                                        </Text>
                                                                        <Text style={{
                                                                            fontSize: 14,
                                                                            color: '#198754',
                                                                            fontWeight: '500',
                                                                            fontFamily: 'Fredoka',
                                                                        }}>
                                                                            <Text style={{
                                                                                color: '#2c3e50',
                                                                                fontWeight: 'normal',
                                                                            }}>
                                                                                massa reçus:{' '}
                                                                            </Text>
                                                                            {payment.amount} MAS
                                                                        </Text>
                                                                    </View>
                                                                ))}
                                                            </View>
                                                        )}
                                                    </View>
                                                )}
                                                <View 
                                                    style={{
                                                        height: 1,
                                                        backgroundColor: `${palette.secondary}15`,
                                                        width: '80%',
                                                        alignSelf: 'center',
                                                        marginVertical: 16,
                                                    }}
                                                />
                                                <View style={{
                                                    flexDirection: 'row',
                                                    gap: 16,
                                                    justifyContent: 'center',
                                                    width: '100%',
                                                    paddingHorizontal: 32,
                                                }}>
                                                    <AppButton
                                                        label="Retour aux rayons"
                                                        action={() => router.push('/')}
                                                        btnStyle={{
                                                            backgroundColor: palette.secondary,
                                                            paddingHorizontal: 16,
                                                            paddingVertical: 8,
                                                            flex: 1,
                                                            maxWidth: 180,
                                                            transform: [{ scale: 0.9 }],
                                                        }}
                                                    />
                                                    <AppButton
                                                        label="Voir mes commandes"
                                                        action={() => router.push('/mes-commandes')}
                                                        btnStyle={{
                                                            backgroundColor: palette.secondary,
                                                            paddingHorizontal: 16,
                                                            paddingVertical: 8,
                                                            flex: 1,
                                                            maxWidth: 180,
                                                            transform: [{ scale: 0.9 }],
                                                        }}
                                                    />
                                                </View>
                                            </>
                                        )}
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <DeliveryPageContainer
            title="Résumé de la commande"
            Footer={
                <View
                    style={{
                        padding: variables.spaceXL,
                        position: 'absolute',
                        bottom: 0,
                        width: '100%',
                        backgroundColor: colorUsages.white,
                    }}
                >
                    {hasPaymentUrl ? (
                        <AppButton
                            label={`Payer ma commande (${formatedTotal})`}
                            action={() => window.open(createCheckoutSessionMutation.data?.paymentUrl, '_blank')}
                        />
                    ) : !isTransactionSuccessful && (
                        <AppButton
                            label={isWalletConnected 
                                ? `Payer avec le compte : ${currentWallet?.name} (${totalPrice + 1} MAS)`
                                : `Connecter Massa Wallet (${formatedTotal})`}
                            loading={isLoadingMassaPayment && showTransactionStatus}
                            action={handleMassaPayment}
                            btnStyle={{
                                backgroundColor: palette.secondary,
                            }}
                        />
                    )}
                </View>
            }
        >
            {!showTransactionStatus && (
            <View style={styles.container}>
                <Section title="Récapitulatif du panier">
                    <BasketContentFromAppContext />
                </Section>
                <Section title="Informations de contact">
                    <View>
                        <Text style={styles.text}>{contactData.firstName} {contactData.lastName}</Text>
                        <Text style={styles.text}>{contactData.email}</Text>
                        <Text style={styles.text}>{contactData.phone}</Text>
                    </View>
                </Section>
                <Section title="Livraison">
                    <View>
                        <Text style={styles.text}>{deliveryMethod.name}</Text>
                        <Text style={styles.text}>{dayChosen}</Text>
                    </View>
                </Section>
            </View>
            )}
            {renderInsufficientBalanceMessage()}
            {renderTransactionStatus()}
            {renderEventMessage()}
        </DeliveryPageContainer>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        maxWidth: 800,
        gap: variables.spaceXL,
    },
    text: {
        ...common.text.text,
    },
});

const Section = ({ children, title }: PropsWithChildren<{ title?: string }>) => {
    return (
        <View style={sectionStyles.section}>
            <Text style={sectionStyles.sectionTitle}>{title}</Text>
            <View style={{ padding: 8 }}>{children}</View>
        </View>
    );
};

const sectionStyles = StyleSheet.create({
    section: {
        backgroundColor: colorUsages.white,
        borderRadius: variables.smallRadius,
        padding: variables.space,
    },
    sectionTitle: {
        ...common.text.h2Title,
        marginBottom: variables.space,
    },
});
