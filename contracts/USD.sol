// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USD is ERC20 {
    constructor() ERC20("USD", "USD") {}

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }
}