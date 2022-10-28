// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC20Pool.sol";
import "../interfaces/IERC20.sol";

contract OptionTrigger is Ownable {
    enum State {
        Active,
        Exercised,
        Expired
    }
    enum OptionType {
        Put,
        Call
    }
    struct Option {
        State state;
        address seller;
        address buyer;
        uint256 strike;
        uint256 amount;
        uint256 premium;
        uint256 expiration;
        //ERC20
        address paymentToken;
        address optionToken;
    }
    Option[] public options;
    ERC20Pool private erc20Pool;
    mapping(address => uint[]) public users;

    // Events
    event OptionCreated(address indexed optionId, address holder);
    event OptionExecuted(address indexed optionId);

    // Modifiers
    modifier validAddress(address _address) {
        require(_address != address(0), "Zero address");
        _;
    }

     /**
     * @notice initializes the contract with te address of the pool.
     */
    constructor(address _erc20Pool) {
        erc20Pool = ERC20Pool(_erc20Pool);
    }

     /**
     * @notice Seller create the call option 
     * @dev approve() should be called before invoking this function OR a permitSignature can be passed in 
     *
     */
    function createOption(
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
                paymentToken,
                optionToken
            )
        );

        //TODO: calculate fees and substract it from amount

       

      
    }


    // Transfer optionToken to lock funds in ERC20Pool
    function transferOptionToken(address optionToken, uint256 amount)
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

    // Transfer fee
    function transferFee(uint256 amount) internal {
        require(amount > 0, "Amount not valid");
    }
}
