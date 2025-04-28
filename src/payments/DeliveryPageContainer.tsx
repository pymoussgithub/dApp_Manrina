import { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { Header, HeaderTitle } from '../components/Header/Header';
import { AppImage } from '../components/Image';
import { BackButton } from '../components/products/BackButton';
import { colorUsages, variables } from '../theme';

export const DeliveryPageContainer = ({
    children,
    title,
    Footer,
}: PropsWithChildren<{ title?: string; Footer?: ReactNode }>) => {
    return (
        <View style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header
                backgroundStyle={{
                    backgroundColor: colorUsages.secondary,
                }}
                LeftSection={<BackButton color={colorUsages.white} />}
                CentralSection={<HeaderTitle style={{ color: colorUsages.white }}>{title || 'Livraison'}</HeaderTitle>}
                hideBasket
            />
            <ScrollView
                style={{ flex: 1, paddingHorizontal: variables.spaceXL }}
                contentContainerStyle={{
                    alignItems: 'center',
                    paddingTop: variables.spaceXL,
                    paddingBottom: Footer ? 100 : variables.spaceXL,
                }}
            >
                <AppImage
                    source="icons/delivery.svg"
                    alt="delivery icon"
                    width={200}
                    height={200}
                    style={{
                        objectFit: 'contain',
                        margin: 'auto',
                    }}
                />
                {children}
            </ScrollView>
            {Footer && (
                <View style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: colorUsages.white,
                    zIndex: 10,
                }}>
                    {Footer}
                </View>
            )}
        </View>
    );
};
