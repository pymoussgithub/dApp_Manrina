import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { IProduct, IProductVariant } from '../../server/product/IProduct';
import { colorUsages, common, variables } from '../../theme';

const variantStyles = StyleSheet.create({
    variantSelector: {
        flexDirection: 'row',
        gap: variables.space,
        flexWrap: 'wrap',
    },
    variantButton: {
        paddingHorizontal: variables.space,
        paddingVertical: variables.spaceSmall,
        borderRadius: variables.radiusXS,
        backgroundColor: colorUsages.notSelected,
    },
    selectedVariant: {
        backgroundColor: colorUsages.selected,
        color: colorUsages.white,
    },
    variantText: {
        ...common.text.paragraph,
        lineHeight: common.text.paragraph.fontSize,
        paddingTop: variables.spaceSmaller, // 2, this is to make the text center align because it is not centered by default...
        color: 'inherit',
        maxWidth: 140,
    },
    outOfStockText: {
        color: colorUsages.lightInfo,
    },
    outOfStockVariant: {
        // backgroundColor: colorUsages.lightInfo,
    },
});
export const VariantSelector = ({
    product,
    selectedVariantId,
    setSelectedVariantId,
    maxVariantsToDisplay = Infinity,
}: {
    product: IProduct;
    selectedVariantId: string;
    setSelectedVariantId: (variantId: string) => void;
    maxVariantsToDisplay?: number;
}) => {
    const numberVariantsNotShown = product.variants.length - maxVariantsToDisplay;
    return (
        <>
            {product.variants.length > 0 && (
                <View style={variantStyles.variantSelector}>
                    {product.variants.slice(0, maxVariantsToDisplay).map((variant) => {
                        return (
                            <VariantElement
                                key={variant.id}
                                selected={selectedVariantId === variant.id}
                                variant={variant}
                                onPress={() => setSelectedVariantId(variant.id)}
                            />
                        );
                    })}
                    {numberVariantsNotShown > 0 && (
                        <VariantElement
                            variant={{
                                id: 'more',
                                optionValue: `+${numberVariantsNotShown}`,
                                stock: 0,
                            }}
                            // onPress={() => {}}
                        />
                    )}
                </View>
            )}
        </>
    );
};

export const VariantElement = ({
    variant,
    onPress,
    style,
    selected,
}: {
    variant: Pick<IProductVariant, 'id' | 'optionValue' | 'stock'>;
    onPress?: () => void;
    style?: ViewStyle;
    selected?: boolean;
}) => {
    const outOfStock = variant.stock <= 0;
    if (!variant.optionValue) {
        return null;
    }
    return (
        <TouchableOpacity
            style={[
                variantStyles.variantButton,
                selected && variantStyles.selectedVariant,
                outOfStock && variantStyles.outOfStockVariant,
                style,
            ]}
            onPress={onPress}
            disabled={outOfStock}
        >
            <Text
                style={[variantStyles.variantText, outOfStock && variantStyles.outOfStockText]}
                accessibilityLabel={'En rupture de stock'}
                accessibilityHint={'En rupture de stock'}
            >
                {variant.optionValue}
            </Text>
        </TouchableOpacity>
    );
};
