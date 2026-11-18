const fs = require("fs");
const path = require("path");
const solc = require("solc");

const sources = {};
for (const f of ["DiamondAgent.sol", "DAGToken.sol", "DAGClaim.sol", "DAGAgentClaim.sol", "DAGTipping.sol"]) {
  sources[f] = { content: fs.readFileSync(path.join(__dirname, "contracts", f), "utf8") };
}

function findImport(importPath) {
  const p = path.join(__dirname, "node_modules", importPath);
  if (fs.existsSync(p)) return { contents: fs.readFileSync(p, "utf8") };
  return { error: "File not found: " + importPath };
}

const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"] } },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImport }));
let failed = false;
for (const e of output.errors || []) {
  console.log(e.severity.toUpperCase() + ": " + e.formattedMessage);
  if (e.severity === "error") failed = true;
}
if (failed) process.exit(1);

for (const [file, contracts] of Object.entries(output.contracts)) {
  for (const [name, c] of Object.entries(contracts)) {
    const size = (c.evm.deployedBytecode.object.length - 2) / 2;
    fs.writeFileSync(
      path.join(__dirname, "build", name + ".json"),
      JSON.stringify({ abi: c.abi, bytecode: c.evm.bytecode.object, deployedSize: size }, null, 2)
    );
    console.log(`${name} (${file}): compiled OK, deployed size ${size} bytes`);
  }
}
