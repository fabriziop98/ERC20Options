// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IUniswapV2Factory} from "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import {IUniswapV2Pair} from "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import {IUniswapV2Callee} from "@uniswap/v2-core/contracts/interfaces/IUniswapV2Callee.sol";
import {SingleSwap} from "./UniswapSwapV3.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC20Pool.sol";
import "hardhat/console.sol";

contract OptionTrigger is Ownable, IUniswapV2Callee {
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

    uint  private constant INETH = 10**18;
    ERC20Pool public erc20Pool;
    SingleSwap singleSwap;
    Option[] public options;
    mapping(address => uint[]) public sellerOptions;
    mapping(address => uint[]) public buyerOptions;
    //Erc20 WETH
    address private constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    // Uniswap V2 factory
    address private constant FACTORY =
        0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;

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
    constructor(address _erc20Pool) {
        erc20Pool = ERC20Pool(_erc20Pool);
        singleSwap = new SingleSwap();
    }

    function sellOption(
        uint256 strike,
        uint256 amount,
        uint256 premium,
        uint256 period,
        address paymentToken,
        address optionToken,
        OptionType optionType // 0 -> Call, 1 -> Put
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

        optionID = options.length;

        uint256 fee = calculateFee(amount);

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
        require(amount == _option.strike, "Amount is not valid");

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
     * @notice Buyer can exercise the option using a FlashLoan provided in
     * the Dapp
     * @param optionID - Index of the option in array options
     * @param paymentToken - Erc20 that user will borrow to UniSwap
     * @param amount - Amount of the token that user can use to buy the asset at strike price.
     */
    function exerciseOptionFlashLoan(
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
        require(amount == _option.strike, "Amount is not valid");

        _option.state = State.Exercised;

        options[optionID] = _option;

        //FlashLoan Logic
        //1.Verify that the pair TokenBorrow / WETH exists
        address pair = IUniswapV2Factory(FACTORY).getPair(paymentToken, WETH);
        require(pair != address(0), "!pair");
        //2.See which is the token that we want to borrow, and put the other in 0.
        //Remember that is a pair, and we want one token of the two tokens in the pool.
        address token0 = IUniswapV2Pair(pair).token0();
        address token1 = IUniswapV2Pair(pair).token1();
        uint amount0Out = paymentToken == token0 ? amount : 0;
        uint amount1Out = paymentToken == token1 ? amount : 0;

        //3.Need to pass some data the uniswapV2Call.
        bytes memory data = abi.encode(paymentToken, amount, _option);

        //4.Sends the call to Execute the flashLoan. Internally swap call uniswapV2Call.
        //That is the method internally that do the flashloan.
        //Inside that method you have the flashloan Available.
        IUniswapV2Pair(pair).swap(amount0Out, amount1Out, address(this), data);

        emit OptionExecuted(optionID);
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
        //Verify that only this contract can call this method
        require(_sender == address(this), "Only Contract can call this method");

        (address tokenBorrow, uint amount, Option memory option) = abi.decode(
            _data,
            (address, uint, Option)
        );

        console.log(
            "We borrow(FlashLoan) in DAI to excersice the option and get : ",
            IERC20(tokenBorrow).balanceOf(address(this)) / INETH
        );
        // Calculate fee that we have to pay 0.3%
        uint fee = ((amount * 3) / 997) + 1;
        uint amountToRepay = amount + fee;
        console.log(
            "Total that we have to pay(flashloan + fee): ",
            amountToRepay / INETH
        );

        //We have to approve to the pool to use our 1000 DAI to excersice the option and get 1 WETH
        IERC20(tokenBorrow).approve(address(erc20Pool), amount);

        console.log(
            "We approve to our pool the borrow DAI : ",
            IERC20(tokenBorrow).allowance(address(this), address(erc20Pool)) / INETH
        );
        //2 We excersice and we get aproximatly 1 ETH
        erc20Pool.exerciseErc20(
            address(this),
            option.seller,
            tokenBorrow,
            amount,
            option.optionToken,
            option.amount
        );

        uint balanceTokenExcercise = IERC20(option.optionToken).balanceOf(
            address(this)
        ); // Our Balance
        console.log(
            "After excercise we get in WETH: (1 WETH - fee): ",
            balanceTokenExcercise 
        );
        //2 Now we need to transfer our 1 WETH to singleSwap Contract
        IERC20(option.optionToken).transfer(
            address(singleSwap),
            balanceTokenExcercise
        );
        //3 Now we need to swap our 1 WETH to DAI (aprox 1200)
        singleSwap.swapExactInputSingle(
            option.optionToken, //WETH address
            tokenBorrow, //DAI address
            option.amount,
            address(this) // DAI Will be transfer HERE
        );

        uint tokensReceive = IERC20(tokenBorrow).balanceOf(address(this)); // Our Balance
        
        console.log(
            "We SWAP WETH TO DAI and have this quantity ",
            (tokensReceive / INETH)
        );

        //We finally PAY our flashLoan
        console.log("We Repay our FlashLoan", amountToRepay / INETH  );
        IERC20(tokenBorrow).transfer(pair, amountToRepay);
        uint profit = IERC20(tokenBorrow).balanceOf(address(this));
        console.log(
            "We have this profit in DAI",
            profit / INETH
        );

        //We Transfer profit to the Buyer
        if(profit > 0) {
            IERC20(tokenBorrow).transfer(
            address(option.buyer),
            profit
        );
        
        }
    }

    /**
     * @notice Seller could cancel option only if it is in state New or Expired
     * Nobody at the moment can buy this option.
     * @param _optionId - index of the option in array options
     */
    function cancelOption(uint _optionId) external virtual {
        Option memory _option = options[_optionId];
        require(
            _option.seller == msg.sender,
            "You are not the owner of the option"
        );
        require(
            _option.state == State.New || _option.state == State.Expired || (_option.state == State.Locked && block.timestamp >= _option.expiration),
            "Cannot cancel the option"
        );
        _option.state = State.Canceled;
        //Transfer to owner of the option
        erc20Pool.unlockAndSendErc20(
            _option.optionToken,
            _option.seller,
            _option.amount
        );
        options[_optionId] = _option;
    }

    // Calculate fee
    function calculateFee(uint256 _optionAmount)
        internal
        pure
        returns (uint256)
    {
        require(
            _optionAmount > 0 && _optionAmount / 100 > 0,
            "Option amount not valid"
        );
        return _optionAmount / 100;
    }

    function sendFee(
        address _sender,
        address _erc20,
        uint256 _amount
    ) internal {
        //Validations are made in receiveFee method
        erc20Pool.receiveFee(_sender, _erc20, _amount);
    }

    function getBuyerOptions(address _address)
        public
        view
        returns (uint[] memory)
    {
        return buyerOptions[_address];
    }

    function getSellerOptions(address _address)
        public
        view
        returns (uint[] memory)
    {
        return sellerOptions[_address];
    }

    function getOption(uint _index) public view returns (Option memory) {
        return options[_index];
    }

    function getAllOptions() public view returns (Option[] memory) {
        return options;
    }
}
