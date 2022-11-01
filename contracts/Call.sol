// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./OptionTrigger.sol";

contract Call is OptionTrigger {
    ERC20Pool private erc20Pool;

    constructor(
        address _erc20Pool /* OptionTrigger(_erc20Pool) */
    ) {
        erc20Pool = ERC20Pool(_erc20Pool);
    }

    function sellOption(
        uint256 strike,
        uint256 amount,
        uint256 premium,
        uint256 period,
        address paymentToken,
        address optionToken
    )
        external
        virtual
        override
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
                paymentToken,
                optionToken
            )
        );
        // Add to seller
        sellerOptions[msg.sender].push(optionID);

        //TODO: calculate fees and substract it from amount

        erc20Pool.transferLockedErc20(msg.sender, optionToken, amount);

        emit OptionCreated(optionID, msg.sender, OptionType.Call);
    }

    function buyOption(
        uint256 optionID,
        address paymentToken,
        uint256 premium
    ) external virtual override {
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

        erc20Pool.transferPremium(
            paymentToken,
            _option.buyer,
            _option.seller,
            premium
        );

        emit OptionLocked(optionID, msg.sender);
    }

    function excerciseOption(
        uint256 optionID,
        address paymentToken,
        uint256 amount
    ) public virtual override returns (uint256) {
        Option memory _option = options[optionID];

        require(_option.buyer == msg.sender, "You don't buy the option");
        require(_option.expiration <= block.timestamp, "The option expired"); // Verify
        require(_option.state == State.Locked, "The option is not locked");
        require(
            paymentToken == _option.paymentToken,
            "Payment token not valid"
        );
        require(amount == _option.strike, "Amount is not valid");

        _option.state = State.Exercised;
    


        return 1;
    }

    function calculateFee() public {}
}
