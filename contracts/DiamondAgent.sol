// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

interface IAgentRegistry {
    function balanceOf(address account) external view returns (uint256);
}

/// @title DIAMONDAGENT — generative pixel flag-bearer collection
/// @notice Free mint, gated by Binance Agent ID ownership. Max 2 per wallet, supply 2,222.
contract DiamondAgent is ERC721, Ownable {
    uint256 public constant MAX_SUPPLY = 2222;
    uint256 public constant MAX_PER_WALLET = 2;

    /// @notice Binance Agent ID registry on BSC
    IAgentRegistry public constant AGENT_REGISTRY =
        IAgentRegistry(0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F);

    uint256 public totalMinted;
    bool public mintOpen;
    bool public revealed;

    string private _baseTokenURI;
    string public placeholderURI;

    mapping(address => uint256) public mintedBy;

    event MintOpened();
    event MintClosed();
    event Revealed(string baseURI);

    constructor(string memory placeholderURI_)
        ERC721("DIAMONDAGENT", "DAGT")
        Ownable(msg.sender)
    {
        placeholderURI = placeholderURI_;
    }

    /// @notice Free mint. Caller must hold a Binance Agent ID NFT.
    function mint(uint256 quantity) external {
        require(mintOpen, "Mint not open");
        require(quantity == 1 || quantity == 2, "Quantity 1 or 2");
        require(mintedBy[msg.sender] + quantity <= MAX_PER_WALLET, "Wallet limit");
        require(totalMinted + quantity <= MAX_SUPPLY, "Sold out");
        require(AGENT_REGISTRY.balanceOf(msg.sender) > 0, "Agent ID required");

        mintedBy[msg.sender] += quantity;
        for (uint256 i = 0; i < quantity; i++) {
            totalMinted += 1;
            _safeMint(msg.sender, totalMinted);
        }
    }

    // --- Owner controls ---

    function setMintOpen(bool open) external onlyOwner {
        mintOpen = open;
        if (open) emit MintOpened(); else emit MintClosed();
    }

    function setPlaceholderURI(string memory uri) external onlyOwner {
        placeholderURI = uri;
    }

    /// @notice One-way reveal: set the real metadata base URI.
    function reveal(string memory baseURI_) external onlyOwner {
        require(!revealed, "Already revealed");
        revealed = true;
        _baseTokenURI = baseURI_;
        emit Revealed(baseURI_);
    }

    // --- Views ---

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        if (!revealed) return placeholderURI;
        return string(abi.encodePacked(_baseTokenURI, Strings.toString(tokenId), ".json"));
    }

    function freeLeft() external view returns (uint256) {
        return MAX_SUPPLY - totalMinted;
    }
}
