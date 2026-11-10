import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { BrowserProvider, Contract, formatUnits } from 'ethers';
import api from '../api/client';
import { ECO_ABI, SEPOLIA_CHAIN_ID, SEPOLIA_HEX } from '../blockchain/abi';
import { useAuth } from './AuthContext';

const WalletContext = createContext(null);
export const useWallet = () => useContext(WalletContext);

// MetaMask only ever shares the PUBLIC address. We never ask for, or can see, keys or seed phrases.
export function WalletProvider({ children }) {
  const { user, setUser } = useAuth();
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [config, setConfig] = useState({ contractAddress: null, explorerBaseUrl: 'https://sepolia.etherscan.io' });
  const [ecoBalance, setEcoBalance] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const hasMetaMask = typeof window !== 'undefined' && Boolean(window.ethereum);

  useEffect(() => {
    api.get('/config').then((r) => setConfig(r.data)).catch(() => {});
  }, []);

  // Pick up an already-authorised account silently (no popup).
  useEffect(() => {
    if (!hasMetaMask) return;
    const eth = window.ethereum;
    eth.request({ method: 'eth_accounts' }).then((a) => setAccount(a[0] || null)).catch(() => {});
    eth.request({ method: 'eth_chainId' }).then((c) => setChainId(parseInt(c, 16))).catch(() => {});
    const onAccounts = (a) => setAccount(a[0] || null);
    const onChain = (c) => setChainId(parseInt(c, 16));
    eth.on?.('accountsChanged', onAccounts);
    eth.on?.('chainChanged', onChain);
    return () => {
      eth.removeListener?.('accountsChanged', onAccounts);
      eth.removeListener?.('chainChanged', onChain);
    };
  }, [hasMetaMask]);

  const isSepolia = chainId === SEPOLIA_CHAIN_ID;

  const connect = useCallback(async () => {
    if (!hasMetaMask) throw new Error('MetaMask is not installed. Install it from metamask.io and refresh this page.');
    setConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0] || null);
      const c = await window.ethereum.request({ method: 'eth_chainId' });
      setChainId(parseInt(c, 16));
      return accounts[0];
    } finally {
      setConnecting(false);
    }
  }, [hasMetaMask]);

  const switchToSepolia = useCallback(async () => {
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: SEPOLIA_HEX }] });
    } catch (e) {
      // 4902 = the network is not added to MetaMask yet
      if (e.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: SEPOLIA_HEX,
            chainName: 'Sepolia',
            nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://rpc.sepolia.org'],
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          }],
        });
      } else throw e;
    }
  }, []);

  const getSigner = useCallback(async () => {
    const provider = new BrowserProvider(window.ethereum);
    return provider.getSigner();
  }, []);

  const getContract = useCallback(
    async (withSigner = false) => {
      if (!config.contractAddress) throw new Error('The EcoChain contract address is not configured on the server yet.');
      const provider = new BrowserProvider(window.ethereum);
      return new Contract(config.contractAddress, ECO_ABI, withSigner ? await provider.getSigner() : provider);
    },
    [config.contractAddress]
  );

  const refreshBalance = useCallback(async () => {
    if (!hasMetaMask || !account || !isSepolia || !config.contractAddress) {
      setEcoBalance(null);
      return;
    }
    try {
      const c = await getContract(false);
      setEcoBalance(formatUnits(await c.balanceOf(account), 18));
    } catch {
      setEcoBalance(null);
    }
  }, [hasMetaMask, account, isSepolia, config.contractAddress, getContract]);

  useEffect(() => { refreshBalance(); }, [refreshBalance]);

  // Link wallet: sign a one-time message (free, not a transaction) so the server can
  // prove this user controls the address.
  const linkWallet = useCallback(async () => {
    const address = account || (await connect());
    const { data } = await api.get('/users/me/wallet-nonce');
    const signer = await getSigner();
    const signature = await signer.signMessage(data.message);
    const res = await api.post('/users/me/wallet', { address, signature });
    setUser(res.data.user);
    return res.data.user;
  }, [account, connect, getSigner, setUser]);

  const value = useMemo(
    () => ({
      hasMetaMask, account, chainId, isSepolia, connecting, config, ecoBalance,
      connect, switchToSepolia, getContract, getSigner, refreshBalance, linkWallet,
      linkedAddress: user?.walletAddress || null,
      matchesLinked: Boolean(account && user?.walletAddress && account.toLowerCase() === user.walletAddress.toLowerCase()),
    }),
    [hasMetaMask, account, chainId, isSepolia, connecting, config, ecoBalance, connect, switchToSepolia, getContract, getSigner, refreshBalance, linkWallet, user]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export const shortAddr = (a) => (a ? `${a.slice(0, 6)}...${a.slice(-4)}` : '');
