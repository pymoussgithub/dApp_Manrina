import { Text } from 'react-native';
import { Link } from '../Link';
import { common } from '../../theme';

export const NavbarItem = ({ path, title, onPress }: { path: string; title: string; onPress?: () => void }) => {
    return (
        <Link href={path} onClick={onPress}>
            <Text style={common.text.text}>{title}</Text>
        </Link>
    );
};
