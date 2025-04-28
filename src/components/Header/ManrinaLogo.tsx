import { View } from 'react-native';
import { Link } from '../Link';
import { AppImage } from '../Image';
import { ROUTES } from '../../router/routes';

export const ManrinaLogo = () => {
    return (
        <Link href={ROUTES.PRODUITS}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <AppImage
                    source="/logo-color.png"
                    style={{
                        height: 24,
                        width: 100,
                        objectFit: 'contain',
                    }}
                    alt="Logo Manrina"
                />
            </View>
        </Link>
    );
};
