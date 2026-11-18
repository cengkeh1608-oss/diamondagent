// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title MockAgentRegistry — TESTNET ONLY
/// @notice Minimal stand-in for the real Binance Agent ID registry
///         (0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F), which does not exist
///         on BSC testnet. Implements only the functions DAGAgentClaim and
///         DAGTipping use. NEVER deploy this to mainnet.
contract MockAgentRegistry {
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(string => address) private _handleOwner;
    mapping(address => string) private _handleOf;

    function register(string calldata handle, address owner) external {
        uint256 id = uint256(keccak256(bytes(handle)));
        require(_owners[id] == address(0), "Handle taken");
        _owners[id] = owner;
        _balances[owner] += 1;
        _handleOwner[handle] = owner;
        _handleOf[owner] = handle;
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "Nonexistent token");
        return owner;
    }

    function balanceOf(address owner) external view returns (uint256) {
        return _balances[owner];
    }

    function ownerOfHandle(string calldata handle) external view returns (address) {
        return _handleOwner[handle];
    }

    function handleOf(address owner) external view returns (string memory) {
        return _handleOf[owner];
    }

    function isValidHandle(string calldata handle) external pure returns (bool) {
        bytes memory b = bytes(handle);
        if (b.length < 3 || b.length > 20) return false;
        for (uint256 i = 0; i < b.length; i++) {
            bytes1 c = b[i];
            bool ok = (c >= "a" && c <= "z") || (c >= "0" && c <= "9");
            if (!ok) return false;
        }
        return true;
    }
}
