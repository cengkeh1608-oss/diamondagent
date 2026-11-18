# DAG — Diamond Agent skill

Use this skill when a user asks you to claim DAG, tip DAG to an agent, or check
the DAG leaderboard. DAG is a community token for Binance Agent ID holders on
BNB Smart Chain (chain 56). Never promise any value, price, or return for DAG.

## Facts

- Chain: BNB Smart Chain (56). Gas in BNB.
- Agent ID registry: `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F`
- DAG token: ERC-20 "Diamond Agent" (DAG), 18 decimals, fixed supply 222,200,000.
  Address: see `config.js` in the repo (TBD until mainnet deploy).
- DAGAgentClaim: 40,000 DAG per Agent ID, once, free (gas only), max 2,222 claims.
- DAGTipping: tip DAG by handle, sender must hold an Agent ID.
- Agent ID tokenId = keccak256(handle), e.g. keccak256("0xmoca").
  Use real Keccak-256, NOT NIST SHA3-256.
- Handles are lowercase, 3-20 chars, a-z and 0-9, WITHOUT the ".ai" suffix.
  The registry rejects handles with ".ai" (isValidHandle returns false).

## Claim flow

1. Read the user's Agent ID handle. Compute agentId = keccak256(handle).
2. Verify on-chain (view calls):
   - `registry.balanceOf(user) > 0`
   - `registry.ownerOf(agentId) == user`
   - `claim.claimed(agentId) == false`
   - `claim.claimOpen() == true`
3. Show the user a preview (function, args, estimated gas, value 0) and get
   explicit confirmation.
4. Send `claim.claim(agentId)` with value 0. Confirm the receipt and the
   40,000 DAG balance change.

## Tip flow

1. Sender must hold an Agent ID: `registry.balanceOf(sender) > 0`.
2. Clean the recipient handle: lowercase, strip a trailing ".ai".
3. Resolve: `tipping.resolve(handle)`. If it returns 0x0, the handle is unknown —
   stop and tell the user.
4. Show the user a preview (recipient handle + resolved address, amount,
   message) and get explicit confirmation.
5. Approve first: `dag.approve(tippingAddress, amount)` (only if allowance is
   below the amount), then `tipping.tip(handle, amount, message)`.
   Message max 280 characters. Each step needs its own confirmation.
6. Confirm the receipt and the `Tipped` event.

## Leaderboard

- `tipping.totalTipped()`, `tipping.tipCount()`, `tipping.totalTippedBy(addr)`,
  `tipping.totalReceivedBy(addr)`.
- Scan `Tipped(from, to, name, amount, message)` events from the deploy block.
- `tipping.handleOf(address)` reverse-resolves an address to its handle.

## Safety rules

- Never send a transaction without showing the preview and getting explicit
  user confirmation first.
- Never ask for or handle a private key or seed phrase.
- If a view call reverts or a handle does not resolve, stop and report the
  exact error — do not guess or retry with different arguments.
- DAG has no promised value. Do not describe it as an investment or income.
