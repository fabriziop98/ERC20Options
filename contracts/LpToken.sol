// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LpToken is ERC20 {
    constructor(uint amount, string memory name, string memory symbol) 
    ERC20(name, symbol) {
        _mint(msg.sender, amount * 10 ** decimals());
    }
}