require("@nomicfoundation/hardhat-ethers");
const fs = require("fs");
const path = require("path");

// Testnet deploy key: throwaway wallet in hidden/testnet-wallet.json (tBNB only).
// Never put a mainnet key here.
function testnetKey() {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, "hidden", "testnet-wallet.json"), "utf8")).privateKey;
  } catch {
    return undefined;
  }
}

/** Local BSC-mainnet fork: the real Agent ID registry exists on the fork,
 *  so the mint gate can be tested end-to-end without real funds.
 *  BlastAPI public endpoint is used because it serves archive state;
 *  BSC hardfork history is declared manually since chain 56 is not built in. */
module.exports = {
  solidity: "0.8.26",
  networks: {
    hardhat: {
      chainId: 56,
      hardfork: "cancun",
      chains: {
        56: {
          hardforkHistory: {
            berlin: 0,
            london: 0,
            merge: 0,
            shanghai: 0,
            cancun: 0,
          },
        },
      },
      forking: {
        url: "https://bsc-mainnet.public.blastapi.io",
      },
    },
    // BSC testnet (chain 97). The real Agent ID registry does NOT exist here,
    // so the deploy script deploys MockAgentRegistry first (testnet only).
    bscTestnet: {
      url: "https://bsc-testnet-rpc.publicnode.com",
      chainId: 97,
      accounts: testnetKey() ? [testnetKey()] : [],
    },
  },
};
