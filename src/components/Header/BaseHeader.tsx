import { ReactNode, useState, useEffect, useRef } from 'react';
import { View, ViewStyle, TouchableOpacity, Text, Animated, ScrollView, Image } from 'react-native';
import { NavbarBasket } from './NavbarBasket';
import { StyleSheet } from 'react-native';
import { palette } from '../../theme';
import { useRouter } from 'next/router';
import { useWallet } from '../../contexts/WalletContext';
import { isProducerWallet } from '../../config/contracts';

export type BaseHeaderProps = {
    LeftSection?: ReactNode;
    CentralSection?: ReactNode;
    backgroundStyle?: ViewStyle;
    hideBasket?: boolean;
};

export const BaseHeader = ({ 
    LeftSection, 
    CentralSection, 
    backgroundStyle, 
    hideBasket,
}: BaseHeaderProps) => {
    const router = useRouter();
    const { 
        isWalletConnected, 
        currentWallet, 
        wallets, 
        connectWallet, 
        disconnectWallet, 
        setCurrentWallet 
    } = useWallet();
    
    // Only show wallet button on main products page and payment summary page
    const shouldShowWalletButton = router.pathname === '/' || 
        (router.pathname === '/payment' && router.query.state === 'summary') ||
        router.pathname === '/mes-ventes' ||
        router.pathname === '/mes-commandes';

    const [showPanel, setShowPanel] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(-320)).current;
    const [showWalletList, setShowWalletList] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const [hoveredWalletAddress, setHoveredWalletAddress] = useState<string | null>(null);
    const panelRef = useRef<View>(null);
    const dropdownRef = useRef<View>(null);
    const buttonRef = useRef<any>(null);
    const [showMassaStationMessage, setShowMassaStationMessage] = useState(false);

    const massaPrice = 2; // Price in USD

    const handleSelectWallet = (wallet: typeof wallets[0]) => {
        setCurrentWallet(wallet);
        setShowWalletList(false);
    };

    const truncateAddress = (address: string | undefined, startLength = 6, endLength = 4) => {
        if (!address) return '';
        if (address.length <= startLength + endLength) return address;
        return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
    };

    const truncateName = (name: string | undefined, maxLength = 15) => {
        if (!name) return '';
        if (name.length <= maxLength) return name;
        return `${name.slice(0, maxLength)}...`;
    };

    const formatBalance = (balance: number | undefined) => {
        if (balance === undefined) return '0.00';
        return balance.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    useEffect(() => {
        if (showPanel) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 65,
                    friction: 10,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: -320,
                    tension: 65,
                    friction: 10,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [showPanel]);

    const handleConnectWallet = () => {
        if (!isWalletConnected) {
            setShowPanel(!showPanel);
        }
    };

    const handleDisconnect = () => {
        setIsDisconnecting(true);
        setTimeout(() => {
            disconnectWallet();
            setShowPanel(false);
            setIsDisconnecting(false);
        }, 500);
    };

    const handleMassaStation = async () => {
        console.log('Connecting to MassaStation');
        try {
            await connectWallet();
            setShowPanel(true);
        } catch (error) {
            console.error('MassaStation connection error:', error);
            setShowMassaStationMessage(true);
            setShowPanel(false);
            // Open MassaStation website in a new tab
            window.open('https://station.massa.net/', '_blank');
        }
    };

    const handleBearBy = () => {
        console.log('Connecting to BearBy');
        connectWallet();
        setShowPanel(true);
    };

    const handleCopyAddress = () => {
        if (currentWallet?.address) {
            navigator.clipboard.writeText(currentWallet.address);
        }
    };

    const updateDropdownPosition = (event: any) => {
        const rect = event.target.getBoundingClientRect();
        setDropdownPosition({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX
        });
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Handle wallet list dropdown
            if (showWalletList && dropdownRef.current && !(dropdownRef.current as any).contains(event.target)) {
                setShowWalletList(false);
            }

            // Handle wallet panel - don't close if clicking on the dropdown
            if (showPanel && 
                panelRef.current && 
                buttonRef.current && 
                !(panelRef.current as any).contains(event.target) && 
                !(buttonRef.current as any).contains(event.target) &&
                !(dropdownRef.current as any)?.contains(event.target)) {
                setShowPanel(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showWalletList, showPanel]);

    const renderWalletButton = () => {
        if (isWalletConnected) {
            return (
                <>
                    <TouchableOpacity
                        ref={buttonRef}
                        style={{
                            backgroundColor: palette.white,
                            paddingVertical: 10,
                            paddingHorizontal: 20,
                            borderRadius: 8,
                            elevation: 2,
                            shadowColor: palette.black,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                        }}
                        onPress={() => setShowPanel(!showPanel)}
                    >
                        <Text style={{
                            color: palette.secondary,
                            fontSize: 14,
                            fontWeight: '500',
                            textAlign: 'center',
                            fontFamily: 'Fredoka',
                        }}>
                            Wallet Connected
                        </Text>
                        <Text style={{
                            color: palette.secondary,
                            fontSize: 15,
                            fontWeight: '600',
                            textAlign: 'center',
                            fontFamily: 'Fredoka',
                            marginTop: 4,
                            opacity: 0.8,
                        }}>
                            {truncateName(currentWallet?.name)}
                        </Text>
                    </TouchableOpacity>

                    {showPanel && (
                        <Animated.View
                            ref={panelRef}
                            style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: 12,
                                backgroundColor: palette.white,
                                borderRadius: 12,
                                padding: 16,
                                width: 320,
                                shadowColor: palette.black,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.15,
                                shadowRadius: 12,
                                elevation: 8,
                                zIndex: 101,
                                opacity: fadeAnim,
                                transform: [{ translateX: slideAnim }],
                            }}
                        >
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: 16,
                            }}>
                                <View style={{
                                    backgroundColor: palette.lightOrange,
                                    paddingVertical: 6,
                                    paddingHorizontal: 10,
                                    borderRadius: 6,
                                    marginRight: 12,
                                    flexDirection: 'column',
                                    gap: 4,
                                }}>
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 8,
                                    }}>
                                        <Text style={{
                                            fontSize: 14,
                                            color: palette.secondary,
                                            fontWeight: '600',
                                            fontFamily: 'Fredoka',
                                        }}>
                                            {truncateName(currentWallet?.name)}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={(e) => {
                                                if (!showWalletList) {
                                                    updateDropdownPosition(e);
                                                }
                                                setShowWalletList(!showWalletList);
                                            }}
                                            style={{
                                                padding: 4,
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={{
                                                fontSize: 14,
                                                color: palette.secondary,
                                                transform: [{ rotate: showWalletList ? '180deg' : '0deg' }],
                                                transition: 'transform 0.2s ease',
                                            }}>
                                                ▼
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={{
                                        fontSize: 12,
                                        color: palette.darkgrey,
                                        fontFamily: 'Fredoka',
                                    }}>
                                        {truncateAddress(currentWallet?.address, 6, 4)}
                                    </Text>
                                </View>
                                <View style={{
                                    flexDirection: 'row',
                                    gap: 8,
                                }}>
                                    <TouchableOpacity
                                        onPress={handleCopyAddress}
                                        style={{
                                            padding: 4,
                                        }}
                                    >
                                        <Text style={{
                                            fontSize: 16,
                                            color: palette.secondary,
                                            opacity: 0.8,
                                        }}>
                                            📋
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={{
                                backgroundColor: palette.lightOrange,
                                padding: 12,
                                borderRadius: 8,
                                marginBottom: 16,
                                alignItems: 'center',
                            }}>
                                <Text style={{
                                    fontSize: 13,
                                    color: palette.secondary,
                                    marginBottom: 6,
                                    fontFamily: 'Fredoka',
                                    textAlign: 'center',
                                }}>
                                    Balance:
                                </Text>
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                }}>
                                    <Text style={{
                                        fontSize: 14,
                                        color: palette.secondary,
                                        fontWeight: '600',
                                        fontFamily: 'Fredoka',
                                    }}>
                                        {formatBalance(currentWallet?.balance)} MAS
                                    </Text>
                                    <Text style={{
                                        fontSize: 14,
                                        color: palette.darkgrey,
                                        fontFamily: 'Fredoka',
                                    }}>
                                        (≈ ${formatBalance((currentWallet?.balance || 0) * massaPrice)})
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={{
                                    backgroundColor: palette.lightOrange,
                                    padding: 10,
                                    borderRadius: 8,
                                    marginBottom: 16,
                                    alignItems: 'center',
                                    width: '100%',
                                }}
                                onPress={() => router.push('/mes-commandes')}
                            >
                                <Text style={{
                                    color: palette.secondary,
                                    fontSize: 13,
                                    fontWeight: '500',
                                    textAlign: 'center',
                                    fontFamily: 'Fredoka',
                                }}>
                                    Mes commandes
                                </Text>
                            </TouchableOpacity>

                            {isProducerWallet(currentWallet?.address) && (
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: palette.lightOrange,
                                        padding: 10,
                                        borderRadius: 8,
                                        marginBottom: 16,
                                        alignItems: 'center',
                                        width: '100%',
                                    }}
                                    onPress={() => {
                                        setShowPanel(false);
                                        router.push('/mes-ventes');
                                    }}
                                >
                                    <Text style={{
                                        color: palette.secondary,
                                        fontSize: 13,
                                        fontWeight: '500',
                                        textAlign: 'center',
                                        fontFamily: 'Fredoka',
                                    }}>
                                        Mes ventes
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <View
                                style={{
                                    height: 1,
                                    backgroundColor: palette.lightOrange,
                                    marginBottom: 16,
                                    width: '100%',
                                }}
                            />

                            <TouchableOpacity
                                style={{
                                    backgroundColor: isDisconnecting ? palette.danger : palette.lightOrange,
                                    padding: 10,
                                    borderRadius: 6,
                                    opacity: isDisconnecting ? 0.8 : 1,
                                    alignItems: 'center',
                                    width: '100%',
                                }}
                                onPress={handleDisconnect}
                                disabled={isDisconnecting}
                            >
                                <Text style={{
                                    color: isDisconnecting ? palette.white : palette.danger,
                                    fontSize: 13,
                                    fontWeight: '500',
                                    textAlign: 'center',
                                    fontFamily: 'Fredoka',
                                }}>
                                    {isDisconnecting ? 'Disconnecting...' : 'Disconnect Wallet'}
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    )}
                </>
            );
        }

        return (
            <>
                <TouchableOpacity
                    style={{
                        backgroundColor: palette.white,
                        paddingVertical: 10,
                        paddingHorizontal: 20,
                        borderRadius: 8,
                        elevation: 2,
                        shadowColor: palette.black,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                    }}
                    activeOpacity={0.8}
                    onPress={handleConnectWallet}
                >
                    <Text style={{
                        color: palette.secondary,
                        fontSize: 16,
                        fontWeight: '500',
                        textAlign: 'center',
                        fontFamily: 'Fredoka',
                    }}>
                        Connect Wallet
                    </Text>
                </TouchableOpacity>
                
                {showPanel && (
                    <View
                        style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: 8,
                            backgroundColor: palette.white,
                            borderRadius: 8,
                            padding: 8,
                            minWidth: 160,
                            shadowColor: palette.black,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 3,
                            zIndex: 100,
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                paddingVertical: 8,
                                paddingHorizontal: 16,
                                borderRadius: 4,
                                backgroundColor: palette.lightOrange,
                                marginBottom: 4,
                            }}
                            onPress={handleMassaStation}
                        >
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8,
                            }}>
                                <Image 
                                    source={{ uri: '/logo_massa_station.png' }}
                                    style={{
                                        width: 20,
                                        height: 20,
                                        objectFit: 'contain'
                                    }}
                                    alt="MassaStation"
                                />
                                <Text style={{
                                    color: palette.secondary,
                                    fontSize: 14,
                                    fontWeight: '500',
                                    fontFamily: 'Fredoka',
                                }}>
                                    MassaStation
                                </Text>
                            </View>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={{
                                paddingVertical: 8,
                                paddingHorizontal: 16,
                                borderRadius: 4,
                                backgroundColor: palette.lightOrange,
                            }}
                            onPress={handleBearBy}
                        >
                            <Text style={{
                                color: palette.secondary,
                                fontSize: 14,
                                fontWeight: '500',
                                fontFamily: 'Fredoka',
                            }}>
                                BearBy
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </>
        );
    };

    const renderWalletListDropdown = () => {
        if (!showWalletList) return null;
        
        return (
            <View 
                ref={dropdownRef}
                style={{
                    position: 'fixed',
                    top: dropdownPosition.top,
                    left: dropdownPosition.left,
                    backgroundColor: palette.white,
                    borderRadius: 12,
                    padding: 16,
                    minWidth: 280,
                    maxHeight: 400,
                    shadowColor: palette.black,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    elevation: 8,
                    zIndex: 9999,
                }}
            >
                <View style={{
                    backgroundColor: `${palette.secondary}15`,
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 16,
                }}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 4,
                    }}>
                        <View>
                            <Text style={{
                                fontSize: 14,
                                color: palette.secondary,
                                fontWeight: '600',
                                fontFamily: 'Fredoka',
                                marginBottom: 4,
                            }}>
                                {truncateName(currentWallet?.name)}
                            </Text>
                            <Text style={{
                                fontSize: 12,
                                color: palette.darkgrey,
                                fontFamily: 'Fredoka',
                            }}>
                                {truncateAddress(currentWallet?.address, 6, 4)}
                            </Text>
                        </View>
                        <View style={{
                            alignItems: 'flex-end',
                        }}>
                            <Text style={{
                                fontSize: 14,
                                color: palette.secondary,
                                fontWeight: '600',
                                fontFamily: 'Fredoka',
                                marginBottom: 4,
                            }}>
                                {formatBalance(currentWallet?.balance)} MAS
                            </Text>
                            <Text style={{
                                fontSize: 12,
                                color: palette.darkgrey,
                                fontFamily: 'Fredoka',
                            }}>
                                ≈ ${formatBalance((currentWallet?.balance || 0) * massaPrice)}
                            </Text>
                        </View>
                    </View>
                </View>

                <View
                    style={{
                        height: 1,
                        backgroundColor: palette.lightOrange,
                        marginBottom: 16,
                        width: '100%',
                    }}
                />

                <ScrollView 
                    style={{
                        maxHeight: '100%',
                    }}
                    showsVerticalScrollIndicator={true}
                    scrollIndicatorInsets={{ right: 2 }}
                >
                    {wallets.filter((_, index) => index !== wallets.findIndex(w => w.address === currentWallet?.address)).map((wallet, index) => (
                        <TouchableOpacity
                            key={wallet.address}
                            style={{
                                marginBottom: index < wallets.length - 2 ? 8 : 0,
                            }}
                            onPress={() => handleSelectWallet(wallet)}
                            activeOpacity={0.7}
                        >
                            <Animated.View 
                                style={{
                                    backgroundColor: hoveredWalletAddress === wallet.address 
                                        ? `${palette.secondary}15`
                                        : palette.lightOrange,
                                    padding: 12,
                                    borderRadius: 8,
                                    transform: [{ scale: hoveredWalletAddress === wallet.address ? 1.01 : 1 }],
                                }}
                                onMouseEnter={() => setHoveredWalletAddress(wallet.address)}
                                onMouseLeave={() => setHoveredWalletAddress(null)}
                            >
                                <View style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    marginBottom: 4,
                                }}>
                                    <View>
                                        <Text style={{
                                            fontSize: 14,
                                            color: palette.secondary,
                                            fontWeight: hoveredWalletAddress === wallet.address ? '500' : '400',
                                            fontFamily: 'Fredoka',
                                            marginBottom: 4,
                                        }}>
                                            {truncateName(wallet.name)}
                                        </Text>
                                        <Text style={{
                                            fontSize: 12,
                                            color: palette.darkgrey,
                                            fontFamily: 'Fredoka',
                                        }}>
                                            {truncateAddress(wallet.address, 6, 4)}
                                        </Text>
                                    </View>
                                    <View style={{
                                        alignItems: 'flex-end',
                                    }}>
                                        <Text style={{
                                            fontSize: 14,
                                            color: palette.secondary,
                                            fontWeight: '600',
                                            fontFamily: 'Fredoka',
                                            marginBottom: 4,
                                        }}>
                                            {formatBalance(wallet.balance)} MAS
                                        </Text>
                                        <Text style={{
                                            fontSize: 12,
                                            color: palette.darkgrey,
                                            fontFamily: 'Fredoka',
                                        }}>
                                            ≈ ${formatBalance((wallet.balance || 0) * massaPrice)}
                                        </Text>
                                    </View>
                                </View>
                            </Animated.View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        );
    };

    const renderMassaStationMessage = () => {
        if (!showMassaStationMessage) return null;

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
                    <Image 
                        source={{ uri: '/logo_massa_station.png' }}
                        style={{
                            width: 64,
                            height: 64,
                            objectFit: 'contain'
                        }}
                        alt="MassaStation"
                    />
                    <Text style={{
                        color: palette.secondary,
                        fontSize: 20,
                        fontWeight: '600',
                        textAlign: 'center',
                        fontFamily: 'Fredoka',
                    }}>
                        MassaStation Required
                    </Text>
                    <Text style={{
                        color: palette.secondary,
                        fontSize: 16,
                        textAlign: 'center',
                        fontFamily: 'Fredoka',
                        opacity: 0.8,
                        lineHeight: 24,
                    }}>
                        Please install or run MassaStation to connect your wallet. You will be redirected to the download page.
                    </Text>
                    <TouchableOpacity
                        style={{
                            backgroundColor: palette.lightOrange,
                            padding: 12,
                            borderRadius: 8,
                            width: '100%',
                        }}
                        onPress={() => setShowMassaStationMessage(false)}
                    >
                        <Text style={{
                            color: palette.secondary,
                            fontSize: 16,
                            fontWeight: '500',
                            textAlign: 'center',
                            fontFamily: 'Fredoka',
                        }}>
                            Got it
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <>
            <View
                style={{
                    padding: 20,
                    zIndex: 1,
                    ...backgroundStyle,
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        maxWidth: 1000,
                        width: '100%',
                        marginHorizontal: 'auto',
                        gap: 12,
                    }}
                >
                    {LeftSection}
                    <View>{CentralSection}</View>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                    }}>
                        {hideBasket ? <View /> : <NavbarBasket />}
                        {shouldShowWalletButton && (
                            <View style={{ position: 'relative' }}>
                                {renderWalletButton()}
                            </View>
                        )}
                    </View>
                </View>
            </View>
            {renderWalletListDropdown()}
            {renderMassaStationMessage()}
        </>
    );
};
