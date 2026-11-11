require("@nomicfoundation/hardhat-ethers");

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
  },
};
