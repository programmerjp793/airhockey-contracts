// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract SmartStore is Ownable, ReentrancyGuard, Pausable {

    struct StoreItem {
        uint256 id;
        string  name;
        string  itemType;
        uint256 priceETH;
        uint256 pricePHP;
        uint8   tier;
        bool    active;
    }

    event ItemAdded(uint256 indexed itemId, string name, uint256 priceETH);
    event ItemUpdated(uint256 indexed itemId, uint256 newPriceETH, bool active);
    event ItemPurchased(address indexed player, uint256 indexed itemId, string itemType, uint256 priceETH, uint256 timestamp);
    event WalletUpgraded(address indexed player, uint8 tier, uint256 ethPaid, uint256 timestamp);

    address public companyTreasury;

    uint256 public nextItemId = 1;
    mapping(uint256 => StoreItem) public items;
    uint256[] public itemIds;

    mapping(address => mapping(uint256 => bool)) public playerOwns;
    mapping(address => uint8) public playerTier;

    constructor(address _companyTreasury) Ownable(msg.sender) {
        require(_companyTreasury != address(0), "Invalid treasury");
        companyTreasury = _companyTreasury;

        // Seed default items
        _addItem("Wallet Slot Upgrade I",  "wallet_upgrade", 0.001 ether, 15000, 1);
        _addItem("Wallet Slot Upgrade II", "wallet_upgrade", 0.003 ether, 45000, 2);
        _addItem("AI Replay Viewer",       "ai_replay",      0.001 ether,  9900, 0);
        _addItem("Custom Puck Skin",       "custom_skin",    0.0006 ether, 5900, 0);
    }

    function addItem(
        string calldata _name,
        string calldata _itemType,
        uint256 _priceETH,
        uint256 _pricePHP,
        uint8   _tier
    ) external onlyOwner {
        _addItem(_name, _itemType, _priceETH, _pricePHP, _tier);
    }

    function _addItem(
        string memory _name,
        string memory _itemType,
        uint256 _priceETH,
        uint256 _pricePHP,
        uint8   _tier
    ) internal {
        uint256 id = nextItemId++;
        items[id] = StoreItem({ id: id, name: _name, itemType: _itemType,
            priceETH: _priceETH, pricePHP: _pricePHP, tier: _tier, active: true });
        itemIds.push(id);
        emit ItemAdded(id, _name, _priceETH);
    }

    function updateItem(uint256 _itemId, uint256 _newPriceETH, bool _active) external onlyOwner {
        require(items[_itemId].id != 0, "Item does not exist");
        items[_itemId].priceETH = _newPriceETH;
        items[_itemId].active   = _active;
        emit ItemUpdated(_itemId, _newPriceETH, _active);
    }

    function setCompanyTreasury(address _new) external onlyOwner {
        require(_new != address(0), "Invalid address");
        companyTreasury = _new;
    }

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    /// @notice Player sends exact ETH to buy item — no approve() needed
    function purchaseItem(uint256 _itemId) external payable nonReentrant whenNotPaused {
        StoreItem storage item = items[_itemId];
        require(item.id    != 0,  "Item does not exist");
        require(item.active,       "Item not active");
        require(!playerOwns[msg.sender][_itemId], "Already owned");
        require(msg.value == item.priceETH, "Incorrect ETH amount sent");

        if (item.tier > 0) {
            require(playerTier[msg.sender] == item.tier - 1, "Must upgrade tiers in order");
        }

        (bool ok, ) = payable(companyTreasury).call{value: msg.value}("");
        require(ok, "ETH transfer to treasury failed");

        playerOwns[msg.sender][_itemId] = true;

        if (item.tier > 0 && item.tier > playerTier[msg.sender]) {
            playerTier[msg.sender] = item.tier;
            emit WalletUpgraded(msg.sender, item.tier, msg.value, block.timestamp);
        }

        emit ItemPurchased(msg.sender, _itemId, item.itemType, item.priceETH, block.timestamp);
    }

    function getAllItems() external view returns (StoreItem[] memory) {
        StoreItem[] memory result = new StoreItem[](itemIds.length);
        for (uint256 i = 0; i < itemIds.length; i++) result[i] = items[itemIds[i]];
        return result;
    }

    function getActiveItems() external view returns (StoreItem[] memory) {
        uint256 count;
        for (uint256 i = 0; i < itemIds.length; i++)
            if (items[itemIds[i]].active) count++;
        StoreItem[] memory result = new StoreItem[](count);
        uint256 j;
        for (uint256 i = 0; i < itemIds.length; i++)
            if (items[itemIds[i]].active) result[j++] = items[itemIds[i]];
        return result;
    }

    function getPlayerInfo(address _player)
        external view
        returns (uint256 ethBalance, uint8 tier, bool[] memory ownedItems)
    {
        ethBalance = _player.balance;
        tier       = playerTier[_player];
        ownedItems = new bool[](itemIds.length);
        for (uint256 i = 0; i < itemIds.length; i++)
            ownedItems[i] = playerOwns[_player][itemIds[i]];
    }
}
