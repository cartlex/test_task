// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LPToken is ERC20 {
    address public manager;
    constructor(string memory name_, string memory symbol_, address _manager) ERC20(name_, symbol_) {
        manager = _manager;
    }

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }

}