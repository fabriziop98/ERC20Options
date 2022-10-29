// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC20Pool.sol";
import "../interfaces/IERC20.sol";

contract OptionTrigger is Ownable {
    enum State {
        New,
        Active,
        Exercised,
        Expired,
        Cancel
    }
    enum OptionType {
        Put,
        Call
    }
    struct Option {
        State state;
        address seller;
        address buyer;
        //Quantity of paymentToken that holder will be able to swap for optionToken
        uint256 strike;
        //Amount of optionToken that it will be swap.
        uint256 amount;
        //Calculate in payment Token
        uint256 premium;
        //We will use An American option that allows holders to exercise their rights
        //at any time before and including the expiration date.
        uint256 expiration;
        //Know if is a Put or Call option
        OptionType typeOpt;
        //ERC20
        address paymentToken;
        address optionToken;
    }
    Option[] public options;
    ERC20Pool private erc20Pool;
    
    mapping(address => uint[]) public sellerOptions;
    mapping(address => uint[]) public buyerOptions;


    // Events
    event OptionCreated(address indexed optionId, address holder);
    event OptionExecuted(address indexed optionId);

    // Modifiers
    modifier validAddress(address _address) {
        require(_address != address(0), "Zero address");
        _;
    }

     /**
     * @notice initializes the contract with the address of the pool.
     */
    constructor(address _erc20Pool) {
        erc20Pool = ERC20Pool(_erc20Pool);
    }


 

     /**
     * @notice Seller create the option, in the type specified if is put or call option. 
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
                OptionType(1),
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
     
     /**
     * @notice Seller could cancel option only if is in state New. 
     * Nobody at the moment buy this option.
     * @param _indexOpt - index of the option in array options
     */

    function cancelOption(uint _indexOpt) public{           
           
           require(options[_indexOpt].seller == msg.sender, "You are not the owner of the option");
           require(options[_indexOpt].state != State.New, "Cannot cancel the option");
           options[_indexOpt].state = State.Cancel;           
           bool transfered = IERC20(options[_indexOpt].optionToken).transferFrom(address(erc20Pool), msg.sender, options[_indexOpt].amount);
           require(transfered, "Transfer not posible");

    }


    // Transfer fee
    function transferFee(uint256 amount) internal {
        require(amount > 0, "Amount not valid");
    }
}
