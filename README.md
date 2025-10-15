# 💸 Batch Sender DApp

A decentralized application for sending ETH to multiple addresses simultaneously on Base network with WalletConnect integration.

![Base Network](https://img.shields.io/badge/Base-Mainnet%20%26%20Sepolia-0052FF?style=for-the-badge&logo=coinbase)
![WalletConnect](https://img.shields.io/badge/WalletConnect-v2.11-3B99FC?style=for-the-badge&logo=walletconnect)
![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react)

## 🌟 Features

- 🔌 **WalletConnect Integration** - Connect with 300+ wallets (MetaMask, Trust Wallet, Rainbow, Coinbase Wallet, Ledger, and more)
- 🔵 **Base Network Support** - Full support for Base Mainnet and Base Sepolia testnet
- 💸 **Batch ETH Transfers** - Send ETH to multiple addresses in one session
- 💰 **Automatic Service Fees** - Network gas fees collected per transaction
- 📊 **CSV Import/Export** - Bulk upload recipient lists or save for later
- 🎨 **Modern UI** - Beautiful, responsive interface built with Tailwind CSS
- 🌐 **Network Switching** - Easy toggle between mainnet and testnet
- 💧 **Faucet Integration** - Direct access to Base Sepolia test ETH faucet
- ⚡ **Real-time Validation** - Address and amount validation before sending
- 📱 **Mobile Responsive** - Works perfectly on desktop and mobile devices

## 🚀 Live Demo

**Production URL:** [Your Vercel URL here]

**Test on Sepolia:** Get free test ETH from the integrated faucet

## 🛠️ Tech Stack

- **Frontend:** React 18
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS 3
- **Icons:** Lucide React
- **Web3:** WalletConnect Ethereum Provider v2.11
- **Network:** Base (Ethereum L2)

## 📋 Prerequisites

- Node.js 16+ and npm/yarn
- A WalletConnect Project ID ([Get one here](https://cloud.walletconnect.com))
- A Web3 wallet (MetaMask, Coinbase Wallet, etc.)

## 🔧 Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/batch-sender-dapp.git
cd batch-sender-dapp
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure WalletConnect

The WalletConnect Project ID is already configured in the code:
```javascript
const WALLETCONNECT_PROJECT_ID = '81c2a9b2a132b0e50a0f527e62538862';
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Build for production

```bash
npm run build
```

The build output will be in the `dist/` folder.

## 📦 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your repository
5. Configure:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. Click "Deploy"

Your DApp will be live in minutes!

### Deploy to Other Platforms

- **Netlify:** `npm run build` → Deploy `dist` folder
- **GitHub Pages:** Use `vite-plugin-pages`
- **AWS Amplify:** Connect GitHub repo
- **Cloudflare Pages:** Connect GitHub repo

## 💡 How to Use

### 1. Connect Wallet
- Click "Connect Wallet"
- Scan QR code with mobile wallet or select browser wallet
- Approve connection

### 2. Select Network
- Choose **Base Mainnet** (real ETH) or **Base Sepolia** (test ETH)
- Wallet will prompt to switch networks if needed

### 3. Get Test ETH (Sepolia only)
- On Base Sepolia, click "Get Test ETH"
- Complete captcha on faucet page
- Receive free test ETH in your wallet

### 4. Add Recipients
- Enter recipient addresses and amounts
- Click "+" to add more recipients
- Or import CSV file with format: `address,amount`

### 5. Send Batch
- Review total amount and service fee
- Click "Send Batch ETH"
- Approve each transaction in your wallet
- Wait for confirmations

## 💰 Service Fees

**Service Fee Wallet:** `0x75F387d2351785174f20474308C71E578feFCFF6`

**Fee Structure:**
- Fee = Base network gas price × 21,000 gas × number of transactions
- Example: 5 recipients = 5 × base network fee
- Fee is automatically collected after all transfers complete

**Transparency:**
- Fee amount displayed before sending
- Fee matches actual Base network costs
- No hidden charges or markups

## 📊 CSV Format

### Import Recipients

Create a CSV file with this format:

```csv
0x1234567890123456789012345678901234567890,0.5
0x2345678901234567890123456789012345678901,1.25
0x3456789012345678901234567890123456789012,0.75
```

**Format:** `address,amount` (one per line, no headers)

### Export Recipients

Click "Export CSV" to save your current recipient list for later use.

## 🔐 Security

- ✅ Non-custodial - You retain full control of your funds
- ✅ Open source - Code is publicly auditable
- ✅ No private keys stored - Everything happens in your wallet
- ✅ WalletConnect v2 - Industry-standard secure connection
- ✅ Address validation - Prevents sending to invalid addresses
- ✅ Mainnet warnings - Clear alerts when using real ETH

## 🌐 Network Details

### Base Mainnet
- **Chain ID:** 8453 (0x2105)
- **RPC URL:** https://mainnet.base.org
- **Explorer:** https://basescan.org
- **Currency:** ETH

### Base Sepolia (Testnet)
- **Chain ID:** 84532 (0x14A34)
- **RPC URL:** https://sepolia.base.org
- **Explorer:** https://sepolia.basescan.org
- **Currency:** Test ETH
- **Faucet:** https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

## 🔗 Supported Wallets

Connect with 300+ wallets including:

- 🦊 **MetaMask** - Browser extension & mobile
- 🌈 **Rainbow** - Mobile-first wallet
- 💙 **Trust Wallet** - Multi-chain mobile wallet
- 🔵 **Coinbase Wallet** - Self-custody wallet
- 🔐 **Ledger Live** - Hardware wallet support
- 🛡️ **Safe (Gnosis Safe)** - Multi-signature wallet
- ⚡ **Zerion** - DeFi portfolio tracker
- 📱 **1inch Wallet** - DEX aggregator wallet
- 🔒 **Argent** - Smart contract wallet
- And 290+ more!

## 🐛 Troubleshooting

### "WalletConnect not loading"
- Ensure the WalletConnect script is loaded in `index.html`
- Check browser console for errors
- Try refreshing the page

### "Please switch to Base network"
- Click the network toggle buttons
- Approve network switch in your wallet
- Or manually add Base network to your wallet

### "Transaction failed"
- Ensure sufficient ETH balance for transfers + gas
- Check recipient addresses are valid
- Try with smaller amounts first on testnet

### "Service fee transaction failed"
- Main transfers still succeeded
- Fee collection is optional and separate
- No impact on recipient transactions

## 📝 Project Structure

```
batch-sender-dapp/
├── index.html              # HTML entry point
├── package.json            # Dependencies and scripts
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind CSS config
├── postcss.config.js      # PostCSS config
├── .gitignore             # Git ignore rules
├── README.md              # This file
└── src/
    ├── main.jsx           # React entry point
    ├── index.css          # Global styles
    └── App.jsx            # Main DApp component
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- [Base](https://base.org) - Ethereum L2 network
- [WalletConnect](https://walletconnect.com) - Web3 connection standard
- [React](https://react.dev) - UI framework
- [Vite](https://vitejs.dev) - Build tool
- [Tailwind CSS](https://tailwindcss.com) - Styling framework

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/YOUR_USERNAME/batch-sender-dapp/issues)
- **Discussions:** [GitHub Discussions](https://github.com/YOUR_USERNAME/batch-sender-dapp/discussions)
- **Base Docs:** https://docs.base.org
- **WalletConnect Docs:** https://docs.walletconnect.com

## 🔮 Roadmap

- [ ] ERC-20 token support
- [ ] Transaction history
- [ ] Gas price customization
- [ ] Multi-chain support
- [ ] Smart contract batch sending (save gas)
- [ ] ENS name resolution
- [ ] Dark/Light theme toggle
- [ ] Multi-language support

## ⚠️ Disclaimer

This is experimental software. Use at your own risk. Always test on testnet first before using on mainnet with real funds. The developers are not responsible for any loss of funds.

---

**Built with ❤️ on Base**

[⭐ Star this repo](https://github.com/YOUR_USERNAME/batch-sender-dapp) | [🐛 Report Bug](https://github.com/YOUR_USERNAME/batch-sender-dapp/issues) | [💡 Request Feature](https://github.com/YOUR_USERNAME/batch-sender-dapp/issues)
