// Deploy token-only DAG stack to BSC testnet (chain 97) + end-to-end smoke test.
// The real Agent ID registry does NOT exist on testnet, so a MockAgentRegistry
// is deployed first (TESTNET ONLY — never deploy the mock to mainnet).
// Needs tBNB in hidden/testnet-wallet.json (claim from the faucet on a phone:
// https://www.bnbchain.org/en/testnet-faucet).
// Run: npx hardhat run scripts/deploy-testnet.js --network bscTestnet
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const ethers = hre.ethers;
  const [deployer] = await ethers.getSigners();
  console.log("deployer:", deployer.address);
  console.log("tBNB:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  const Mock = await ethers.getContractFactory("MockAgentRegistry");
  const mock = await Mock.deploy();
  await mock.waitForDeployment();
  const mockAddr = await mock.getAddress();
  console.log("MockAgentRegistry:", mockAddr);

  // Test handles: "0xmoca" -> deployer (mirrors mainnet), "kopi" -> throwaway
  const friend = ethers.Wallet.createRandom().connect(ethers.provider);
  await (await mock.register("0xmoca", deployer.address)).wait();
  await (await mock.register("kopi", friend.address)).wait();
  console.log("registered 0xmoca ->", deployer.address);
  console.log("registered kopi ->", friend.address);

  const DAG = await ethers.getContractFactory("DAGToken");
  const dag = await DAG.deploy();
  await dag.waitForDeployment();
  const dagAddr = await dag.getAddress();
  console.log("DAGToken:", dagAddr);

  const Claim = await ethers.getContractFactory("DAGAgentClaim");
  const claim = await Claim.deploy(mockAddr, dagAddr);
  await claim.waitForDeployment();
  const claimAddr = await claim.getAddress();
  console.log("DAGAgentClaim:", claimAddr);

  const Tip = await ethers.getContractFactory("DAGTipping");
  const tip = await Tip.deploy(mockAddr, dagAddr);
  await tip.waitForDeployment();
  const tipAddr = await tip.getAddress();
  console.log("DAGTipping:", tipAddr);

  await (await dag.transfer(claimAddr, 88_880_000n * 10n ** 18n)).wait();
  console.log("claim reserve funded: 88,880,000 DAG");
  await (await claim.setClaimOpen(true)).wait();
  console.log("claim opened");

  // --- End-to-end smoke test ---
  const agentId = ethers.keccak256(ethers.toUtf8Bytes("0xmoca"));
  await (await claim.claim(agentId)).wait();
  const bal = await dag.balanceOf(deployer.address);
  console.log("claim OK, deployer DAG balance:", ethers.formatEther(bal));
  if (bal < 40_000n * 10n ** 18n) throw new Error("claim amount wrong");

  await (await dag.approve(tipAddr, ethers.parseEther("1000"))).wait();
  await (await tip.tip("kopi", ethers.parseEther("100"), "kopi testnet")).wait();
  console.log("tip OK, friend DAG balance:", ethers.formatEther(await dag.balanceOf(friend.address)));
  console.log("totalTipped:", ethers.formatEther(await tip.totalTipped()), "| tipCount:", (await tip.tipCount()).toString());

  const out = {
    network: "bscTestnet",
    chainId: 97,
    mockRegistry: mockAddr,
    dagToken: dagAddr,
    dagAgentClaim: claimAddr,
    dagTipping: tipAddr,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };
  fs.mkdirSync(path.join(__dirname, "..", "deployments"), { recursive: true });
  fs.writeFileSync(
    path.join(__dirname, "..", "deployments", "testnet.json"),
    JSON.stringify(out, null, 2)
  );
  console.log("saved deployments/testnet.json");
}

main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
