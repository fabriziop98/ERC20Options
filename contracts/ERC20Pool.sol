// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IERC20.sol";


contract ERC20Pool is Ownable {

    bool internal locked;  
    mapping(IERC20 => uint256) public lockedErc20Balance;
    mapping(IERC20 => uint256) public unlockedErc20Balance;

    address private optionTrigger;

    // Events
    event LockedAmount(address erc20, uint256 amount, uint256 newAmount);
    event UnlockedAmount(address erc20, uint256 amount, uint256 newAmount);
    event TransferedAmount(address erc20, uint256 amount);

    constructor(){
    }

    // Modifiers
    modifier reentrancyGuard() {
        require(!locked);
        locked = true;
        _;
        locked = false;
    }


    modifier onlyOptionContract(address _address){
        require(_address == optionTrigger, 'Caller is not valid');
        _; 
    }

    modifier validAddress(address _address){
        require(_address != address(0), 'Zero address');
        _;
    }

    modifier validAmount(uint256 _amount){
        require(_amount > 0, 'Amount not valid');
        _;
    }

    function setOptionTrigger(address _address)
        onlyOwner
        validAddress(_address)
    external
    {
        optionTrigger = _address;
    }

    function receiveFee(address _erc20Address, uint256 _amount)
        validAddress(_erc20Address)
        validAmount(_amount)
    external {
        
    }

    // @notice lock for options protocol to lock erc20 compatible tokens to pool
    function lock(address _erc20Address, uint256 _amount)
        validAddress(_erc20Address)
        validAmount(_amount)
    external{
        lockedErc20Balance[IERC20(_erc20Address)] += _amount;

        emit LockedAmount(_erc20Address, _amount, lockedErc20Balance[IERC20(_erc20Address)]);
    }

    // @notice unlock for preparing tokens to be transfered for when an option has been executed or terminated
    function unlock(uint256 _amount, address _erc20Address) external
        onlyOptionContract(msg.sender)
        validAddress(_erc20Address)
        validAmount(_amount)
    {
        //Check erc20 and unlock balance
        require(lockedErc20Balance[IERC20(_erc20Address)] >= _amount, 'Not enough locked tokens');
        unlockedErc20Balance[IERC20(_erc20Address)] += _amount;
        lockedErc20Balance[IERC20(_erc20Address)] -= _amount;
        emit UnlockedAmount(_erc20Address, _amount, unlockedErc20Balance[IERC20(_erc20Address)]);
    }

    // @notice transferTo only to send valid ERC20 tokens to buyer
    function transferTo(address _erc20Address, address _buyer, uint256 _amount) 
        onlyOptionContract(msg.sender)
        validAddress(_erc20Address)
        reentrancyGuard
        public
    {
        require(unlockedErc20Balance[IERC20(_erc20Address)] >= _amount, 'Not enough unlocked tokens');
        unlockedErc20Balance[IERC20(_erc20Address)] -= _amount;
        
        bool success = IERC20(_erc20Address).transferFrom(address(this), _buyer, _amount);
        require(success, 'Transfer failed');

        emit TransferedAmount(_erc20Address, _amount);
    }

    function getLockedAmount(address _erc20Address) 
        validAddress(_erc20Address) 
    external view returns (uint256){
        return lockedErc20Balance[IERC20(_erc20Address)];
    }

    function getUnLockedAmount(address _erc20Address) 
        validAddress(_erc20Address) 
    external view returns (uint256){
        return unlockedErc20Balance[IERC20(_erc20Address)];
    }

}