// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title DAGClaim — holder claim for DIAMONDAGENT NFTs
/// @notice Each NFT can claim 40,000 DAG once, for a fee of 0.00015 BNB.
///         Fees are forwarded straight to the treasury; DAG is paid out of this contract's reserve.
contract DAGClaim is Ownable, ReentrancyGuard {
    IERC721 public immutable nft;
    IERC20 public immutable dag;
    address public treasury;

    uint256 public feePerNft = 0.00015 ether;
    uint256 public amountPerNft = 40_000 * 10 ** 18;
    bool public claimOpen;

    mapping(uint256 => bool) public claimed;

    event Claimed(address indexed user, uint256[] tokenIds, uint256 dagAmount, uint256 feePaid);
    event ClaimOpened();
    event ClaimClosed();

    constructor(address nft_, address dag_, address treasury_) Ownable(msg.sender) {
        require(nft_ != address(0) && dag_ != address(0) && treasury_ != address(0), "Zero address");
        nft = IERC721(nft_);
        dag = IERC20(dag_);
        treasury = treasury_;
    }

    /// @notice Claim DAG for one or more NFTs you own. Exact fee required.
    function claim(uint256[] calldata tokenIds) external payable nonReentrant {
        require(claimOpen, "Claim not open");
        uint256 n = tokenIds.length;
        require(n > 0, "No token ids");
        require(msg.value == feePerNft * n, "Wrong fee");

        for (uint256 i = 0; i < n; i++) {
            uint256 id = tokenIds[i];
            require(nft.ownerOf(id) == msg.sender, "Not your NFT");
            require(!claimed[id], "Already claimed");
            claimed[id] = true;
        }

        uint256 total = amountPerNft * n;
        require(dag.transfer(msg.sender, total), "DAG transfer failed");

        (bool ok, ) = treasury.call{value: msg.value}("");
        require(ok, "Treasury transfer failed");

        emit Claimed(msg.sender, tokenIds, total, msg.value);
    }

    // --- Owner controls ---

    function setClaimOpen(bool open) external onlyOwner {
        claimOpen = open;
        if (open) emit ClaimOpened(); else emit ClaimClosed();
    }

    function setFeePerNft(uint256 fee) external onlyOwner {
        feePerNft = fee;
    }

    function setAmountPerNft(uint256 amount) external onlyOwner {
        amountPerNft = amount;
    }

    function setTreasury(address treasury_) external onlyOwner {
        require(treasury_ != address(0), "Zero address");
        treasury = treasury_;
    }

    /// @notice Recover DAG reserve (e.g. after claim programme ends).
    function withdrawDAG(uint256 amount) external onlyOwner {
        require(dag.transfer(msg.sender, amount), "DAG transfer failed");
    }

    /// @notice Safety valve for any BNB accidentally stuck in the contract.
    function withdrawStuckBNB() external onlyOwner {
        (bool ok, ) = treasury.call{value: address(this).balance}("");
        require(ok, "Transfer failed");
    }

    receive() external payable {}
}
