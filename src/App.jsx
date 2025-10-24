import React, { useState, useEffect } from 'react';
import { Wallet, Send, Plus, Trash2, Upload, Download, AlertCircle, CheckCircle2, Droplet, X } from 'lucide-react';

const BASE_CHAIN_ID = '0x2105';
const BASE_TESTNET_CHAIN_ID = '0x14A34';
const WALLETCONNECT_PROJECT_ID = '81c2a9b2a132b0e50a0f527e62538862';
const SERVICE_FEE_WALLET = '0x75F387d2351785174f20474308C71E578feFCFF6';

function BatchSenderDApp() {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [walletType, setWalletType] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [chainId, setChainId] = useState('');
  const [networkName, setNetworkName] = useState('');
  const [provider, setProvider] = useState(null);
  const [recipients, setRecipients] = useState([{ address: '', amount: '' }]);
  const [sending, setSending] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [totalAmount, setTotalAmount] = useState('0');
  const [web3Modal, setWeb3Modal] = useState(null);

  useEffect(() => {
    initWeb3Modal();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [recipients]);

  const initWeb3Modal = async () => {
    try {
      // Load Web3Modal and WalletConnect scripts
      await loadScripts();
      
      // Wait a bit for scripts to be available
      setTimeout(() => {
        if (window.Web3Modal && window.WalletConnectProvider) {
          const providerOptions = {
            walletconnect: {
              package: window.WalletConnectProvider.default,
              options: {
                projectId: WALLETCONNECT_PROJECT_ID,
                chains: [parseInt(BASE_TESTNET_CHAIN_ID, 16), parseInt(BASE_CHAIN_ID, 16)],
                showQrModal: true,
                qrModalOptions: {
                  themeMode: 'dark'
                }
              }
            }
          };

          const modal = new window.Web3Modal.default({
            cacheProvider: false,
            providerOptions,
            theme: 'dark'
          });

          setWeb3Modal(modal);
          setStatus({ type: 'success', message: 'Ready to connect!' });
        }
      }, 1000);
    } catch (error) {
      console.error('Init error:', error);
      setStatus({ type: 'info', message: 'Loading wallet connection...' });
    }
  };

  const loadScripts = () => {
    return new Promise((resolve) => {
      // Load Web3Modal
      const web3ModalScript = document.createElement('script');
      web3ModalScript.src = 'https://unpkg.com/web3modal@1.9.12/dist/index.js';
      web3ModalScript.onload = () => {
        // Load WalletConnect Provider
        const wcScript = document.createElement('script');
        wcScript.src = 'https://unpkg.com/@walletconnect/web3-provider@1.8.0/dist/umd/index.min.js';
        wcScript.onload = () => resolve();
        document.head.appendChild(wcScript);
      };
      document.head.appendChild(web3ModalScript);
    });
  };

  const getNetworkName = (id) => {
    if (id === BASE_CHAIN_ID) return 'Base Mainnet';
    if (id === BASE_TESTNET_CHAIN_ID) return 'Base Sepolia';
    return 'Unknown Network';
  };

  const connectWallet = async () => {
    if (!web3Modal) {
      setStatus({ type: 'error', message: 'Please wait, loading connection...' });
      return;
    }

    try {
      setStatus({ type: 'info', message: 'Opening wallet selector...' });
      
      const instance = await web3Modal.connect();
      
      // Check if it's a WalletConnect provider
      if (instance.wc || instance.connector) {
        setWalletType('WalletConnect');
      } else if (instance.isMetaMask) {
        setWalletType('MetaMask');
      } else {
        setWalletType('Web3 Wallet');
      }

      // Get accounts
      const accounts = await instance.enable();
      const currentChainId = await instance.request({ method: 'eth_chainId' });

      setProvider(instance);
      setConnected(true);
      setAccount(accounts[0]);
      setChainId(currentChainId);
      setNetworkName(getNetworkName(currentChainId));
      setShowWalletModal(false);

      // Setup event listeners
      instance.on('accountsChanged', (accs) => {
        if (accs.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accs[0]);
        }
      });

      instance.on('chainChanged', (newChainId) => {
        setChainId(newChainId);
        setNetworkName(getNetworkName(newChainId));
      });

      instance.on('disconnect', () => {
        disconnectWallet();
      });

      if (currentChainId !== BASE_CHAIN_ID && currentChainId !== BASE_TESTNET_CHAIN_ID) {
        setStatus({ type: 'error', message: 'Please switch to Base network' });
      } else {
        setStatus({ type: 'success', message: 'Wallet connected successfully!' });
      }
    } catch (error) {
      console.error('Connection error:', error);
      setStatus({ type: 'error', message: 'Failed to connect wallet' });
    }
  };

  const disconnectWallet = async () => {
    try {
      if (web3Modal) {
        await web3Modal.clearCachedProvider();
      }
      if (provider && provider.disconnect) {
        await provider.disconnect();
      }
      setConnected(false);
      setAccount('');
      setWalletType('');
      setProvider(null);
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

    setStatus({ type: 'info', message: 'Processing service fee...' });
    
    try {
      const gasPrice = await provider.request({
        method: 'eth_gasPrice',
        params: [],
      });

      const gasUsed = 21000;
      const feeAmount = (BigInt(gasPrice) * BigInt(gasUsed)).toString();
      const totalFee = (BigInt(feeAmount) * BigInt(recipients.length)).toString();
      const feeWei = '0x' + BigInt(totalFee).toString(16);

      await provider.request({
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
              <button onClick={() => setShowWalletModal(false)} className="absolute top-4 right-4 text-white/60 hover:text-white">
                <X size={24} />
              </button>
              
              <h2 className="text-2xl font-bold text-white mb-2">Connect Wallet</h2>
              <p className="text-white/60 text-sm mb-6">Choose your preferred wallet</p>
              
              <button onClick={connectWallet} className="w-full flex items-center gap-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/50 rounded-xl p-6 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Wallet size={28} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-semibold text-lg">Connect Wallet</p>
                  <p className="text-white/60 text-sm">MetaMask, WalletConnect, Coinbase & more</p>
                </div>
              </button>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white/70 text-xs">
                  <strong className="text-white">300+ wallets supported</strong><br/>
                  MetaMask, Trust Wallet, Coinbase Wallet, Ledger, and many more
                </p>
              </div>
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
              <button onClick={() => setShowWalletModal(true)} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 shadow-lg">
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
              <button onClick={() => chainId !== BASE_CHAIN_ID && switchToBase()} className={`flex-1 py-4 rounded-xl font-semibold ${
                  chainId === BASE_CHAIN_ID ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}>
                <div className="flex flex-col items-center">
                  <span className="text-lg">🔵 Base Mainnet</span>
                  <span className="text-xs mt-1">Production</span>
                </div>
              </button>
              <button onClick={() => chainId !== BASE_TESTNET_CHAIN_ID && switchToBase()} className={`flex-1 py-4 rounded-xl font-semibold ${
                  chainId === BASE_TESTNET_CHAIN_ID ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg' : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}>
                <div className="flex flex-col items-center">
                  <span className="text-lg">🟣 Base Sepolia</span>
                  <span className="text-xs mt-1">Testnet</span>
                </div>
              </button>
            </div>

            {chainId === BASE_TESTNET_CHAIN_ID && (
              <div className="bg-cyan-500/10 rounded-xl p-4 border border-cyan-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
                      <Droplet size={18} className="text-cyan-300" />
                      Need Test ETH?
                    </h3>
                    <p className="text-white/70 text-sm">Get free test ETH</p>
                  </div>
                  <button onClick={claimFaucetTokens} disabled={claiming} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 ml-4">
                    <Droplet size={18} />
                    {claiming ? 'Opening...' : 'Get ETH'}
                  </button>
                </div>
              </div>
            )}

            {chainId === BASE_CHAIN_ID && (
              <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/30">
                <p className="text-orange-300 text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span><strong>Mainnet Active:</strong> Using real ETH</span>
                </p>
              </div>
            )}
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Recipients</h2>
            <div className="flex gap-2">
              <label className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg cursor-pointer hover:bg-white/20">
                <Upload size={18} className="text-white" />
                <span className="text-white text-sm">Import</span>
                <input type="file" accept=".csv" onChange={importCSV} className="hidden" />
              </label>
              <button onClick={exportCSV} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20">
                <Download size={18} className="text-white" />
                <span className="text-white text-sm">Export</span>
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recipients.map((recipient, index) => (
              <div key={index} className="flex gap-2">
                <input type="text" value={recipient.address} onChange={(e) => updateRecipient(index, 'address', e.target.value)} placeholder="Address (0x...)" className="flex-1 bg-white/10 text-white border border-white/20 rounded-xl px-4 py-3 placeholder-white/50 focus:outline-none focus:border-purple-500" />
                <input type="number" value={recipient.amount} onChange={(e) => updateRecipient(index, 'amount', e.target.value)} placeholder="Amount" step="0.000001" className="w-32 bg-white/10 text-white border border-white/20 rounded-xl px-4 py-3 placeholder-white/50 focus:outline-none focus:border-purple-500" />
                <button onClick={() => removeRecipient(index)} className="bg-red-500/20 text-red-300 p-3 rounded-xl hover:bg-red-500/30">
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>

          <button onClick={addRecipient} className="w-full mt-4 flex items-center justify-center gap-2 bg-white/10 text-white py-3 rounded-xl hover:bg-white/20 border border-white/20">
            <Plus size={20} />
            Add Recipient
          </button>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-white/70 text-sm">Total Recipients</p>
              <p className="text-white text-2xl font-bold">{recipients.length}</p>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-sm">Total ETH</p>
              <p className="text-white text-2xl font-bold">{totalAmount}</p>
            </div>
          </div>

          <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30 mb-4">
            <p className="text-blue-300 text-sm">
              <strong>💰 Service Fee:</strong> Gas fee × {recipients.length}
            </p>
            <p className="text-blue-200/70 text-xs mt-2">
              Fee: {SERVICE_FEE_WALLET.slice(0, 6)}...{SERVICE_FEE_WALLET.slice(-4)}
            </p>
          </div>
          
          <button onClick={sendBatch} disabled={sending || !connected} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 shadow-lg disabled:opacity-50">
            <Send size={20} />
            {sending ? 'Sending...' : 'Send Batch ETH'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BatchSenderDApp;
