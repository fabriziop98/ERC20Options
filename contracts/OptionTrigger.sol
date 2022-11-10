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
        Cancel /* 4 */
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
                optionToken
            )
        );
        // Add to seller
        sellerOptions[msg.sender].push(optionID);

        //TODO: calculate fees and substract it from amount

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

         console.log("buyPtion despiues");

        emit OptionLocked(optionID, msg.sender);
    }

    function excerciseOption(
        uint256 optionID,
        address paymentToken,
        uint256 amount
    ) public {
        Option memory _option = options[optionID];

        console.log("block timestamp: ", block.timestamp);
        console.log("option expiration: ", _option.expiration);

        require(_option.buyer == msg.sender, "You don't buy the option");
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
     * @notice Seller create the option, in the type specified if is put or call option.
     * @dev approve() should be called before invoking this function OR a permitSignature can be passed in
     *
     */
    /*  function createOption(
        uint256 strike,
        uint256 amount,
        uint256 premium,
        uint256 period,
        address paymentToken,
        address optionToken
    )   validAddress(paymentToken)
        validAddress(optionToken) 
    external returns (uint256 optionID)
    {
        require(strike > 0, "Strike is too small");
        require(amount > 0, "Amount is too small");
        require(period >= 1 days, "Period is too short");
        require(period <= 4 weeks, "Period is too long");
        // Validate ERC20 amount and transfer it
        bool transfered = IERC20(optionToken).transferFrom(msg.sender, address(erc20Pool), amount);
        require(transfered, "Transfer not posible");
        // Lock funds in erc20Pool
        erc20Pool.lock(optionToken, amount);

        // Create new Option 
        optionID = options.length;
        options.push( 
            Option(
                State.Active,
                msg.sender,
                address(0),
                strike,
                amount,
                premium,
                block.timestamp + period,
                OptionType(1),
                paymentToken,
                optionToken
            )
        );

        //TODO: calculate fees and substract it from amount

       

      
    } */

    // Transfer optionToken to lock funds in ERC20Pool
    /*     function transferOptionToken(address optionToken, uint256 amount)
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
    } */

    /**
     * @notice Seller could cancel option only if is in state New.
     * Nobody at the moment buy this option.
     * @param _indexOpt - index of the option in array options
     */

    function cancelOption(uint _indexOpt) external virtual {
        /* require(options[_indexOpt].seller == msg.sender, "You are not the owner of the option");
           require(options[_indexOpt].state != State.New, "Cannot cancel the option");
           options[_indexOpt].state = State.Cancel;       */
        /*  bool transfered = IERC20(options[_indexOpt].optionToken).transferFrom(address(erc20Pool), msg.sender, options[_indexOpt].amount);
           require(transfered, "Transfer not posible"); */
    }

    /**
     * @notice Seller could cancel option only if is in state New.
     * Nobody at the moment buy this option.
     *
     */

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

    // Transfer fee
    /*   function transferFee(uint256 amount) internal {
        require(amount > 0, "Amount not valid");
    } */
}
