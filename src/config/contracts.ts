export const CONTRACT_ADDRESS = "AS12ABXEU3pDztPbV4a7G4XkBSKr2bKjy98z4v7ZRNboifFAEjETR";

export const PRODUCERS = {
    names: ['Michel Dupont', 'Jean Robert', 'Nicolas Thomas'],
    addresses: [
        'AU1wrhqpk4pYxxTZLqQm9RbR3hDViA8TQQWSDGu4TeCR6JEC2S3F',
        'AU1q5ing9SJhX9zMGyMUp7RrCTv5FkcCvN1CmdKebNkYn7uiLpXw',
        'AU1PiEEPNRtE9GnzNrj2SDvJzF9EGB5UCj7Wfji6QB1Mugv2qBMx'
    ]
};

export const getProducerName = (address: string) => {
    const index = PRODUCERS.addresses.indexOf(address);
    return index !== -1 ? PRODUCERS.names[index] : 'Producteur non identifié';
};

export const getClientAddress = (address: string) => {
    const index = PRODUCERS.addresses.indexOf(address);
    return index !== -1 ? PRODUCERS.names[index] : 'Adresse du client :';
};

export const isProducerWallet = (address: string | undefined) => {
    if (!address) return false;
    return PRODUCERS.addresses.includes(address);
}; 
