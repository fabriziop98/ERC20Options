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

    constructor() {}

    // Modifiers
    modifier reentrancyGuard() {
        require(!locked);
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

    function receiveFee(address _erc20Address, uint256 _amount)
        external
        validAddress(_erc20Address)
        validAmount(_amount)
    {}

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

    function excerciseErc20(
        address _buyer,
        address _seller,
        address _paymentToken,
        uint256 _amountPayment,
        address _optionToken,
        uint256 _amountOption
    ) external onlyOptionContract(msg.sender) {

        //transfer from buyer to seller
        transferErc20(_paymentToken,_buyer,_seller,_amountPayment);
        //unlock money from pool
        unlock(_amountOption, _optionToken);
        //transfer pool to buyer
        transferTo(_optionToken,_buyer,_amountOption);
      
    }

    // @notice transferTo only to send valid ERC20 tokens to buyer
    function transferTo(
        address _erc20Address,
        address _buyer,
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

        bool success = IERC20(_erc20Address).transferFrom(
            address(this),
            _buyer,
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

    function transferErc20(
        address _token,
        address _sender,
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
}
