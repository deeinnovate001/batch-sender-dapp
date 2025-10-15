import React, { useState, useEffect } from 'react';
import { Wallet, Send, Plus, Trash2, Upload, Download, AlertCircle, CheckCircle2, Droplet, X } from 'lucide-react';

// NOTE: To use this component, add WalletConnect to your HTML:
// <script src="https://cdn.jsdelivr.net/npm/@walletconnect/ethereum-provider@2.11.0/dist/index.umd.js"></script>
// Or install via npm: npm install @walletconnect/ethereum-provider
// Get your project ID from: https://cloud.walletconnect.com

const BASE_CHAIN_ID = '0x2105'; // Base Mainnet: 8453
const BASE_TESTNET_CHAIN_ID = '0x14A34'; // Base Sepolia: 84532
const WALLETCONNECT_PROJECT_ID = '81c2a9b2a132b0e50a0f527e62538862';
const SERVICE_FEE_WALLET = '0x75F387d2351785174f20474308C71E578feFCFF6'; // Service fee recipient wallet

export default function BatchSenderDApp() {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [walletType, setWalletType] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [chainId, setChainId] = useState('');
  const [networkName, setNetworkName] = useState('');
  const [provider, setProvider] = useState(null);
  const [wcProvider, setWcProvider] = useState(null);
  const [recipients, setRecipients] = useState([{ address: '', amount: '' }]);
  const [sending, setSending] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [totalAmount, setTotalAmount] = useState('0');
  const [provider, setProvider] = useState(null);
  const [wcProvider, setWcProvider] = useState(null);

  useEffect(() => {
    checkConnection();
    loadWalletConnect();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [recipients]);

  const loadWalletConnect = async () => {
    // WalletConnect will be initialized when user clicks connect
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

  const getNetworkName = (id) => {
    switch (id) {
      case BASE_CHAIN_ID:
        return 'Base Mainnet';
      case BASE_TESTNET_CHAIN_ID:
        return 'Base Sepolia';
      default:
        return 'Unknown Network';
    }
  };

  const checkConnection = async () => {
    // Check if already connected via WalletConnect
    const wcConnected = localStorage.getItem('walletconnect');
    if (wcConnected) {
      // Will reconnect via WalletConnect
    }
  };

  const connectWalletConnect = async () => {
    try {
      setStatus({ type: 'info', message: 'Initializing WalletConnect...' });

      // Check if WalletConnect is loaded
      if (!window.WalletConnectEthereumProvider) {
        setStatus({ 
          type: 'error', 
          message: 'WalletConnect not loaded. Please add the script to your page.' 
        });
        return;
      }

      const EthereumProvider = window.WalletConnectEthereumProvider.default;
      
      const provider = await EthereumProvider.init({
        projectId: WALLETCONNECT_PROJECT_ID,
        chains: [parseInt(BASE_TESTNET_CHAIN_ID, 16)],
        optionalChains: [parseInt(BASE_CHAIN_ID, 16)],
        showQrModal: true,
        qrModalOptions: {
          themeMode: 'dark',
          themeVariables: {
            '--wcm-z-index': '9999'
          }
        },
        metadata: {
          name: 'Batch Token Sender',
          description: 'Send tokens to multiple addresses on Base',
          url: window.location.origin,
          icons: ['https://avatars.githubusercontent.com/u/37784886']
        }
      });

      // Enable session (triggers QR Code modal)
      await provider.connect();

      const accounts = provider.accounts;
      const currentChainId = '0x' + provider.chainId.toString(16);

      setWcProvider(provider);
      setProvider(provider);
      setConnected(true);
      setAccount(accounts[0]);
      setWalletType('WalletConnect');
      setChainId(currentChainId);
      setNetworkName(getNetworkName(currentChainId));
      setShowWalletModal(false);

      // Subscribe to events
      provider.on('accountsChanged', handleAccountsChanged);
      provider.on('chainChanged', handleChainChanged);
      provider.on('disconnect', handleDisconnect);

      // Check if on correct network
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
        setStatus({ type: 'error', message: 'Failed to connect wallet' });
      }
    }
  };

  const disconnectWallet = async () => {
    try {
      if (wcProvider) {
        await wcProvider.disconnect();
      }
      setConnected(false);
      setAccount('');
      setWalletType('');
      setProvider(null);
      setWcProvider(null);
      setStatus({ type: 'info', message: 'Wallet disconnected' });
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  };

  const switchToBase = async () => {
    if (!provider) return;

    const targetChain = chainId === BASE_CHAIN_ID ? BASE_TESTNET_CHAIN_ID : BASE_CHAIN_ID;
    const targetName = chainId === BASE_CHAIN_ID ? 'Base Sepolia' : 'Base Mainnet';

    try {
      await provider.request({
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

          await provider.request({
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
    setStatus({ type: 'info', message: 'Claiming test tokens...' });

    try {
      // Open Base Sepolia faucet
      window.open('https://www.coinbase.com/faucets/base-ethereum-goerli-faucet', '_blank');
      setStatus({ 
        type: 'success', 
        message: 'Faucet opened! Complete the captcha to receive test ETH on Base Sepolia' 
      });
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
    if (!provider) return;

    for (let i = 0; i < recipients.length; i++) {
      setStatus({ type: 'info', message: `Sending to ${i + 1}/${recipients.length}...` });
      
      const amountWei = '0x' + (parseFloat(recipients[i].amount) * 1e18).toString(16);
      
      await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: recipients[i].address,
          value: amountWei,
        }],
      });
    }

    // Send service fee to fee wallet
    setStatus({ type: 'info', message: 'Processing service fee...' });
    
    try {
      // Get current gas price
      const gasPrice = await provider.request({
        method: 'eth_gasPrice',
        params: [],
      });

      // Estimate gas for a typical transaction (21000 for native transfer)
      const gasUsed = 21000;
      const feeAmount = (BigInt(gasPrice) * BigInt(gasUsed)).toString();
      
      // Send fee for each transaction
      const totalFee = (BigInt(feeAmount) * BigInt(recipients.length)).toString();
      
      const feeWei = '0x' + totalFee;

      await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: SERVICE_FEE_WALLET,
          value: feeWei,
        }],
      });

      setStatus({ type: 'success', message: `All transactions sent successfully! Service fee collected: ${(parseInt(totalFee) / 1e18).toFixed(6)} ETH` });
    } catch (feeError) {
      console.error('Fee transaction error:', feeError);
      setStatus({ type: 'success', message: 'All transactions sent! (Fee transaction optional)' });
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
        {/* Wallet Connection Modal */}
        {showWalletModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl relative">
              <button
                onClick={() => setShowWalletModal(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              
              <h2 className="text-2xl font-bold text-white mb-2">Connect Wallet</h2>
              <p className="text-white/60 text-sm mb-6">Connect via WalletConnect to access 300+ wallets</p>
              
              {/* WalletConnect Option */}
              <button
                onClick={connectWalletConnect}
                className="w-full flex items-center gap-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/50 rounded-xl p-6 mb-4 transition-all group"
              >
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
                    <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/80">Coinbase</span>
                    <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/80">+More</span>
                  </div>
                </div>
              </button>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white/70 text-xs leading-relaxed">
                  <strong className="text-white">Popular wallets supported:</strong><br/>
                  MetaMask, Trust Wallet, Rainbow, Coinbase Wallet, Ledger Live, Argent, Safe, Zerion, 1inch, Phantom, and 290+ more wallets
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Batch Token Sender</h1>
              <p className="text-white/70">Send tokens to multiple addresses efficiently</p>
            </div>
            {!connected ? (
              <button
                onClick={() => setShowWalletModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg"
              >
                <Wallet size={20} />
                Connect Wallet
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20">
                  <p className="text-white/70 text-sm">{walletType}</p>
                  <p className="text-white font-mono text-sm">{account.slice(0, 6)}...{account.slice(-4)}</p>
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

        {/* Status Message */}
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

        {/* Network Selection & Faucet */}
        {connected && (
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Base Network Selection</h2>
            
            {/* Network Toggle */}
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => chainId !== BASE_CHAIN_ID && switchToBase()}
                className={`flex-1 py-4 rounded-xl font-semibold transition-all ${
                  chainId === BASE_CHAIN_ID
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-lg">🔵 Base Mainnet</span>
                  <span className="text-xs mt-1">Production Network</span>
                </div>
              </button>
              <button
                onClick={() => chainId !== BASE_TESTNET_CHAIN_ID && switchToBase()}
                className={`flex-1 py-4 rounded-xl font-semibold transition-all ${
                  chainId === BASE_TESTNET_CHAIN_ID
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-lg">🟣 Base Sepolia</span>
                  <span className="text-xs mt-1">Test Network</span>
                </div>
              </button>
            </div>

            {/* Faucet Section - Only for Sepolia */}
            {chainId === BASE_TESTNET_CHAIN_ID && (
              <div className="bg-cyan-500/10 rounded-xl p-4 border border-cyan-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
                      <Droplet size={18} className="text-cyan-300" />
                      Need Test ETH?
                    </h3>
                    <p className="text-white/70 text-sm">
                      Get free test ETH from the Base Sepolia faucet
                    </p>
                  </div>
                  <button
                    onClick={claimFaucetTokens}
                    disabled={claiming}
                    className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ml-4"
                  >
                    <Droplet size={18} />
                    {claiming ? 'Opening...' : 'Get Test ETH'}
                  </button>
                </div>
              </div>
            )}

            {/* Warning for Mainnet */}
            {chainId === BASE_CHAIN_ID && (
              <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/30">
                <p className="text-orange-300 text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span><strong>Mainnet Active:</strong> You are using real ETH. Double-check all addresses before sending.</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Recipients */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Recipients</h2>
            <div className="flex gap-2">
              <label className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg cursor-pointer hover:bg-white/20 transition-all">
                <Upload size={18} className="text-white" />
                <span className="text-white text-sm">Import CSV</span>
                <input type="file" accept=".csv" onChange={importCSV} className="hidden" />
              </label>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-all"
              >
                <Download size={18} className="text-white" />
                <span className="text-white text-sm">Export</span>
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recipients.map((recipient, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={recipient.address}
                  onChange={(e) => updateRecipient(index, 'address', e.target.value)}
                  placeholder="Recipient address (0x...)"
                  className="flex-1 bg-white/10 text-white border border-white/20 rounded-xl px-4 py-3 placeholder-white/50 focus:outline-none focus:border-purple-500"
                />
                <input
                  type="number"
                  value={recipient.amount}
                  onChange={(e) => updateRecipient(index, 'amount', e.target.value)}
                  placeholder="Amount"
                  step="0.000001"
                  className="w-32 bg-white/10 text-white border border-white/20 rounded-xl px-4 py-3 placeholder-white/50 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={() => removeRecipient(index)}
                  className="bg-red-500/20 text-red-300 p-3 rounded-xl hover:bg-red-500/30 transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addRecipient}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-white/10 text-white py-3 rounded-xl hover:bg-white/20 transition-all border border-white/20"
          >
            <Plus size={20} />
            Add Recipient
          </button>
        </div>

        {/* Summary & Send */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-white/70 text-sm">Total Recipients</p>
              <p className="text-white text-2xl font-bold">{recipients.length}</p>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-sm">Total ETH Amount</p>
              <p className="text-white text-2xl font-bold">{totalAmount} ETH</p>
            </div>
          </div>

          {/* Service Fee Info */}
          <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30 mb-4">
            <p className="text-blue-300 text-sm">
              <strong>💰 Service Fee:</strong> Network gas fee will be collected ({recipients.length} × base fee)
            </p>
            <p className="text-blue-200/70 text-xs mt-2">
              Fee Recipient: {SERVICE_FEE_WALLET.slice(0, 6)}...{SERVICE_FEE_WALLET.slice(-4)}
            </p>
          </div>
          
          <button
            onClick={sendBatch}
            disabled={sending || !connected}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
            {sending ? 'Sending ETH...' : 'Send Batch ETH'}
          </button>
        </div>

        {/* Setup Instructions */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 mt-6">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <AlertCircle size={18} />
            Setup Instructions
          </h3>
          <div className="text-white/70 text-sm space-y-2">
            <p><strong className="text-white">Step 1:</strong> Get a WalletConnect Project ID from <a href="https://cloud.walletconnect.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">cloud.walletconnect.com</a></p>
            <p><strong className="text-white">Step 2:</strong> Add this script to your HTML head:</p>
            <code className="block bg-black/30 p-3 rounded-lg text-xs overflow-x-auto">
              {`<script src="https://cdn.jsdelivr.net/npm/@walletconnect/ethereum-provider@2.11.0/dist/index.umd.js"></script>`}
            </code>
            <p><strong className="text-white">Step 3:</strong> Replace 'YOUR_PROJECT_ID' in the code with your actual project ID</p>
          </div>
        </div>
      </div>
    </div>
  );
}
