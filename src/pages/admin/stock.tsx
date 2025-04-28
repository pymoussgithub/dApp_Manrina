import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDebounce } from 'react-use';
import { withAdminAuth } from '../../components/admin/withAdminAuth';
import { AppImage } from '../../components/Image';
import { UpdateQuantityButtons } from '../../components/products/BasketItem';
import { SearchBar } from '../../components/products/SearchBar';
import { useFilteredProducts } from '../../hooks/useFilteredProducts';
import { IProduct } from '../../server/product/IProduct';
import { backendFetchService } from '../../service/BackendFetchService';
import { colorUsages, common, variables } from '../../theme';
import { numberFormat } from '../../service/NumberFormat';

function StockEditor({ variant }: { variant: IProduct['variants'][0] }) {
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState(variant.stock.toString());
    const queryClient = useQueryClient();

    const inputValueNumber = parseInt(inputValue);

    const { mutate: updateStock, isPending: updating } = useMutation({
        mutationFn: async (newStock: number) => {
            if (newStock < 0) return variant.stock;

            await backendFetchService.adjustStock({
                variantId: variant.id,
                newStock,
                reason: 'Manual adjustment',
                adjustedBy: 'admin',
            });
            return newStock;
        },
        onSuccess: (newStock) => {
            // Update the products cache with new stock value
            queryClient.setQueryData<IProduct[]>(['products'], (oldProducts) => {
                if (!oldProducts) return oldProducts;
                return oldProducts.map((product) => ({
                    ...product,
                    variants: product.variants.map((v) => (v.id === variant.id ? { ...v, stock: newStock } : v)),
                }));
            });
        },
        onError: () => {
            // Reset to previous value on error
            setInputValue(variant.stock.toString());
            alert('Failed to update stock');
        },
    });

    const handleStockChange = (newValue: string) => {
        // if (updating) return;
        setInputValue(newValue);
    };

    useDebounce(
        () => {
            const numValue = parseInt(inputValue);
            if (!isNaN(numValue) && numValue !== variant.stock) {
                updateStock(numValue);
            }
        },
        300,
        [inputValue],
    );

    const handleInputBlur = () => {
        setIsEditing(false);
        const numValue = parseInt(inputValue);
        if (isNaN(numValue) || numValue < 0) {
            setInputValue(variant.stock.toString());
        }
    };

    return (
        <View style={styles.stockEditor}>
            <UpdateQuantityButtons
                increment={() => handleStockChange(Math.max(0, inputValueNumber + 1).toString())}
                decrement={() => handleStockChange(Math.max(0, inputValueNumber - 1).toString())}
                quantity={inputValueNumber}
                disabled={updating}
            />
            <TouchableOpacity
                onPress={() => setIsEditing(true)}
                style={styles.stockInputContainer}
                disabled={updating}
            >
                {isEditing ? (
                    <TextInput
                        style={styles.stockInput}
                        value={inputValue}
                        onChangeText={handleStockChange}
                        onBlur={handleInputBlur}
                        keyboardType="numeric"
                        autoFocus
                        selectTextOnFocus
                        editable={!updating}
                    />
                ) : (
                    <Text style={styles.stockText}>{updating ? '...' : variant.stock}</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

function StockManagementPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const { data: products = [], isLoading } = useQuery({
        queryKey: ['products'],
        queryFn: backendFetchService.getAllProducts,
    });

    const filteredProductsList = useFilteredProducts(products, searchTerm, {
        includeVariants: true,
    });

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.listContainer}>
                <Text style={styles.sectionTitle}>Products Stock Management</Text>
                <SearchBar
                    initialValue={searchTerm}
                    onSearch={setSearchTerm}
                />
                <View style={styles.productsList}>
                    {filteredProductsList.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                        />
                    ))}
                </View>
            </View>
        </View>
    );
}

function ProductCard({ product }: { product: IProduct }) {
    return (
        <View style={styles.productCard}>
            <View style={styles.productHeader}>
                <AppImage
                    source={product.imageUrl}
                    style={styles.productImage}
                    alt={product.name}
                />
                <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <View style={styles.variantsList}>
                        {product.variants.map((variant) => (
                            <View
                                key={variant.id}
                                style={styles.variantItem}
                            >
                                <View style={styles.variantContent}>
                                    <View style={styles.variantInfo}>
                                        <Text style={styles.variantLabel}>{variant.optionValue}</Text>
                                        <Text style={styles.variantPrice}>{numberFormat.toPrice(variant.price)}</Text>
                                    </View>
                                    <StockEditor variant={variant} />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: variables.spaceXL,
        backgroundColor: colorUsages.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        flex: 1,
        backgroundColor: colorUsages.white,
        borderRadius: 10,
        padding: variables.spaceBig,
        maxWidth: 1200,
        margin: 'auto',
    },
    sectionTitle: {
        ...common.text.h1HighlightInfo,
        marginBottom: variables.spaceXL,
    },
    productsList: {
        gap: variables.spaceBig,
    },
    productCard: {
        borderBottomWidth: 1,
        borderBottomColor: colorUsages.borderColor,
        paddingVertical: variables.spaceXL,
    },
    productHeader: {
        flexDirection: 'row',
        gap: variables.space,
    },
    productImage: {
        width: 70,
        height: 70,
        borderRadius: 5,
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        ...common.text.h2Title,
        marginBottom: variables.space,
    },
    variantsList: {
        gap: variables.space,
    },
    variantItem: {
        paddingVertical: variables.spaceSmall,
    },
    variantContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    variantInfo: {
        flexDirection: 'row',
        gap: variables.spaceBig,
        alignItems: 'center',
        width: 200,
    },
    variantLabel: {
        ...common.text.h3Subtitle,
    },
    variantPrice: {
        ...common.text.text,
    },
    stockEditor: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchContainer: {
        marginBottom: variables.spaceBig,
    },
    stockInputContainer: {
        marginLeft: variables.space,
        minWidth: 50,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
    },
    stockInput: {
        // width: "100%",
        maxWidth: 50,
        height: '100%',
        textAlign: 'center',
        padding: 12,
        ...common.text.text,
    },
    stockText: {
        ...common.text.text,
        borderWidth: 1,
        maxWidth: 50,
        padding: 12,
        borderColor: colorUsages.borderColor,
    },
});

export default withAdminAuth(StockManagementPage);
