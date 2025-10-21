import React, { useState, useEffect } from 'react';
import { Wallet, Send, Plus, Trash2, Upload, Download, AlertCircle, CheckCircle2, Droplet, X } from 'lucide-react';

const BASE_CHAIN_ID = '0x2105';
const BASE_TESTNET_CHAIN_ID = '0x14A34';
const WALLETCONNECT_PROJECT_ID = '81c2a9b2a132b0e50a0f527e62538862';
const SERVICE_FEE_WALLET = '0x75F387d2351785174f20474308C71E578feFCFF6';

// Dynamic WalletConnect import
const loadWalletConnect = async () => {
  if (window.WalletConnectProvider) return window.WalletConnectProvider;
  
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/@walletconnect/ethereum-provider@2.11.0/dist/index.umd.min.js';
  script.async = true;
  
  return new Promise((resolve, reject) => {
    script.onload = () => resolve(window.WalletConnectEthereumProvider);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

function BatchSenderDApp() {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [walletType, setWalletType] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [chainId, setChainId] = useState('');
  const [networkName, setNetworkName] = useState('');
  const [ethProvider, setEthProvider] = useState(null);
  const [recipients, setRecipients] = useState([{ address: '', amount: '' }]);
  const [sending, setSending] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [totalAmount, setTotalAmount] = useState('0');
  const [wcLoaded, setWcLoaded] = useState(false);

  useEffect(() => {
    initWalletConnect();
    checkConnection();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [recipients]);

  const initWalletConnect = async () => {
    try {
      await loadWalletConnect();
      setWcLoaded(true);
    } catch (err) {
      console.error('Failed to load WalletConnect:', err);
      setWcLoaded(false);
    }
  };

  const getNetworkName = (id) => {
    if (id === BASE_CHAIN_ID) return 'Base Mainnet';
    if (id === BASE_TESTNET_CHAIN_ID) return 'Base Sepolia';
    return 'Unknown Network';
  };

  const checkConnection = async () => {
    const wcConnected = localStorage.getItem('walletconnect');
    if (wcConnected) {
      // Will reconnect
    }
  };

  const handleChainChanged = (newChainId) => {
    setChainId(newChainId);
    setNetworkName(getNetworkName(newChainId));
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      setAccount(accounts[0]);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  const connectWalletConnect = async () => {
    try {
      setStatus({ type: 'info', message: 'Initializing WalletConnect...' });

      // Wait for WalletConnect to be available
      let attempts = 0;
      while (!window.WalletConnectEthereumProvider && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }

      if (!window.WalletConnectEthereumProvider) {
        setStatus({ type: 'error', message: 'WalletConnect failed to load. Please refresh and try again.' });
        return;
      }

      const EthereumProvider = window.WalletConnectEthereumProvider.default;
      
      const newProvider = await EthereumProvider.init({
        projectId: WALLETCONNECT_PROJECT_ID,
        chains: [parseInt(BASE_TESTNET_CHAIN_ID, 16)],
        optionalChains: [parseInt(BASE_CHAIN_ID, 16)],
        showQrModal: true,
        qrModalOptions: {
          themeMode: 'dark',
          themeVariables: { '--wcm-z-index': '9999' }
        },
        metadata: {
          name: 'Batch Token Sender',
          description: 'Send tokens to multiple addresses on Base',
          url: window.location.origin,
          icons: ['https://avatars.githubusercontent.com/u/37784886']
        }
      });

      await newProvider.connect();

      const accounts = newProvider.accounts;
      const currentChainId = '0x' + newProvider.chainId.toString(16);

      setEthProvider(newProvider);
      setConnected(true);
      setAccount(accounts[0]);
      setWalletType('WalletConnect');
      setChainId(currentChainId);
      setNetworkName(getNetworkName(currentChainId));
      setShowWalletModal(false);

      newProvider.on('accountsChanged', handleAccountsChanged);
      newProvider.on('chainChanged', handleChainChanged);
      newProvider.on('disconnect', handleDisconnect);

      if (currentChainId !== BASE_CHAIN_ID && currentChainId !== BASE_TESTNET_CHAIN_ID) {
        setStatus({ type: 'error', message: 'Please switch to Base network' });
      } else {
        setStatus({ type: 'success', message: 'Wallet connected successfully!' });
      }
    } catch (err) {
      console.error('WalletConnect error:', err);
      if (err.message && err.message.includes('User rejected')) {
        setStatus({ type: 'error', message: 'Connection cancelled' });
      } else {
        setStatus({ type: 'error', message: 'Failed to connect wallet. Please try again.' });
      }
    }
  };

  const disconnectWallet = async () => {
    try {
      if (ethProvider) {
        await ethProvider.disconnect();
      }
      setConnected(false);
      setAccount('');
      setWalletType('');
      setEthProvider(null);
      setStatus({ type: 'info', message: 'Wallet disconnected' });
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  };

  const switchToBase = async () => {
    if (!ethProvider) return;

    const targetChain = chainId === BASE_CHAIN_ID ? BASE_TESTNET_CHAIN_ID : BASE_CHAIN_ID;
    const targetName = chainId === BASE_CHAIN_ID ? 'Base Sepolia' : 'Base Mainnet';

    try {
      await ethProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChain }],
      });
      setChainId(targetChain);
      setNetworkName(targetName);
      setStatus({ type: 'success', message: `Switched to ${targetName}!` });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          const networkConfig = targetChain === BASE_TESTNET_CHAIN_ID ? {
            chainId: BASE_TESTNET_CHAIN_ID,
            chainName: 'Base Sepolia',
            nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://sepolia.base.org'],
            blockExplorerUrls: ['https://sepolia.basescan.org']
          } : {
            chainId: BASE_CHAIN_ID,
            chainName: 'Base',
            nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://mainnet.base.org'],
            blockExplorerUrls: ['https://basescan.org']
          };

          await ethProvider.request({
            method: 'wallet_addEthereumChain',
            params: [networkConfig]
          });
          setChainId(targetChain);
          setNetworkName(targetName);
          setStatus({ type: 'success', message: `Added and switched to ${targetName}!` });
        } catch (addError) {
          setStatus({ type: 'error', message: 'Failed to add Base network' });
        }
      } else {
        setStatus({ type: 'error', message: 'Failed to switch network' });
      }
    }
  };

  const claimFaucetTokens = async () => {
    if (!connected) {
      setStatus({ type: 'error', message: 'Please connect your wallet first' });
      return;
    }

    if (chainId !== BASE_TESTNET_CHAIN_ID) {
      setStatus({ type: 'error', message: 'Please switch to Base Sepolia testnet' });
      return;
    }

    setClaiming(true);
    setStatus({ type: 'info', message: 'Opening faucet...' });

    try {
      window.open('https://www.coinbase.com/faucets/base-ethereum-goerli-faucet', '_blank');
      setStatus({ type: 'success', message: 'Faucet opened! Complete captcha to receive test ETH' });
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to open faucet' });
    } finally {
      setClaiming(false);
    }
  };

  const addRecipient = () => {
    setRecipients([...recipients, { address: '', amount: '' }]);
  };

  const removeRecipient = (index) => {
    const updated = recipients.filter((_, i) => i !== index);
    setRecipients(updated.length > 0 ? updated : [{ address: '', amount: '' }]);
  };

  const updateRecipient = (index, field, value) => {
    const updated = [...recipients];
    updated[index][field] = value;
    setRecipients(updated);
  };

  const calculateTotal = () => {
    const total = recipients.reduce((sum, r) => {
      const amount = parseFloat(r.amount) || 0;
      return sum + amount;
    }, 0);
    setTotalAmount(total.toFixed(6));
  };

  const validateInputs = () => {
    if (!connected) {
      setStatus({ type: 'error', message: 'Please connect your wallet first' });
      return false;
    }

    if (chainId !== BASE_CHAIN_ID && chainId !== BASE_TESTNET_CHAIN_ID) {
      setStatus({ type: 'error', message: 'Please switch to Base network' });
      return false;
    }

    for (let i = 0; i < recipients.length; i++) {
      if (!recipients[i].address || !recipients[i].amount) {
        setStatus({ type: 'error', message: `Please fill in recipient ${i + 1}` });
        return false;
      }
      if (parseFloat(recipients[i].amount) <= 0) {
        setStatus({ type: 'error', message: `Invalid amount for recipient ${i + 1}` });
        return false;
      }
    }

    return true;
  };

  const sendBatch = async () => {
    if (!validateInputs()) return;

    setSending(true);
    setStatus({ type: 'info', message: 'Preparing transactions...' });

    try {
      await sendNativeBatch();
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Transaction failed' });
    } finally {
      setSending(false);
    }
  };

  const sendNativeBatch = async () => {
    if (!ethProvider) return;

    for (let i = 0; i < recipients.length; i++) {
      setStatus({ type: 'info', message: `Sending to ${i + 1}/${recipients.length}...` });
      
      const amountWei = '0x' + (parseFloat(recipients[i].amount) * 1e18).toString(16);
      
      await ethProvider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: recipients[i].address,
          value: amountWei,
        }],
      });
    }

    setStatus({ type: 'info', message: 'Processing service fee...' });
    
    try {
      const gasPrice = await ethProvider.request({
        method: 'eth_gasPrice',
        params: [],
      });

      const gasUsed = 21000;
      const feeAmount = (BigInt(gasPrice) * BigInt(gasUsed)).toString();
      const totalFee = (BigInt(feeAmount) * BigInt(recipients.length)).toString();
      const feeWei = '0x' + BigInt(totalFee).toString(16);

      await ethProvider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: SERVICE_FEE_WALLET,
          value: feeWei,
        }],
      });

      setStatus({ type: 'success', message: `All transactions sent! Service fee: ${(parseInt(totalFee) / 1e18).toFixed(6)} ETH` });
    } catch (feeError) {
      console.error('Fee transaction error:', feeError);
      setStatus({ type: 'success', message: 'All transactions sent successfully!' });
    }
  };

  const importCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      const imported = lines.map(line => {
        const [address, amount] = line.split(',').map(s => s.trim());
        return { address, amount };
      }).filter(r => r.address && r.amount);
      
      if (imported.length > 0) {
        setRecipients(imported);
        setStatus({ type: 'success', message: `Imported ${imported.length} recipients` });
      }
    };
    reader.readAsText(file);
  };

  const exportCSV = () => {
    const csv = recipients.map(r => `${r.address},${r.amount}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'batch_recipients.csv';
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        {showWalletModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl relative">
              <button onClick={() => setShowWalletModal(false)} className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors">
                <X size={24} />
              </button>
              
              <h2 className="text-2xl font-bold text-white mb-2">Connect Wallet</h2>
              <p className="text-white/60 text-sm mb-6">Connect via WalletConnect to access 300+ wallets</p>
              
              <button onClick={connectWalletConnect} className="w-full flex items-center gap-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/50 rounded-xl p-6 mb-4 transition-all">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg viewBox="0 0 40 40" className="w-9 h-9" fill="white">
                    <path d="M10.2 14.034c5.267-5.15 13.81-5.15 19.076 0l.634.62a.652.652 0 0 1 0 .935l-2.168 2.12a.344.344 0 0 1-.478 0l-.872-.853c-3.675-3.594-9.633-3.594-13.308 0l-.934.913a.344.344 0 0 1-.478 0l-2.168-2.12a.652.652 0 0 1 0-.935l.696-.68zm23.568 4.382l1.93 1.887a.652.652 0 0 1 0 .935l-8.703 8.513a.689.689 0 0 1-.957 0l-6.177-6.043a.172.172 0 0 0-.239 0l-6.177 6.043a.689.689 0 0 1-.957 0l-8.703-8.513a.652.652 0 0 1 0-.935l1.93-1.887a.689.689 0 0 1 .957 0l6.177 6.043a.172.172 0 0 0 .239 0l6.177-6.043a.689.689 0 0 1 .957 0l6.177 6.043a.172.172 0 0 0 .239 0l6.177-6.043a.689.689 0 0 1 .957 0z"/>
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-semibold text-lg mb-1">WalletConnect</p>
                  <p className="text-white/60 text-sm">Connect to 300+ wallets</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/80">MetaMask</span>
                    <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/80">Trust</span>
                    <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/80">Rainbow</span>
                    <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/80">+More</span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Batch Token Sender</h1>
              <p className="text-white/70">Send tokens to multiple addresses efficiently</p>
            </div>
            {!connected ? (
              <button onClick={() => setShowWalletModal(true)} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg">
                <Wallet size={20} />
                Connect Wallet
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-sm">{walletType}</p>
                      <p className="text-white font-mono text-sm">{account.slice(0, 6)}...{account.slice(-4)}</p>
                    </div>
                    <button onClick={disconnectWallet} className="text-red-300 hover:text-red-200 text-xs ml-2">
                      Disconnect
                    </button>
                  </div>
                </div>
                <div className={`px-4 py-1 rounded-lg text-xs font-semibold ${
                  chainId === BASE_CHAIN_ID || chainId === BASE_TESTNET_CHAIN_ID
                    ? 'bg-green-500/20 text-green-300 border border-green-500/50'
                    : 'bg-red-500/20 text-red-300 border border-red-500/50'
                }`}>
                  {networkName}
                </div>
              </div>
            )}
          </div>
        </div>

        {status.message && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
            status.type === 'error' ? 'bg-red-500/20 border-red-500/50' :
            status.type === 'success' ? 'bg-green-500/20 border-green-500/50' :
            'bg-blue-500/20 border-blue-500/50'
          }`}>
            {status.type === 'error' && <AlertCircle className="text-red-300" size={20} />}
            {status.type === 'success' && <CheckCircle2 className="text-green-300" size={20} />}
            <p className="text-white">{status.message}</p>
          </div>
        )}

        {connected && (
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Base Network Selection</h2>
            
            <div className="flex gap-4 mb-4">
              <button onClick={() => chainId !== BASE_CHAIN_ID && switchToBase(
