const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Token-only fork test: DAGToken + DAGAgentClaim + DAGTipping against the REAL
// Agent ID registry on a BSC mainnet fork. No real funds involved.
const USER = "0x1B25F9EBD8DD8595B283b78A4687dd8558dB921A"; // 0xmoca
const BOY9 = "0xE50564F842a82b2c99432b58C393F95ECf6d32d5"; // boy9 (ownerOfHandle verified on mainnet)
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
    ok(msg.includes(needle), label, msg.includes(needle) ? "" : `(revert lain: ${msg.slice(0, 140)})`);
  }
}
async function expectAnyRevert(promise, label) {
  try {
    await promise;
    ok(false, label, "(tx sukses, harusnya revert)");
  } catch (e) {
    ok(true, label, `(revert: ${(e.message || "").slice(0, 80)})`);
  }
}

function load(name) {
  const j = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "build", name + ".json"), "utf8"));
  return { abi: j.abi, bytecode: j.bytecode };
}

async function main() {
  const ethers = hre.ethers;
  const [deployer, , stranger] = await ethers.getSigners();
  console.log("deployer:", deployer.address);
  console.log("stranger (tanpa Agent ID):", stranger.address);

  const userAgentId = ethers.keccak256(ethers.toUtf8Bytes("0xmoca"));
  const boy9AgentId = ethers.keccak256(ethers.toUtf8Bytes("boy9"));
  const ghostAgentId = ethers.keccak256(ethers.toUtf8Bytes("zzzznotreal123"));
  console.log("userAgentId:", userAgentId);
  ok(userAgentId === "0x31633f7003e9b5a5be2d75fe4160dcce377e5f3cceb9aaedcf0bfdc957a6eeb3",
    "keccak256('0xmoca') cocok dengan tokenId terverifikasi");

  // Impersonate the user's wallet on the fork (fake funds, mainnet untouched)
  await hre.network.provider.request({ method: "hardhat_impersonateAccount", params: [USER] });
  await hre.network.provider.request({ method: "hardhat_setBalance", params: [USER, "0x" + (10n ** 18n).toString(16)] });
  const user = await ethers.getSigner(USER);

  const registry = new ethers.Contract(REGISTRY, [
    "function balanceOf(address) view returns (uint256)",
    "function ownerOf(uint256) view returns (address)",
    "function ownerOfHandle(string) view returns (address)",
    "function handleOf(address) view returns (string)",
  ], ethers.provider);

  console.log("\n-- REGISTRY (live mainnet fork) --");
  ok((await registry.balanceOf(USER)) > 0n, "user pegang Agent ID di fork mainnet");
  ok((await registry.balanceOf(stranger.address)) === 0n, "stranger tidak pegang Agent ID");
  ok((await registry.ownerOf(userAgentId)) === USER, "ownerOf(keccak('0xmoca')) = user");
  ok((await registry.ownerOfHandle("0xmoca")) === USER, "ownerOfHandle('0xmoca') = user");
  ok((await registry.ownerOfHandle("boy9")) === BOY9, "ownerOfHandle('boy9') = boy9");
  ok((await registry.ownerOfHandle("zzzznotreal123")) === ethers.ZeroAddress, "nama tak dikenal resolve ke 0x0");
  ok((await registry.handleOf(USER)) === "0xmoca", "handleOf(user) = '0xmoca'");

  // --- Deploy ---
  console.log("\n-- DEPLOY --");
  const dagArt = load("DAGToken");
  const DAG = await new ethers.ContractFactory(dagArt.abi, dagArt.bytecode, deployer).deploy();
  await DAG.waitForDeployment();
  const dagAddr = await DAG.getAddress();
  console.log("DAGToken deployed:", dagAddr);
  ok((await DAG.balanceOf(deployer.address)) === 222_200_000n * 10n ** 18n, "supply DAG 222.200.000 ke deployer");
  ok((await DAG.symbol()) === "DAG", "symbol DAG");
  ok((await DAG.name()) === "Diamond Agent", "name Diamond Agent");

  const claimArt = load("DAGAgentClaim");
  const Claim = await new ethers.ContractFactory(claimArt.abi, claimArt.bytecode, deployer)
    .deploy(REGISTRY, dagAddr);
  await Claim.waitForDeployment();
  const claimAddr = await Claim.getAddress();
  console.log("DAGAgentClaim deployed:", claimAddr);
  ok((await Claim.MAX_CLAIMS()) === 2222n, "MAX_CLAIMS = 2222");
  ok((await Claim.amountPerClaim()) === 40_000n * 10n ** 18n, "amountPerClaim = 40.000 DAG");

  const tipArt = load("DAGTipping");
  const Tip = await new ethers.ContractFactory(tipArt.abi, tipArt.bytecode, deployer)
    .deploy(REGISTRY, dagAddr);
  await Tip.waitForDeployment();
  const tipAddr = await Tip.getAddress();
  console.log("DAGTipping deployed:", tipAddr);
  ok((await Tip.MAX_MESSAGE_LEN()) === 280n, "MAX_MESSAGE_LEN = 280");

  // Fund claim reserve: 40% = 88,880,000 DAG
  await (await DAG.transfer(claimAddr, 88_880_000n * 10n ** 18n)).wait();
  ok((await DAG.balanceOf(claimAddr)) === 88_880_000n * 10n ** 18n, "reserve claim terisi 88.880.000 DAG");

  // --- Resolver views ---
  console.log("\n-- RESOLVER --");
  ok((await Tip.resolve("0xmoca")) === USER, "Tip.resolve('0xmoca') = user");
  ok((await Tip.resolve("boy9")) === BOY9, "Tip.resolve('boy9') = boy9");
  ok((await Tip.resolve("zzzznotreal123")) === ethers.ZeroAddress, "Tip.resolve nama tak dikenal = 0x0");
  ok((await Tip.handleOf(USER)) === "0xmoca", "Tip.handleOf(user) = '0xmoca'");

  // --- Claim tests ---
  console.log("\n-- CLAIM --");
  await expectRevert(Claim.connect(user).claim(userAgentId), "Claim not open", "claim sebelum dibuka revert");
  await (await Claim.setClaimOpen(true)).wait();

  await expectRevert(Claim.connect(stranger).claim(userAgentId), "Agent ID required", "wallet tanpa Agent ID ditolak");
  await expectRevert(Claim.connect(user).claim(boy9AgentId), "Not your Agent ID", "klaim Agent ID orang lain ditolak");
  await expectAnyRevert(Claim.connect(user).claim(ghostAgentId), "klaim Agent ID yang tidak ada revert");

  await (await Claim.connect(user).claim(userAgentId)).wait();
  ok((await DAG.balanceOf(USER)) === 40_000n * 10n ** 18n, "user terima 40.000 DAG");
  ok((await Claim.claimed(userAgentId)) === true, "claimed(agentId) = true");
  ok((await Claim.totalClaims()) === 1n, "totalClaims = 1");
  await expectRevert(Claim.connect(user).claim(userAgentId), "Already claimed", "klaim ganda ditolak");
  await (await Claim.setClaimOpen(false)).wait();
  await expectRevert(Claim.connect(user).claim(userAgentId), "Claim not open", "claim setelah ditutup revert");
  await (await Claim.setClaimOpen(true)).wait();

  // --- Tip tests ---
  console.log("\n-- TIP --");
  await expectAnyRevert(
    Tip.connect(user).tip("boy9", ethers.parseEther("1000"), "kopi buat lo"),
    "tip sebelum approve revert (allowance)"
  );
  await expectRevert(
    Tip.connect(stranger).tip("boy9", ethers.parseEther("1"), "hi"),
    "Agent ID required", "tip dari non-holder ditolak"
  );
  await expectRevert(
    Tip.connect(user).tip("boy9", 0n, "hi"),
    "Amount is zero", "tip 0 ditolak"
  );
  await expectRevert(
    Tip.connect(user).tip("boy9", ethers.parseEther("1"), "x".repeat(281)),
    "Message too long", "pesan 281 karakter ditolak"
  );
  await expectRevert(
    Tip.connect(user).tip("0xmoca.ai", ethers.parseEther("1"), "hi"),
    "Invalid handle", "nama pakai suffix .ai ditolak"
  );
  await expectRevert(
    Tip.connect(user).tip("zzzznotreal123", ethers.parseEther("1"), "hi"),
    "Unknown handle", "tip ke nama tak dikenal revert"
  );

  await (await DAG.connect(user).approve(tipAddr, ethers.parseEther("10000"))).wait();
  const boy9Before = await DAG.balanceOf(BOY9);
  const tipTx1 = await Tip.connect(user).tip("boy9", ethers.parseEther("1000"), "kopi buat lo bro");
  const rc1 = await tipTx1.wait();
  ok((await DAG.balanceOf(BOY9)) - boy9Before === ethers.parseEther("1000"), "boy9 terima tip 1.000 DAG");
  ok((await DAG.balanceOf(USER)) === ethers.parseEther("39000"), "saldo user 39.000 DAG setelah tip");
  ok((await Tip.totalTipped()) === ethers.parseEther("1000"), "totalTipped = 1.000");
  ok((await Tip.tipCount()) === 1n, "tipCount = 1");
  ok((await Tip.totalTippedBy(USER)) === ethers.parseEther("1000"), "totalTippedBy(user) = 1.000");
  ok((await Tip.totalReceivedBy(BOY9)) === ethers.parseEther("1000"), "totalReceivedBy(boy9) = 1.000");

  const tipTx2 = await Tip.connect(user).tip("boy9", ethers.parseEther("500"), "lanjut");
  const rc2 = await tipTx2.wait();
  ok((await Tip.totalTipped()) === ethers.parseEther("1500"), "totalTipped = 1.500 setelah tip ke-2");
  ok((await Tip.tipCount()) === 2n, "tipCount = 2");
  ok((await Tip.totalTippedBy(USER)) === ethers.parseEther("1500"), "totalTippedBy(user) = 1.500");

  // Event checks from tx receipts (avoids eth_getLogs scan -> 429 on the fork RPC)
  const parseTipped = (rc) => rc.logs
    .map((l) => { try { return Tip.interface.parseLog(l); } catch { return null; } })
    .filter((p) => p && p.name === "Tipped");
  const ev1 = parseTipped(rc1);
  const ev2 = parseTipped(rc2);
  ok(ev1.length === 1, "event Tipped ke-1 ter-emit", `(${ev1.length})`);
  ok(ev1.length === 1 && ev1[0].args.name === "boy9" && ev1[0].args.message === "kopi buat lo bro",
    "event Tipped ke-1 bawa nama + pesan benar");
  ok(ev1.length === 1 && ev1[0].args.from === USER && ev1[0].args.to === BOY9,
    "event Tipped ke-1 bawa from/to benar");
  ok(ev2.length === 1 && ev2[0].args.amount === ethers.parseEther("500"),
    "event Tipped ke-2 ter-emit (500 DAG)");

  console.log(`\n=== HASIL: ${passed} PASS, ${failed} FAIL ===`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
