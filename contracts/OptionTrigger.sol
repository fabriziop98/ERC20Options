// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC20Pool.sol";
// import "../interfaces/IERC20.sol";

contract OptionTrigger is Ownable {

    enum State {
        New, /* 0 */
        Locked, /* 1 */
        Exercised, /* 2 */
        Expired, /* 3 */
        Canceled /* 4 */
    }
    enum OptionType {
        Call,
        Put
    }
    struct Option {
        State state;
        address seller;
        address buyer;
        //Payment token amount
        uint256 strike;
        //Amount of optionToken that will be offered in the option.
        uint256 amount;
        //Calculate in payment Tokens
        uint256 premium;
        //We will use An American option that allows holders to exercise their rights
        //at any time before and including the expiration date.
        uint256 expiration;
        //Know if is a Put or Call option
        OptionType optionType;
        //type of ERC20 that the strike will be
        address paymentToken;
        //ERC20 that will be offered in the option
        address optionToken;
        //Fee registered
        uint256 fee;
    }
    bool internal locked;

    ERC20Pool public erc20Pool;
    Option[] public options;
    mapping(address => uint[]) public sellerOptions;
    mapping(address => uint[]) public buyerOptions;

    // Events
    event OptionCreated(
        uint256 indexed optionId,
        address seller,
        OptionType optionType
    );
    event OptionLocked(uint256 indexed optionId, address buyer);
    event OptionExecuted(uint256 indexed optionId);

    // Modifiers
    modifier validAddress(address _address) {
        require(_address != address(0), "Zero address");
        _;
    }
    modifier reentrancyGuard() {
        require(!locked);
        locked = true;
        _;
        locked = false;
    }

    /**
     * @notice initializes the contract with the address of the pool.
     */
    constructor(address _erc20Pool)
    {
        erc20Pool = ERC20Pool(_erc20Pool);
    }

    function sellOption(
        uint256 strike,
        uint256 amount,
        uint256 premium,
        uint256 period,
        address paymentToken,
        address optionToken,
        OptionType optionType // 0 -> Call, 1 -> Put
    ) external
        validAddress(paymentToken)
        validAddress(optionToken)
        reentrancyGuard
        returns (uint256 optionID)
    {
        require(strike > 0, "Strike is too small");
        require(amount > 0, "Amount is too small");
        require(period >= 1 days, "Period is too short");
        require(period <= 4 weeks, "Period is too long");

        optionID = options.length;

        uint256 fee = calculateFee(amount);
        console.log("amount: ", amount);
        console.log("fee: ",fee);

        //efective amount: amount - fee
        amount -= fee;
        options.push(
            Option(
                State.New,
                msg.sender,
                address(0),
                strike,
                amount,
                premium,
                block.timestamp + period,
                optionType,
                paymentToken,
                optionToken,
                fee
            )
        );
        // Add to seller
        sellerOptions[msg.sender].push(optionID);

        sendFee(msg.sender, optionToken, fee);

        erc20Pool.transferLockedErc20(msg.sender, optionToken, amount);

        emit OptionCreated(optionID, msg.sender, optionType);
    }

    function buyOption(
        uint256 optionID,
        address paymentToken,
        uint256 premium
    ) external {
        Option memory _option = options[optionID];

        // Check for valid option
        require(State.New == _option.state, "Option not active");
        require(
            paymentToken == _option.paymentToken,
            "Payment token not valid"
        );
        require(premium == _option.premium, "Premium amount not valid");

        _option.state = State.Locked;
        _option.buyer = msg.sender;
        options[optionID] = _option;

        buyerOptions[msg.sender].push(optionID);

        erc20Pool.transferErc20(
            _option.buyer, //sender
            paymentToken, //token
            _option.seller, //reciever
            premium //amount
        );

        emit OptionLocked(optionID, msg.sender);
    }

    function exerciseOption(
        uint256 optionID,
        address paymentToken,
        uint256 amount
    ) public {
        Option memory _option = options[optionID];

        require(_option.buyer == msg.sender, "You are not the buyer");
        // The option expiration has to be in the future.
        require(_option.expiration >= block.timestamp, "The option expired");
        require(_option.state == State.Locked, "The option is not locked");
        require(
            paymentToken == _option.paymentToken,
            "Payment token not valid"
        );
        require(amount == _option.amount, "Amount is not valid");

        _option.state = State.Exercised;

        options[optionID] = _option;

        erc20Pool.exerciseErc20(
            _option.buyer,
            _option.seller,
            paymentToken,
            amount,
            _option.optionToken,
            _option.amount
        );
        emit OptionExecuted(optionID);
    }

    /**
     * @notice Seller could cancel option only if it is in state New or Expired
     * Nobody at the moment can buy this option.
     * @param _optionId - index of the option in array options
     */
    function cancelOption(uint _optionId) external virtual {
        Option memory _option = options[_optionId];
        require(_option.seller == msg.sender, "You are not the owner of the option");
        require(_option.state == State.New || _option.state == State.Expired, "Cannot cancel the option");
        _option.state = State.Canceled;
        //Transfer to owner of the option
        erc20Pool.unlockAndSendErc20(_option.optionToken ,_option.seller, _option.amount);
        options[_optionId] = _option;
    }

    // Calculate fee
    function calculateFee(uint256 _optionAmount) internal pure
        returns (uint256) 
    {
        require(_optionAmount > 0 && _optionAmount / 100 > 0, "Option amount not valid");
        return _optionAmount / 100;
    }

    function sendFee(address _sender, address _erc20, uint256 _amount) 
        internal
    {
        //Validations are made in receiveFee method
        erc20Pool.receiveFee(_sender, _erc20, _amount);
    }

    function getBuyerOptions(address _address) public view returns (uint[] memory) {
        return buyerOptions[_address];
    }

    function getSellerOptions(address _address) public view returns (uint[] memory) {
        return sellerOptions[_address];
    }

    function getOption(uint _index) public view returns (Option memory) {
        return options[_index];
    }

    function getAllOptions() public view returns (Option[] memory) {
        return options;
    }

}
