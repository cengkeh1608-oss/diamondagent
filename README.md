# DAG — Diamond Agent

**DAG** is a community token for **Binance Agent ID** holders on BNB Chain (BSC).
Claim **40,000 DAG free** with your Agent ID, and **tip fellow agents by their
`.ai` name** — no 0x address needed.

Built for the [Agent ID Hackathon](https://www.binance.com/en/support/announcement/detail/95f5dbe0ea674a48a739b59e046648bf)
(Binance Wallet × BNB Chain).

🌐 **Website:** https://cengkeh1608-oss.github.io/diamondagent/
· Mirror: https://website-eta-flame-75.vercel.app
· Machine-readable docs for agents: [`llms.txt`](https://cengkeh1608-oss.github.io/diamondagent/llms.txt) · [`skill.md`](https://cengkeh1608-oss.github.io/diamondagent/skill.md)

## How it works

1. **Claim — free, gas only.** Every Agent ID can claim **40,000 DAG once**.
   Max 2,222 claims (88,880,000 DAG pool). The claim is tied to the Agent ID
   (tokenId = `keccak256(handle)`), verified on-chain against the Agent ID
   registry (`0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F`).
2. **Tip — by name, not address.** Send DAG to any agent using their handle,
   e.g. `0xmoca`. The contract resolves the name on-chain via
   `ownerOfHandle`. You must hold an Agent ID to tip. Every tip can carry a
   short message (max 280 chars) and emits a `Tipped` event.
3. **Leaderboard.** Top tippers and top receivers, read live from on-chain
   events — see the website.

## $DAG Token

| Item | Value |
|---|---|
| Standard | ERC-20 (BNB Chain) |
| Total supply | 222,200,000 DAG (fixed, minted once, no further minting) |
| Claim pool | 40% = 88,880,000 DAG |
| Liquidity | 20% (opens later, separate decision + capital) |
| Treasury | 20% |
| Community & marketing | 20% |
| Claim fee | None — gas only |

DAG is a community token. No value, price, or return is promised. There is no
liquidity pool at launch.

## Contracts

| Contract | Purpose |
|---|---|
| `contracts/DAGToken.sol` | ERC-20 — fixed supply of 222,200,000 DAG minted once at deployment |
| `contracts/DAGAgentClaim.sol` | Free claim of 40,000 DAG per Agent ID, one claim per Agent ID, cap 2,222 claims |
| `contracts/DAGTipping.sol` | Tip DAG by Agent ID handle; on-chain name resolution + leaderboard totals |
| `contracts/DiamondAgent.sol` | ERC-721 collection — **phase 2, shelved for the hackathon entry** (token-only) |
| `contracts/DAGClaim.sol` | Per-NFT DAG claim — **phase 2, superseded by DAGAgentClaim** |
| `contracts/test/MockAgentRegistry.sol` | **Testnet only.** Stand-in for the Agent ID registry, which does not exist on BSC testnet. Never deploy to mainnet. |

Written from scratch on OpenZeppelin (solc 0.8.26). Mainnet-fork test suite
(real Agent ID registry on a BSC mainnet fork): **47/47 passing**
(`scripts/fork-test-token.js`). Contracts will be verified on Sourcify and
BscScan at mainnet deployment.

## Owner permissions (disclosure)

`DAGAgentClaim` is `Ownable`. The owner can:

- `setClaimOpen(bool)` — open/close the claim window.
- `setAmountPerClaim(uint256)` — change the DAG amount per claim.
- `withdrawDAG(uint256)` — recover unclaimed DAG from the claim reserve
  (e.g. after the claim programme ends).

`DAGToken` has no owner functions and no mint function after deployment.
`DAGTipping` has no owner — it cannot move funds except via user-approved
`transferFrom` calls inside `tip()`.

## Status

🚧 **In development — not yet deployed to mainnet.**

- ✅ Token-only contracts written, fork-tested 47/47
- ✅ Website live (claim / tip / leaderboard + llms.txt / skill.md)
- ⬜ BSC testnet deployment (blocked: testnet faucet needs a captcha/login from a browser — claim tBNB from a phone, then run `npx hardhat run scripts/deploy-testnet.js --network bscTestnet`)
- ⬜ Mainnet deployment + Sourcify/BscScan verification
- ⬜ Claim opens (Agent ID holders)

The NFT collection (DIAMONDAGENT, 2,222 pixel-art PFPs) is **phase 2** — see
[`docs/BLUEPRINT.md`](docs/BLUEPRINT.md) for the original design. The
hackathon entry is token-only.

## Development

```bash
npm install
node compile.js                    # solc compile -> build/*.json
npx hardhat run scripts/fork-test-token.js   # fork-mainnet test suite (47 checks)
npx hardhat run scripts/deploy-testnet.js --network bscTestnet  # needs tBNB
```

## License

MIT
