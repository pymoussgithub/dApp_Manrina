import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Wallet = {
    name: string;
    address: string;
    balance: number;
};

type WalletContextType = {
    isWalletConnected: boolean;
    currentWallet: Wallet | null;
    wallets: Wallet[];
    connectWallet: () => Promise<void>;
    disconnectWallet: () => void;
    setCurrentWallet: (wallet: Wallet) => void;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const getInitialWalletState = () => {
    if (typeof window === 'undefined') return { isConnected: false, wallet: null, wallets: [] };
    
    try {
        const savedWalletState = localStorage.getItem('walletState');
        if (savedWalletState) {
            const { isConnected, wallet, wallets } = JSON.parse(savedWalletState);
            return { isConnected, wallet, wallets: wallets || [] };
        }
    } catch (error) {
        console.error('Error reading wallet state from localStorage:', error);
    }
    
    return { isConnected: false, wallet: null, wallets: [] };
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
    const initialState = getInitialWalletState();
    const [isWalletConnected, setIsWalletConnected] = useState(initialState.isConnected);
    const [currentWallet, setCurrentWallet] = useState<Wallet | null>(initialState.wallet);
    const [isInitialized, setIsInitialized] = useState(false);
    const [wallets, setWallets] = useState<Wallet[]>(initialState.wallets);

    useEffect(() => {
        setIsInitialized(true);
    }, []);

    useEffect(() => {
        if (!isInitialized) return;
        
        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem('walletState', JSON.stringify({
                    isConnected: isWalletConnected,
                    wallet: currentWallet,
                    wallets: wallets
                }));
            }
        } catch (error) {
            console.error('Error saving wallet state to localStorage:', error);
        }
    }, [isWalletConnected, currentWallet, wallets, isInitialized]);

    const connectWallet = async () => {
        try {
            console.log('Step 1: Starting wallet connection...');
            
            // Dynamically import MassaStationWallet
            const { MassaStationWallet } = await import('@massalabs/wallet-provider');
            
            // Initialize MassaStation wallet
            const massaWallet = new MassaStationWallet();
            console.log('Step 2: MassaStation wallet initialized');

            try {
                // Get all accounts
                const accounts = await massaWallet.accounts();
                console.log('Step 3: Accounts:', accounts);

                if (!accounts || accounts.length === 0) {
                    console.error('No accounts found');
                    throw new Error('No accounts found in MassaStation. Please create an account first.');
                }

                // Convert all accounts to wallet format and get balances
                const accountWallets = await Promise.all(accounts.map(async (account, index) => {
                    const balance = await account.balance();
                    const massaBalance = Number(balance) / 1000000000;
                    
                    return {
                        name: account.accountName,
                        address: account.address,
                        balance: massaBalance
                    };
                }));

                console.log('Step 4: Available accounts with balances:', accountWallets);
                setWallets(accountWallets);

                if (!currentWallet) {
                    setCurrentWallet(accountWallets[0]);
                }

                setIsWalletConnected(true);

                if (typeof window !== 'undefined') {
                    localStorage.setItem('walletState', JSON.stringify({
                        isConnected: true,
                        wallet: currentWallet || accountWallets[0],
                        wallets: accountWallets
                    }));
                }
                console.log('Step 5: Wallet connected successfully');

            } catch (error) {
                console.error('Error connecting to MassaStation:', error);
                throw new Error('MassaStation is not running. Please install or start MassaStation.');
            }

        } catch (error) {
            console.error('Error connecting wallet:', error);
            setIsWalletConnected(false);
            setCurrentWallet(null);
            setWallets([]);
            if (typeof window !== 'undefined') {
                localStorage.removeItem('walletState');
            }
            throw error;
        }
    };

    const disconnectWallet = () => {
        setIsWalletConnected(false);
        setCurrentWallet(null);
        setWallets([]);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('walletState');
        }
    };

    return (
        <WalletContext.Provider value={{
            isWalletConnected,
            currentWallet,
            wallets,
            connectWallet,
            disconnectWallet,
            setCurrentWallet
        }}>
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
}; 