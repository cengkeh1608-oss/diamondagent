# DIAMONDAGENT

**DIAMONDAGENT** is a generative pixel-art PFP collection on BNB Chain (BSC), built for the Binance Agent ID community.

Flag-bearing agent characters with a diamond emblem — 2,222 unique NFTs, free to mint for Agent ID holders, each carrying a claim to the $DAG community token.

## Collection

| Item | Value |
|---|---|
| Standard | ERC-721 (BNB Chain) |
| Supply | 2,222 NFTs |
| Mint price | Free (gas only), gated by Agent ID |
| Max per wallet | 2 |
| Art | Generative pixel art — 6 trait layers, ±483,840 combinations |
| Rarity tiers | Common 55% · Rare 27% · Epic 12% · Legendary 5% · Mythic 1% |

Trait layers: Background (12) × Species (8) × Outfit (14) × Headgear (12) × Eyes (6) × Flag (5). The flag marks the tier — gold for Legendary, a word-art mosaic for the 22 Mythic pieces.

## $DAG Token

| Item | Value |
|---|---|
| Standard | ERC-20 (BNB Chain) |
| Total supply | 222,200,000 DAG (fixed, minted once) |
| Holder claim | 40% — **40,000 DAG per NFT**, one claim per token ID |
| Liquidity | 20% |
| Treasury | 20% |
| Community | 20% |
| Claim fee | 0.00015 BNB per NFT, forwarded to treasury |

$DAG is a community token. Nothing here is financial advice, and no value or price is promised.

## Contracts

| Contract | Purpose |
|---|---|
| `contracts/DiamondAgent.sol` | ERC-721 collection — free mint, Agent ID gate (registry `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F`), max 2/wallet, owner-controlled mint window and one-time reveal |
| `contracts/DAGToken.sol` | ERC-20 — fixed supply of 222,200,000 DAG minted once at deployment, no further minting |
| `contracts/DAGClaim.sol` | Per-NFT claim of 40,000 DAG with a 0.00015 BNB fee forwarded to treasury; reentrancy-guarded, one claim per token ID |

Written from scratch on OpenZeppelin (solc 0.8.26). Local mainnet-fork test suite: **20/20 passing**. Contracts will be verified on Sourcify at mainnet deployment.

## Status

🚧 **In development — not yet deployed to mainnet.**

- ✅ Specs locked, contracts written and fork-tested
- 🚧 Art production in progress (style approval pending)
- ⬜ BSC testnet deployment and end-to-end mint test
- ⬜ Website (mint + claim), IPFS upload
- ⬜ Mainnet deployment + Sourcify verification
- ⬜ Free mint opens (Agent ID holders)

Full design document: [`docs/BLUEPRINT.md`](docs/BLUEPRINT.md)

## Development

```bash
npm install
npx hardhat compile
```

## License

MIT
