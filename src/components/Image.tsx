import Image from 'next/image';
import { CSSProperties } from 'react';

export const AppImage = ({
    source,
    style,
    alt,
    width,
    height,
    fill,
}: {
    source: string;
    style?: CSSProperties;
    alt: string;
    width?: number;
    height?: number;
    fill?: boolean;
}) => {
    return (
        <Image
            fill={fill}
            src={source}
            style={{ objectFit: 'cover', ...style }}
            alt={alt}
            width={width || (style?.width as number)}
            height={height || (style?.height as number)}
            // sizes="100vw"
            // objectFit="cover"
        />
    );
};
