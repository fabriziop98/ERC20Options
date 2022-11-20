// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8;
pragma abicoder v2;

import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract SingleSwap {
    address public constant routerAddress = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    ISwapRouter public immutable swapRouter = ISwapRouter(routerAddress);
    // Pool fee 0.3%.
    uint24 public constant poolFee = 3000;

    constructor() {}

    function swapExactInputSingle(address _tokenIN, address _tokenOut,uint256 _amountIn, address _receiver)
        external
        returns (uint256 amountOut)
    {
        IERC20 tokenIN = IERC20(_tokenIN);
        //IERC20 tokenOUT = IERC20(_tokenOut);
        tokenIN.approve(address(swapRouter), _amountIn);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: _tokenIN,
                tokenOut: _tokenOut,
                fee: poolFee,
                recipient: _receiver,
                deadline: block.timestamp,
                amountIn: _amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

        amountOut = swapRouter.exactInputSingle(params);
    }


}