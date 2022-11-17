// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IUniswapV2Factory } from "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import { IUniswapV2Pair } from "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import { IUniswapV2Callee } from "@uniswap/v2-core/contracts/interfaces/IUniswapV2Callee.sol";

// import in your .sol file
//import "hardhat/console.sol";


contract UniswapFlashSwap is IUniswapV2Callee {
  // Uniswap V2 router
  // 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
  address private constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
  // Uniswap V2 factory
  address private constant FACTORY = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;

  event Log(string message, uint val);

  function FlashSwap(address _tokenBorrow, uint _amount) external {
    address pair = IUniswapV2Factory(FACTORY).getPair(_tokenBorrow, WETH);
    require(pair != address(0), "!pair");

    address token0 = IUniswapV2Pair(pair).token0();
    address token1 = IUniswapV2Pair(pair).token1();
    uint amount0Out = _tokenBorrow == token0 ? _amount : 0;
    uint amount1Out = _tokenBorrow == token1 ? _amount : 0;

    // need to pass some data to trigger uniswapV2Call
    bytes memory data = abi.encode(_tokenBorrow, _amount);

    //IUniswapV2Pair(pair).swap(amount0Out, amount1Out, address(this), data); //asume que es un flashloan
    IUniswapV2Pair(pair).swap(amount0Out, amount1Out,address(this) , data);
  }

  // called by pair contract
  function uniswapV2Call(
    address _sender,
    uint _amount0,
    uint _amount1,
    bytes calldata _data
  ) external override {
    address token0 = IUniswapV2Pair(msg.sender).token0();
    address token1 = IUniswapV2Pair(msg.sender).token1();
    address pair = IUniswapV2Factory(FACTORY).getPair(token0, token1);
    //require(msg.sender == pair, "!pair");
    //require(_sender == address(this), "!sender");

    (address tokenBorrow, uint amount) = abi.decode(_data, (address, uint));

   // este contracto hace el transfer al contracto de options que fue el caller de este contracto

   //

    // about 0.3%
    uint fee = ((amount * 3) / 997) + 1;
    uint amountToRepay = amount + fee;

    // do stuff here
    //El llamado al contracto options, para hacer el excersice, obtener el weth 
    //y de ahi hacer el swap en pool uniswap, obtener ganancias y devolver el prestamo
    emit Log("amount", amount);
    emit Log("amount0", _amount0);
    emit Log("amount1", _amount1);
    emit Log("fee", fee);
    emit Log("amount to repay", amountToRepay);
   
    //console.log (IERC20(tokenBorrow).balanceOf(address(this)));
     IERC20(tokenBorrow).transfer(pair, amountToRepay);
    //IERC20(tokenBorrow).transfer(pair, amountToRepay);
  }

    function getBalance(address _tokenAddress) external view returns (uint256) {
        //console.log(IERC20(_tokenAddress).balanceOf(address(this)));
        return IERC20(_tokenAddress).balanceOf(address(this));
    }


  function repayFlashLoan(address _tokenBorrow, uint _amount) public{
     // about 0.3%
     address pair = IUniswapV2Factory(FACTORY).getPair(_tokenBorrow, WETH);
    //uint fee = ((_amount * 3) / 997) + 1;
    //uint amountToRepay = _amount + fee;

    IERC20(_tokenBorrow).transfer(pair, _amount);
  }
}