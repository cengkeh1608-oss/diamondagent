// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title DAG — Diamond Agent token
/// @notice Fixed supply of 222,200,000 DAG, minted once to the deployer at construction.
///         No mint function exists after deployment.
contract DAGToken is ERC20 {
    uint256 public constant TOTAL_SUPPLY = 222_200_000 * 10 ** 18;

    constructor() ERC20("Diamond Agent", "DAG") {
        _mint(msg.sender, TOTAL_SUPPLY);
    }
}
