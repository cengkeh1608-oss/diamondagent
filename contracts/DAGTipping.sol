// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IAgentRegistry {
    function balanceOf(address owner) external view returns (uint256);
    function ownerOfHandle(string calldata handle) external view returns (address);
    function handleOf(address owner) external view returns (string memory);
    function isValidHandle(string calldata handle) external view returns (bool);
}

/// @title DAGTipping — tip fellow agents by their .ai name
/// @notice Send DAG to any Agent ID holder using their handle (e.g. "0xmoca",
///         without the ".ai" suffix). The sender must hold an Agent ID.
///         Tips are on-chain with a short message; totals feed the leaderboard.
contract DAGTipping is ReentrancyGuard {
    IAgentRegistry public immutable registry;
    IERC20 public immutable dag;

    uint256 public constant MAX_MESSAGE_LEN = 280;
    uint256 public totalTipped;
    uint256 public tipCount;

    mapping(address => uint256) public totalTippedBy;
    mapping(address => uint256) public totalReceivedBy;

    event Tipped(
        address indexed from,
        address indexed to,
        string name,
        uint256 amount,
        string message
    );

    constructor(address registry_, address dag_) {
        require(registry_ != address(0) && dag_ != address(0), "Zero address");
        registry = IAgentRegistry(registry_);
        dag = IERC20(dag_);
    }

    /// @notice Tip DAG to an Agent ID holder by handle (without the ".ai" suffix).
    /// @dev The sender must approve this contract to spend DAG first.
    function tip(string calldata name, uint256 amount, string calldata message)
        external
        nonReentrant
    {
        require(registry.balanceOf(msg.sender) > 0, "Agent ID required");
        require(amount > 0, "Amount is zero");
        require(bytes(message).length <= MAX_MESSAGE_LEN, "Message too long");
        require(registry.isValidHandle(name), "Invalid handle");
        address to = registry.ownerOfHandle(name);
        require(to != address(0), "Unknown handle");
        require(dag.transferFrom(msg.sender, to, amount), "DAG transfer failed");
        totalTipped += amount;
        tipCount += 1;
        totalTippedBy[msg.sender] += amount;
        totalReceivedBy[to] += amount;
        emit Tipped(msg.sender, to, name, amount, message);
    }

    /// @notice Resolve a handle to its owner address (0x0 if the handle is unknown).
    function resolve(string calldata name) external view returns (address) {
        return registry.ownerOfHandle(name);
    }

    /// @notice Reverse lookup: the handle owned by an address ("" if it owns none).
    function handleOf(address owner) external view returns (string memory) {
        return registry.handleOf(owner);
    }
}
