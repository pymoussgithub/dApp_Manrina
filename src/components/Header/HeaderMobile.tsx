import { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { colorUsages } from '../../theme';
import { AppImage } from '../Image';
import { BaseHeader, BaseHeaderProps } from './BaseHeader';
import { ManrinaLogo } from './ManrinaLogo';
import { NAVBAR_LINKS } from './NAVBAR_LINKS';
import { NavbarItem } from './NavbarItem';

export const HeaderMobile = (props: BaseHeaderProps) => {
    const [isNavbarVisible, setIsNavbarVisible] = useState(false);

    const toggleNavbar = () => {
        setIsNavbarVisible((state) => !state);
    };

    return (
        <>
            <BaseHeader
                hideBasket={props.hideBasket}
                backgroundStyle={props.backgroundStyle}
                LeftSection={
                    props.LeftSection ?? (
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 10,
                            }}
                        >
                            {/* <MenuBurger toggleNavbar={toggleNavbar} /> */}
                            <ManrinaLogo />
                        </View>
                    )
                }
                CentralSection={props.CentralSection || null}
            />
            {isNavbarVisible && (
                <View
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: colorUsages.white,
                        padding: 16,
                        zIndex: 100,
                    }}
                >
                    {NAVBAR_LINKS.map((link) => (
                        <NavbarItem
                            key={link.path}
                            {...link}
                            onPress={toggleNavbar}
                        />
                    ))}
                </View>
            )}
        </>
    );
};

const MenuBurger = ({ toggleNavbar }: { toggleNavbar: () => void }) => {
    return (
        <TouchableOpacity onPress={toggleNavbar}>
            <AppImage
                source="/icons/burger.svg"
                style={{ height: 40, width: 40 }}
                alt="Menu Burger"
            />
        </TouchableOpacity>
    );
};
