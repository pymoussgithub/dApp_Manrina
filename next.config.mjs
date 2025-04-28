/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@massalabs/wallet-provider', '@massalabs/massa-web3'],
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "catalog-images-live.s3.amazonaws.com",
                port: "",
            },
            {
                protocol: "https",
                hostname: "cdn.sumup.store",
                port: "",
            },
            {
                protocol: "https",
                hostname: "www.manrina.fr",
                port: "",
            },
        ],
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    webpack: (config) => {
        config.resolve.alias = {
            ...(config.resolve.alias || {}),
            // Transform all direct `react-native` imports to `react-native-web`
            "react-native$": "react-native-web",
        };
        config.resolve.fallback = {
            ...config.resolve.fallback,
            "buffer": false,
        };
        return config;
    },
};

export default nextConfig;
