// DAG — Diamond Agent. Shared wallet + contract helpers (ethers v6, UMD build).
let dagProvider = null;
let dagSigner = null;
let dagAccount = null;

function setStatus(msg, kind) {
  const el = document.getElementById("status");
  if (!el) return;
  el.textContent = msg || "";
  el.className = kind ? "notice " + kind : "";
}

function shortAddr(a) { return a ? a.slice(0, 6) + "..." + a.slice(-4) : ""; }

// Normalize a handle the way the registry expects: lowercase, no ".ai" suffix.
function cleanHandle(raw) {
  return (raw || "").trim().toLowerCase().replace(/\.ai$/, "");
}

async function connectWallet() {
  if (!window.ethereum) {
    setStatus("No wallet found. Open this page in Binance Wallet or MetaMask (mobile app browser works).", "err");
    return null;
  }
  dagProvider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await dagProvider.send("eth_requestAccounts", []);
  dagAccount = accounts[0];
  dagSigner = await dagProvider.getSigner();
  const net = await dagProvider.getNetwork();
  if (Number(net.chainId) !== DAG_CONFIG.chainId) {
    setStatus("Wrong network — switch your wallet to BNB Smart Chain (chain 56).", "err");
    try {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x38" }] });
    } catch (e) { /* user declined; the message above stands */ }
  }
  const btn = document.getElementById("connectBtn");
  if (btn) btn.textContent = "Connected: " + shortAddr(dagAccount);
  return dagAccount;
}

function contractsReady() {
  return !!(DAG_CONFIG.dagToken && DAG_CONFIG.dagAgentClaim && DAG_CONFIG.dagTipping);
}

function registryReadOnly(provider) {
  return new ethers.Contract(DAG_CONFIG.registry, DAG_ABI.registry, provider);
}

async function agentIdOf(handle) {
  return ethers.keccak256(ethers.toUtf8Bytes(cleanHandle(handle)));
}

function fmtDag(wei) {
  const v = Number(ethers.formatEther(wei));
  return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
