// DAG — Diamond Agent. Shared config for the static site.
// Mainnet addresses are filled in after the mainnet deploy (23-25 Nov 2026).
// Until then the claim/tip pages show a "deploying soon" state instead of failing.
const DAG_CONFIG = {
  chainId: 56,
  chainName: "BNB Smart Chain",
  registry: "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F",
  // Filled after mainnet deploy:
  dagToken: null,
  dagAgentClaim: null,
  dagTipping: null,
  deployBlock: null,
  rpcReadOnly: "https://bsc-dataseed.binance.org/",
  github: "https://github.com/cengkeh1608-oss/diamondagent",
  claimAmount: "40,000",
  maxClaims: 2222,
};

const DAG_ABI = {
  token: [
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
  ],
  claim: [
    "function claim(uint256 agentId)",
    "function claimed(uint256 agentId) view returns (bool)",
    "function totalClaims() view returns (uint256)",
    "function amountPerClaim() view returns (uint256)",
    "function claimOpen() view returns (bool)",
    "function MAX_CLAIMS() view returns (uint256)",
  ],
  tipping: [
    "function tip(string name, uint256 amount, string message)",
    "function resolve(string name) view returns (address)",
    "function handleOf(address owner) view returns (string)",
    "function totalTipped() view returns (uint256)",
    "function tipCount() view returns (uint256)",
    "function totalTippedBy(address) view returns (uint256)",
    "function totalReceivedBy(address) view returns (uint256)",
    "event Tipped(address indexed from, address indexed to, string name, uint256 amount, string message)",
  ],
  registry: [
    "function balanceOf(address) view returns (uint256)",
    "function ownerOf(uint256) view returns (address)",
    "function ownerOfHandle(string) view returns (address)",
    "function handleOf(address) view returns (string)",
    "function isValidHandle(string) view returns (bool)",
  ],
};
