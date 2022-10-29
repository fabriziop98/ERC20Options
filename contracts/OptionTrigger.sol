// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC20Pool.sol";
import "../interfaces/IERC20.sol";

contract OptionTrigger is Ownable {
    enum State {
        Active,
        Locked,
        Exercised,
        Expired
    }
    enum OptionType {
        Put,
        Call
    }
    struct Option {
        State state;
        OptionType optionType;
        address creator;
        address beneficiary;
        uint256 strike;
        uint256 amount;
        uint256 premium;
        uint256 expiration;
        //ERC20
        address paymentToken;
        address optionToken;
    }

    struct PeerOption {
        uint256 optionId;
        State state;
        address creator;
        address beneficiary;
    }

    bool internal locked;  
    Option[] public options;
    ERC20Pool private erc20Pool;
    mapping(address => PeerOption[]) public peers;

    // Events
    event OptionCreated(uint256 indexed optionId, address holder, OptionType optionType);
    event OptionLocked(uint256 indexed optionId, address beneficiary);
    event OptionExecuted(uint256 indexed optionId);

    // Modifiers
    modifier reentrancyGuard() {
        require(!locked);
        locked = true;
        _;
        locked = false;
    }

    modifier validAddress(address _address) {
        require(_address != address(0), "Zero address");
        _;
    }

    constructor(address _erc20Pool) {
        erc20Pool = ERC20Pool(_erc20Pool);
    }

    // Create CALL option
    function createCallOption(
        uint256 strike,
        uint256 amount,
        uint256 premium,
        uint256 period,
        address paymentToken,
        address optionToken
    )
        external
        validAddress(paymentToken)
        validAddress(optionToken)
        reentrancyGuard
        returns (uint256 optionID)
    {
        require(strike > 0, "Strike is too small");
        require(amount > 0, "Amount is too small");
        require(period >= 1 days, "Period is too short");
        require(period <= 4 weeks, "Period is too long");

        // Create new Option
        optionID = options.length;
        options.push(
            Option(
                State.Active,
                OptionType.Call,
                msg.sender,
                address(0),
                strike,
                amount,
                premium,
                block.timestamp + period,
                paymentToken,
                optionToken
            )
        );

        // Create option owner mapper
        peers[msg.sender].push(
            PeerOption(optionID, State.Active, msg.sender, address(0))
        );

        //TODO: calculate fees and substract it from amount

        // Validate ERC20 amount and transfer it
        bool transfered = IERC20(optionToken).transferFrom(
            msg.sender,
            address(erc20Pool),
            amount
        );
        require(transfered, "Transfer not posible");

        // Lock funds in erc20Pool
        erc20Pool.lock(optionToken, amount);

        emit OptionCreated(optionID, msg.sender, OptionType.Call);

    }

    // Buy CALL option
    function buyCallOption(
        uint256 optionID,
        address paymentToken,
        uint256 amount
    )   external 
        reentrancyGuard
    {
        Option memory _option = options[optionID];

        // Check for valid option
        require(State.Active == _option.state, "Option not active");
        require(paymentToken == _option.paymentToken, "Payment token not valid");
        require(amount == _option.amount, "Premium amount not valid");

        // Update option attr
        _option.state = State.Locked;
        _option.beneficiary = msg.sender;
        options[optionID] = _option;

        // Find PeerOption of creator and assign beneficiary address to same PeerOption
        PeerOption[] memory _peers = peers[_option.creator];
        for(uint i = 0; i < _peers.length; i++){
            if(_peers[i].optionId == optionID){
                _peers[i].state = State.Locked;
                _peers[i].beneficiary = msg.sender;
                // Update PeerOption of creator
                peers[_option.creator][i] = _peers[i];
                // Add PeerOption to beneficiary's array
                peers[msg.sender].push(_peers[i]);
            }
        }

        //TODO: calculate fees and substract it from prime amount and transfer to pool

        // Transfer premium to option creator
        bool transfered = IERC20(paymentToken).transferFrom(
            msg.sender,
            address(_option.creator),
            amount
        );
        require(transfered, "Transfer not posible");

        emit OptionLocked(optionID, msg.sender);
    }

    function createPutOption(
        uint256 strike,
        uint256 amount,
        uint256 premium,
        uint256 period,
        address paymentToken,
        address optionToken
    )   external
        validAddress(paymentToken)
        validAddress(optionToken)
        reentrancyGuard
    returns (uint256 optionID)
    {
        require(strike > 0, "Strike is too small");
        require(amount > 0, "Amount is too small");
        require(period >= 1 days, "Period is too short");
        require(period <= 4 weeks, "Period is too long");

        // Create new Option
        optionID = options.length;
        options.push(
            Option(
                State.Active,
                OptionType.Put,
                msg.sender,
                address(0),
                strike,
                amount,
                premium,
                block.timestamp + period,
                paymentToken,
                optionToken
            )
        );

        // Create option owner mapper
        peers[msg.sender].push(
            PeerOption(optionID, State.Active, msg.sender, address(0))
        );

        // Transfer premium to pool


        emit OptionCreated(optionID, msg.sender, OptionType.Put);
    }

    function buyPutOption(
        uint256 optionID,
        address paymentToken,
        address optionToken,
        uint256 amount,
        uint256 premium
    )   external 
        reentrancyGuard
    {

        //Lock tokens when buyer buys put option    

        Option memory _option = options[optionID];

        // Check for valid option
        require(State.Active == _option.state, "Option not active");
        require(paymentToken == _option.paymentToken, "Payment token not valid");
        require(amount == _option.amount, "Premium amount not valid");

        // Update option attr
        _option.state = State.Locked;
        _option.beneficiary = msg.sender;
        options[optionID] = _option;

        // Find PeerOption of creator and assign beneficiary address to same PeerOption
        PeerOption[] memory _peers = peers[_option.creator];
        for(uint i = 0; i < _peers.length; i++){
            if(_peers[i].optionId == optionID){
                _peers[i].state = State.Locked;
                _peers[i].beneficiary = msg.sender;
                // Update PeerOption of creator
                peers[_option.creator][i] = _peers[i];
                // Add PeerOption to beneficiary's array
                peers[msg.sender].push(_peers[i]);
            }
        }

        // Lock buyer's tokens in pool
        _transferOptionToken(optionToken, amount)

        // Transfer premium to buyer
        bool premiumTransfered = IERC20(paymentToken).transferFrom(msg.sender, _option.creator, premium);
        require(premiumTransfered, "Premium transfer not posible");



    }

    // Transfer optionToken to lock funds in ERC20Pool
    function _transferOptionToken(address optionToken, uint256 amount)
        internal
        validAddress(optionToken)
    {
        require(amount > 0, "Amount not valid");
        bool transfered = IERC20(optionToken).transferFrom(
            msg.sender,
            address(erc20Pool),
            amount
        );
        require(transfered, "Transfer not posible");
    }

    function _transferPremium(address paymentToken, address _address, uint256 amount)
        internal
        validAddress(optionToken)
    {

    }

    // TODO: Transfer fee
    // function transferFee(uint256 amount) internal {
    //     require(amount > 0, "Amount not valid");
    // }
}
