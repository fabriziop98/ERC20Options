// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IERC20.sol";
import "hardhat/console.sol";

contract ERC20Pool is Ownable {
    bool internal locked;
    mapping(IERC20 => uint256) public lockedErc20Balance;
    mapping(IERC20 => uint256) public unlockedErc20Balance;

    address public optionTrigger;
    mapping(IERC20 => uint256) public fees;

    // Events
    event LockedAmount(address erc20, uint256 amount, uint256 newAmount);
    event UnlockedAmount(address erc20, uint256 amount, uint256 newAmount);
    event TransferedAmount(address erc20, uint256 amount);
    event FeeReceived(address erc20, uint256 amount);

    constructor() {}

    // Modifiers
    modifier reentrancyGuard() {
        require(!locked, "Reentrancy");
        locked = true;
        _;
        locked = false;
    }

    modifier onlyOptionContract(address _address) {
        require(_address == optionTrigger, "Caller is not valid");
        _;
    }

    modifier validAddress(address _address) {
        require(_address != address(0), "Zero address");
        _;
    }

    modifier validAmount(uint256 _amount) {
        require(_amount > 0, "Amount not valid");
        _;
    }

    function setOptionTrigger(address _address)
        external
        onlyOwner
        validAddress(_address)
    {
        optionTrigger = _address;
    }

    function receiveFee(address _sender, address _erc20Address, uint256 _amount)
        external
        validAddress(_erc20Address)
        validAmount(_amount)
    {
        fees[IERC20(_erc20Address)] += _amount;
        bool success = IERC20(_erc20Address).transferFrom(_sender, address(this), _amount);
        require(success, "Failed to receive fee");
        emit FeeReceived(_erc20Address, _amount);
    }

    // @notice lock for options protocol to lock erc20 compatible tokens to pool
    function lock(address _erc20Address, uint256 _amount)
        private
        validAddress(_erc20Address)
        validAmount(_amount)
    {
        lockedErc20Balance[IERC20(_erc20Address)] += _amount;

        emit LockedAmount(
            _erc20Address,
            _amount,
            lockedErc20Balance[IERC20(_erc20Address)]
        );
    }

    // @notice unlock for preparing tokens to be transfered for when an option has been executed or terminated
    function unlock(uint256 _amount, address _erc20Address)
        private
        onlyOptionContract(msg.sender)
        validAddress(_erc20Address)
        validAmount(_amount)
    {
        //Check erc20 and unlock balance
        require(
            lockedErc20Balance[IERC20(_erc20Address)] >= _amount,
            "Not enough locked tokens"
        );
        unlockedErc20Balance[IERC20(_erc20Address)] += _amount;
        lockedErc20Balance[IERC20(_erc20Address)] -= _amount;
        emit UnlockedAmount(
            _erc20Address,
            _amount,
            unlockedErc20Balance[IERC20(_erc20Address)]
        );
    }

    function transferLockedErc20(
        address _seller,
        address _token,
        uint256 _amount
    )
        external
        onlyOptionContract(msg.sender)
        validAmount(_amount)
        reentrancyGuard
    {
        bool transfered = IERC20(_token).transferFrom(
            _seller,
            address(this),
            _amount
        );
        require(transfered, "Transfer not posible");

        // Lock funds in erc20Pool
        lock(_token, _amount);
    }

    function transferErc20(
        address _sender,
        address _token,
        address _receiver,
        uint _amount
    )  public
        onlyOptionContract(msg.sender)
        validAddress(_token)
        validAmount(_amount) {
        bool transfered = IERC20(_token).transferFrom(
            _sender,
            _receiver,
            _amount
        );
        require(transfered, "Transfer not posible");
    }

    function exerciseErc20(
        address _buyer,
        address _seller,
        address _paymentToken,
        uint256 _paymentAmount,
        address _optionToken,
        uint256 _optionTokenAmount
    ) external onlyOptionContract(msg.sender) {

        //TODO: _optionTokenAmount can be less than option amount ? 

        //transfer from buyer to seller
        transferErc20(_buyer,_paymentToken,_seller,_paymentAmount);
        //unlock tokens from pool
        unlock(_optionTokenAmount, _optionToken);
        //transfer pool to buyer
        transferTo(_optionToken,_buyer,_optionTokenAmount);
      
    }

    function exerciseErc20WithFlashLoan(
        address _buyer,
        address _seller,
        address _paymentToken,
        uint256 _paymentAmount,
        address _optionToken,
        uint256 _optionTokenAmount
    ) external onlyOptionContract(msg.sender) {

        //TODO: _optionTokenAmount can be less than option amount ? 

        //transfer from buyer to seller
        transferErc20(_buyer,_paymentToken,_seller,_paymentAmount);
        //unlock tokens from pool
        unlock(_optionTokenAmount, _optionToken);
        //transfer pool to buyer

        console.log("Pool Balance", IERC20(_optionToken).balanceOf(address(this)));
        bool success = IERC20(_optionToken).approve(
            _buyer,
            _optionTokenAmount
        );
        require(success, "Transfer failed");
        //emit TransferedAmount(_erc20Address, _amount);
      
    }

    function unlockAndSendErc20(address _erc20, address _beneficiary, uint256 _amount)
        external
        onlyOptionContract(msg.sender)
        validAddress(_erc20)
    {
        //unlock tokens from pool
        unlock(_amount, _erc20);
        //transfer pool to buyer
        transferTo(_erc20, _beneficiary, _amount);
    }

    // @notice transferTo only to send valid ERC20 tokens to buyer
    function transferTo(
        address _erc20Address,
        address _beneficiary,
        uint256 _amount
    )
        public
        onlyOptionContract(msg.sender)
        validAddress(_erc20Address)
        reentrancyGuard
    {
        require(
            unlockedErc20Balance[IERC20(_erc20Address)] >= _amount,
            "Not enough unlocked tokens"
        );
        unlockedErc20Balance[IERC20(_erc20Address)] -= _amount;

        bool success = IERC20(_erc20Address).transfer(
            _beneficiary,
            _amount
        );
        require(success, "Transfer failed");
        emit TransferedAmount(_erc20Address, _amount);
    }

    function getLockedAmount(address _erc20Address)
        external
        view
        validAddress(_erc20Address)
        returns (uint256)
    {
        return lockedErc20Balance[IERC20(_erc20Address)];
    }


    function getUnLockedAmount(address _erc20Address)
        external
        view
        validAddress(_erc20Address)
        returns (uint256)
    {
        return unlockedErc20Balance[IERC20(_erc20Address)];
    }

    function getOptionTrigger() public view returns(address) {
        return optionTrigger;
    }

    function getFees(address _erc20) external view returns(uint256){
        return fees[IERC20(_erc20)];
    }
}
