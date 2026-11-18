const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const USER = "0x1B25F9EBD8DD8595B283b78A4687dd8558dB921A"; // holds a real Agent ID on mainnet
const REGISTRY = "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F";

let passed = 0, failed = 0;
function ok(cond, label, extra = "") {
  if (cond) { passed++; console.log("  PASS:", label, extra); }
  else { failed++; console.log("  FAIL:", label, extra); }
}
async function expectRevert(promise, needle, label) {
  try {
    await promise;
    ok(false, label, "(tx sukses, harusnya revert)");
  } catch (e) {
    const msg = e.message || "";
    ok(msg.includes(needle), label, msg.includes(needle) ? "" : `(revert lain: ${msg.slice(0, 120)})`);
  }
}

function load(name) {
  const j = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "build", name + ".json"), "utf8"));
  return { abi: j.abi, bytecode: j.bytecode };
}

async function main() {
  const ethers = hre.ethers;
  const [deployer, , stranger] = await ethers.getSigners();
  // Treasury must be a clean EOA: hardhat account #1 (0x7099...) carries EIP-7702 code on BSC mainnet,
  // which breaks plain BNB transfers on the fork. Use the throwaway wallet address instead.
  const treasury = { address: "0x697a8c940b59A04c23d37E1Af31D22D6cEF54B4f" };
  console.log("deployer:", deployer.address);
  console.log("treasury:", treasury.address);
  console.log("stranger (tanpa Agent ID):", stranger.address);

  // Impersonate the user's wallet on the fork (fake funds, mainnet untouched)
  await hre.network.provider.request({ method: "hardhat_impersonateAccount", params: [USER] });
  await hre.network.provider.request({ method: "hardhat_setBalance", params: [USER, "0x" + (10n ** 18n).toString(16)] });
  const user = await ethers.getSigner(USER);

  const registry = new ethers.Contract(REGISTRY, ["function balanceOf(address) view returns (uint256)"], ethers.provider);
  const agentBal = await registry.balanceOf(USER);
  console.log("Agent ID balanceOf(user) di fork:", agentBal.toString());
  ok(agentBal > 0n, "user pegang Agent ID di fork mainnet");
  ok((await registry.balanceOf(stranger.address)) === 0n, "stranger tidak pegang Agent ID");

  // --- Deploy ---
  const nftArt = load("DiamondAgent");
  const NFT = await new ethers.ContractFactory(nftArt.abi, nftArt.bytecode, deployer)
    .deploy("ipfs://placeholder/diamondagent.json");
  await NFT.waitForDeployment();
  const nftAddr = await NFT.getAddress();
  console.log("DiamondAgent deployed:", nftAddr);

  const dagArt = load("DAGToken");
  const DAG = await new ethers.ContractFactory(dagArt.abi, dagArt.bytecode, deployer).deploy();
  await DAG.waitForDeployment();
  const dagAddr = await DAG.getAddress();
  console.log("DAGToken deployed:", dagAddr);
  ok((await DAG.balanceOf(deployer.address)) === 222_200_000n * 10n ** 18n, "supply DAG 222.200.000 ke deployer");
  ok((await DAG.symbol()) === "DAG", "symbol DAG");

  const claimArt = load("DAGClaim");
  const Claim = await new ethers.ContractFactory(claimArt.abi, claimArt.bytecode, deployer)
    .deploy(nftAddr, dagAddr, treasury.address);
  await Claim.waitForDeployment();
  const claimAddr = await Claim.getAddress();
  console.log("DAGClaim deployed:", claimAddr);

  // Fund claim reserve: 40% = 88,880,000 DAG
  await (await DAG.transfer(claimAddr, 88_880_000n * 10n ** 18n)).wait();
  ok((await DAG.balanceOf(claimAddr)) === 88_880_000n * 10n ** 18n, "reserve claim terisi 88.880.000 DAG");

  // --- Mint tests ---
  console.log("\n-- MINT --");
  await expectRevert(NFT.connect(user).mint(1), "Mint not open", "mint sebelum dibuka revert");
  await (await NFT.setMintOpen(true)).wait();

  await expectRevert(NFT.connect(stranger).mint(1), "Agent ID required", "wallet tanpa Agent ID ditolak gate");
  await (await NFT.connect(user).mint(2)).wait();
  ok((await NFT.balanceOf(USER)) === 2n, "user mint 2 NFT sukses");
  ok((await NFT.totalMinted()) === 2n, "totalMinted = 2");
  ok((await NFT.ownerOf(1)) === USER && (await NFT.ownerOf(2)) === USER, "ownerOf(1,2) = user");
  await expectRevert(NFT.connect(user).mint(1), "Wallet limit", "mint ke-3 ditolak (maks 2/wallet)");
  ok((await NFT.tokenURI(1)) === "ipfs://placeholder/diamondagent.json", "tokenURI placeholder sebelum reveal");

  // --- Claim tests ---
  console.log("\n-- CLAIM --");
  await expectRevert(
    Claim.connect(user).claim([1], { value: ethers.parseEther("0.00015") }),
    "Claim not open", "claim sebelum dibuka revert"
  );
  await (await Claim.setClaimOpen(true)).wait();

  await expectRevert(
    Claim.connect(user).claim([1], { value: ethers.parseEther("0.0001") }),
    "Wrong fee", "fee kurang ditolak"
  );
  await expectRevert(
    Claim.connect(stranger).claim([1], { value: ethers.parseEther("0.00015") }),
    "Not your NFT", "klaim NFT orang lain ditolak"
  );

  const treasBefore = await ethers.provider.getBalance(treasury.address);
  await (await Claim.connect(user).claim([1, 2], { value: ethers.parseEther("0.0003") })).wait();
  ok((await DAG.balanceOf(USER)) === 80_000n * 10n ** 18n, "user terima 80.000 DAG (2 NFT x 40.000)");
  const treasAfter = await ethers.provider.getBalance(treasury.address);
  ok(treasAfter - treasBefore === ethers.parseEther("0.0003"), "treasury terima fee 0,0003 BNB persis");
  ok((await Claim.claimed(1)) && (await Claim.claimed(2)), "claimed(1) & claimed(2) = true");
  await expectRevert(
    Claim.connect(user).claim([1], { value: ethers.parseEther("0.00015") }),
    "Already claimed", "klaim ganda ditolak"
  );

  // --- Reveal test ---
  console.log("\n-- REVEAL --");
  await (await NFT.reveal("ipfs://realmeta/")).wait();
  ok((await NFT.tokenURI(1)) === "ipfs://realmeta/1.json", "tokenURI asli setelah reveal");

  console.log(`\n=== HASIL: ${passed} PASS, ${failed} FAIL ===`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
