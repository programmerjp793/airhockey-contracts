// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract RewardEngine is Ownable, ReentrancyGuard, Pausable {

    event RewardSent(address indexed player, uint256 amount, string reason, uint256 timestamp);
    event FiatPurchaseProcessed(address indexed player, uint256 fiatAmountCentavos, string provider, string referenceId, uint256 timestamp);
    event BackendSignerUpdated(address indexed oldSigner, address indexed newSigner);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event FundsDeposited(address indexed from, uint256 amount);

    address public companyTreasury;
    address public backendSigner;
    mapping(string => bool) public processedRefs;

    constructor(
        address _companyTreasury,
        address _backendSigner
    ) Ownable(msg.sender) payable {
        require(_companyTreasury != address(0), "Invalid treasury");
        require(_backendSigner   != address(0), "Invalid backend signer");
        companyTreasury = _companyTreasury;
        backendSigner   = _backendSigner;
    }

    modifier onlyBackend() {
        require(msg.sender == backendSigner, "RewardEngine: not backend signer");
        _;
    }

    function setBackendSigner(address _new) external onlyOwner {
        require(_new != address(0), "Invalid address");
        emit BackendSignerUpdated(backendSigner, _new);
        backendSigner = _new;
    }

    function setCompanyTreasury(address _new) external onlyOwner {
        require(_new != address(0), "Invalid address");
        emit TreasuryUpdated(companyTreasury, _new);
        companyTreasury = _new;
    }

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value);
    }

    function depositRewardPool() external payable {
        require(msg.value > 0, "Must send ETH");
        emit FundsDeposited(msg.sender, msg.value);
    }

    function withdrawETH(uint256 _amount) external onlyOwner {
        require(_amount <= address(this).balance, "Insufficient balance");
        (bool ok, ) = payable(owner()).call{value: _amount}("");
        require(ok, "Withdraw failed");
    }

    /// @notice Send ETH reward to player after winning a match
    function rewardPlayer(
        address _player,
        uint256 _amount,
        string calldata _reason
    ) external onlyBackend nonReentrant whenNotPaused {
        require(_player != address(0),            "Invalid player address");
        require(_amount  > 0,                     "Amount must be > 0");
        require(address(this).balance >= _amount, "Insufficient reward pool");

        (bool ok, ) = payable(_player).call{value: _amount}("");
        require(ok, "ETH transfer failed");

        emit RewardSent(_player, _amount, _reason, block.timestamp);
    }

    /// @notice Record fiat purchase on-chain after PayMongo/GCash confirms
    function processFiatPurchase(
        address _player,
        uint256 _fiatCentavos,
        string calldata _provider,
        string calldata _referenceId
    ) external onlyBackend nonReentrant whenNotPaused {
        require(_player        != address(0), "Invalid player");
        require(_fiatCentavos   > 0,          "Fiat amount must be > 0");
        require(!processedRefs[_referenceId], "Reference already processed");

        processedRefs[_referenceId] = true;

        emit FiatPurchaseProcessed(_player, _fiatCentavos, _provider, _referenceId, block.timestamp);
    }

    function getRewardPoolBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function isRefProcessed(string calldata _ref) external view returns (bool) {
        return processedRefs[_ref];
    }
}
