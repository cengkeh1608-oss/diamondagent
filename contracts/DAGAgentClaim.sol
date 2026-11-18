// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IAgentRegistry {
    function ownerOf(uint256 tokenId) external view returns (address);
    function balanceOf(address owner) external view returns (uint256);
}

/// @title DAGAgentClaim — free DAG claim for Binance Agent ID holders
/// @notice One claim of 40,000 DAG per Agent ID. Free — no fee, gas only.
///         The claim is tied to the Agent ID (tokenId = keccak256(handle)),
///         not to the wallet, so one Agent ID can only ever claim once.
contract DAGAgentClaim is Ownable, ReentrancyGuard {
    IAgentRegistry public immutable registry;
    IERC20 public immutable dag;

    uint256 public constant MAX_CLAIMS = 2222;
    uint256 public amountPerClaim = 40_000 * 10 ** 18;
    bool public claimOpen;
    uint256 public totalClaims;

    mapping(uint256 => bool) public claimed;

    event Claimed(address indexed user, uint256 indexed agentId, uint256 dagAmount);
    event ClaimOpened();
    event ClaimClosed();

    constructor(address registry_, address dag_) Ownable(msg.sender) {
        require(registry_ != address(0) && dag_ != address(0), "Zero address");
        registry = IAgentRegistry(registry_);
        dag = IERC20(dag_);
    }

    /// @notice Claim 40,000 DAG for your Agent ID. Free — gas only.
    /// @param agentId The Agent ID tokenId = keccak256(handle), e.g. keccak256("0xmoca").
    function claim(uint256 agentId) external nonReentrant {
        require(claimOpen, "Claim not open");
        require(totalClaims < MAX_CLAIMS, "Claim cap reached");
        require(registry.balanceOf(msg.sender) > 0, "Agent ID required");
        require(registry.ownerOf(agentId) == msg.sender, "Not your Agent ID");
        require(!claimed[agentId], "Already claimed");
        claimed[agentId] = true;
        totalClaims += 1;
        require(dag.transfer(msg.sender, amountPerClaim), "DAG transfer failed");
        emit Claimed(msg.sender, agentId, amountPerClaim);
    }

    // --- Owner controls (all disclosed in README) ---

    function setClaimOpen(bool open) external onlyOwner {
        claimOpen = open;
        if (open) emit ClaimOpened(); else emit ClaimClosed();
    }

    function setAmountPerClaim(uint256 amount) external onlyOwner {
        amountPerClaim = amount;
    }

    /// @notice Recover unclaimed DAG reserve (e.g. after the claim programme ends).
    function withdrawDAG(uint256 amount) external onlyOwner {
        require(dag.transfer(msg.sender, amount), "DAG transfer failed");
    }
}
