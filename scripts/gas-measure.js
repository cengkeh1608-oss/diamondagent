// Measure exact deploy gas for the token-only stack on an ephemeral local
// network (no fork — the mock registry stands in for the real one).
// Run: FORK=off npx hardhat run scripts/gas-measure.js
const hre = require("hardhat");

async function main() {
  const ethers = hre.ethers;
  const [deployer] = await ethers.getSigners();

  async function deploy(name, ...args) {
    const F = await ethers.getContractFactory(name);
    const c = await F.deploy(...args);
    const rc = await c.deploymentTransaction().wait();
    const addr = await c.getAddress();
    console.log(`${name}: ${addr}  gasUsed=${rc.gasUsed}`);
    return { c, gas: rc.gasUsed };
  }

  const mock = await deploy("MockAgentRegistry");
  const dag = await deploy("DAGToken");
  const claim = await deploy("DAGAgentClaim", mock.c.target, dag.c.target);
  const tip = await deploy("DAGTipping", mock.c.target, dag.c.target);

  const fundTx = await dag.c.transfer(claim.c.target, 88_880_000n * 10n ** 18n);
  const fundRc = await fundTx.wait();
  console.log(`fund reserve (88,880,000 DAG): gasUsed=${fundRc.gasUsed}`);

  const openTx = await claim.c.setClaimOpen(true);
  const openRc = await openTx.wait();
  console.log(`setClaimOpen(true): gasUsed=${openRc.gasUsed}`);

  // Mainnet deploy = 3 real contracts (no mock) + 2 setup txs
  const mainnetGas = dag.gas + claim.gas + tip.gas + fundRc.gasUsed + openRc.gasUsed;
  const deployOnly = dag.gas + claim.gas + tip.gas;
  console.log(`\nTOTAL deploy gas (3 contracts): ${deployOnly}`);
  console.log(`TOTAL deploy + setup gas: ${mainnetGas}`);
  for (const gwei of ["0.05", "0.07", "1"]) {
    console.log(`cost at ${gwei} gwei: ${ethers.formatEther(mainnetGas * BigInt(Math.round(parseFloat(gwei) * 1e9)))} BNB`);
  }
}

main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
