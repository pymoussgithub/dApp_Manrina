import { ScrollView, StyleSheet, View } from 'react-native';
import { Header, HeaderTitle } from '../components/Header/Header';
import { BackButton } from '../components/products/BackButton';
import { BasketContentFromAppContext, ValidateBasketButton } from '../payments/BasketContent';
import { colorUsages } from '../theme';

const Panier = () => {
    return (
        <View style={{ height: '100vh' }}>
            <Header
                backgroundStyle={{
                    backgroundColor: colorUsages.secondary,
                }}
                LeftSection={<BackButton color={colorUsages.white} />}
                CentralSection={<HeaderTitle style={{ color: colorUsages.white }}>Mon panier</HeaderTitle>}
                hideBasket
            />
            <ScrollView style={stylesPanier.scrollView}>
                <View style={stylesPanier.container}>
                    <BasketContentFromAppContext canUpdate>
                        <ValidateBasketButton />
                    </BasketContentFromAppContext>
                </View>
            </ScrollView>
        </View>
    );
};

export default Panier;

const stylesPanier = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: colorUsages.background,
    },
    container: {
        display: 'flex',
        padding: 20,
        width: '100%',
        flexDirection: 'column',
        alignItems: 'center',
    },
});
