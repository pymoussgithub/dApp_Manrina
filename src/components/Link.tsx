import NextLink from 'next/link';
import { PropsWithChildren } from 'react';
import { TouchableOpacity, ViewStyle } from 'react-native';

type LinkProps = {
    href: string;
    style?: ViewStyle;
    onClick?: () => void;
};

export const Link = ({ children, href, style, onClick }: PropsWithChildren<LinkProps>) => {
    return (
        <NextLink href={href} passHref>
            <TouchableOpacity style={style} onPress={onClick}>
                {children}
            </TouchableOpacity>
        </NextLink>
    );
};
