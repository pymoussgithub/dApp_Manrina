import { AppImage } from '../Image';

export const Plus = ({ width, height }: { width?: number; height?: number }) => {
    return (
        <AppImage
            source="/icons/plus.svg"
            style={{ height: height || 40, width: width || 40 }}
            alt="Panier vide"
        />
    );
};
