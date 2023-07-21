// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import "./interfaces/IRoleContract.sol";
import "./TransferHelper.sol";

contract InvestPool is Ownable {
    // =================================
    // Storage
    // =================================

    IRoleContract public immutable rolesContract;
    address public immutable LPtoken;
    address public immutable paymentToken;
    uint8 private immutable paymentTokenDecimals;
    address public immutable fundrisingWallet;

    uint256 public baseFee;
    uint256 public price;

    uint256 public maxAmountToSell;
    uint256 public alreadySold;
    uint256 public totalPaymentTokenSpended;
    uint256 public totalLPDeposited;

    mapping(address => uint256) public alreadyBought;

    struct RoleSettings {
        uint256 startTime;
        uint256 deadline;
        uint256 roleFee;
        uint256 maxAmountToSellForRole;
        uint256 soldAmountForThisRole;
        uint256 totalAmountOfPaymentTokenSpended;
    }

    mapping(uint256 => RoleSettings) public roleSettings;

    struct RoleSettingsSetter {
        uint256 roleNumber;
        uint256 startTime;
        uint256 deadline;
        uint256 roleFee;
        uint256 maxAmountToSellForRole;
    }

    address public manager;

    // =================================
    // Modifier
    // =================================

    modifier onlyManager() {
        require(msg.sender == manager || msg.sender == owner(), "OM");
        _;
    }

    // =================================
    // Constructor
    // =================================

    constructor(
        address _LPtoken,
        address _rolesContract,
        address _paymentToken,
        address _fundrisingWallet,
        uint256 _baseFee,
        uint256 _price,
        uint256 _maxAmountToSell,
        address _manager,
        RoleSettingsSetter[] memory _roleSettings
    ) {
        require(_baseFee <= 1000, "FTH");

        LPtoken = _LPtoken;
        rolesContract = IRoleContract(_rolesContract);
        paymentToken = _paymentToken;
        paymentTokenDecimals = IERC20Metadata(_paymentToken).decimals();
        fundrisingWallet = _fundrisingWallet;

        baseFee = _baseFee;
        price = _price;
        maxAmountToSell = _maxAmountToSell;
        manager = _manager;

        setRoleSetting(_roleSettings); // @audit change `settings` to `setting`
    }

    // =================================
    // Functions
    // =================================

    function buy(uint256 paymentTokenAmount) external {
        uint256 userRoleNum = rolesContract.getRoleNumber(msg.sender);
        (uint256 minAmountForRole, uint256 maxAmountForRole) = rolesContract
            .getAmounts(msg.sender);

        RoleSettings storage userRole = roleSettings[userRoleNum];

        uint256 afterFeesPaymentTokenAmount = (paymentTokenAmount *
            (1000 - (userRole.roleFee == 0 ? baseFee : userRole.roleFee))) /
            1000;

        uint256 tokenAmount = (afterFeesPaymentTokenAmount *
            (10 ** (20 - paymentTokenDecimals))) / price;

        require(
            afterFeesPaymentTokenAmount >= minAmountForRole &&
                alreadyBought[msg.sender] + afterFeesPaymentTokenAmount <=
                maxAmountForRole,
            "IA"
        );
        require(
            block.timestamp >= userRole.startTime &&
                block.timestamp <= userRole.deadline,
            "TE"
        );
        require(
            userRole.soldAmountForThisRole + tokenAmount <=
                userRole.maxAmountToSellForRole,
            "RR"
        );
        require(alreadySold + tokenAmount <= maxAmountToSell, "LT");

        TransferHelper.safeTransferFrom(
            paymentToken,
            msg.sender,
            fundrisingWallet,
            paymentTokenAmount
        );

        alreadyBought[msg.sender] += afterFeesPaymentTokenAmount;
        userRole.soldAmountForThisRole += tokenAmount;
        alreadySold += tokenAmount;
        totalPaymentTokenSpended += paymentTokenAmount;
        userRole.totalAmountOfPaymentTokenSpended += paymentTokenAmount;

        TransferHelper.safeTransfer(LPtoken, msg.sender, tokenAmount);
    }

    // =================================
    // Admin functions
    // =================================

    function setMaxAmountToSell(uint256 _maxAmountToSell) external onlyManager {
        maxAmountToSell = _maxAmountToSell;
    }

    function setRoleSetting(
        RoleSettingsSetter[] memory _rolesSetting // @audit add array instead of struct
    ) public onlyManager {
        // @audit make public and add `for loop` to set initial value.
        for (uint i = 0; i < _rolesSetting.length; i++) {
            roleSettings[_rolesSetting[i].roleNumber].startTime = _rolesSetting[
                i
            ].startTime;
            roleSettings[_rolesSetting[i].roleNumber].deadline = _rolesSetting[
                i
            ].deadline;
            roleSettings[_rolesSetting[i].roleNumber].roleFee = _rolesSetting[i]
                .roleFee;
            roleSettings[_rolesSetting[i].roleNumber]
                .maxAmountToSellForRole = _rolesSetting[i]
                .maxAmountToSellForRole;
        }
    }

    function setPrice(uint256 _price) external onlyManager {
        price = _price;
    }

    function setBaseFee(uint256 _baseFee) external onlyManager {
        require(_baseFee <= 1000, "FTH");
        baseFee = _baseFee;
    }

    function updateSettings(
        RoleSettingsSetter[] memory _roleSettings,
        uint256 _price,
        uint256 _baseFee,
        uint256 _maxAmountToSell
    ) external onlyManager {
        setRoleSetting(_roleSettings); // @audit change `settings` to `setting`
        price = _price;
        baseFee = _baseFee;
        maxAmountToSell = _maxAmountToSell;
    }

    function depositLPtoken(uint256 _amount) external onlyManager {
        TransferHelper.safeTransferFrom(
            LPtoken,
            msg.sender,
            address(this),
            _amount
        );
        totalLPDeposited += _amount;
    }

    function withdrawLPtoken(
        address _to,
        uint256 _amount
    ) external onlyManager {
        TransferHelper.safeTransfer(LPtoken, _to, _amount);
        if (totalLPDeposited >= _amount) {
            totalLPDeposited -= _amount;
        } else {
            totalLPDeposited = 0;
        }
    }

    function setManager(address _manager) external onlyOwner {
        manager = _manager;
    }
}
