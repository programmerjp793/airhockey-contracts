// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title SmartStore
 * @dev Item store contract for purchasing in-game items with ETH
 * - Admin manages items (create, set price, toggle availability)
 * - Players can purchase available items with ETH payment
 * - Contract verifies payment and records ownership
 */
contract SmartStore is Ownable, ReentrancyGuard, Pausable {

    struct Item {
        uint256 id;
        string name;
        uint256 price;
        bool isAvailable;
    }

    event ItemCreated(uint256 indexed itemId, string name, uint256 price);
    event ItemPriceUpdated(uint256 indexed itemId, uint256 newPrice);
    event ItemAvailabilityToggled(uint256 indexed itemId, bool isAvailable);
    event ItemPurchased(address indexed player, uint256 indexed itemId, uint256 price, uint256 timestamp);

    address public treasury;

    uint256 public nextItemId = 1;
    mapping(uint256 => Item) public items;
    uint256[] public itemIds;

    // Ownership tracking: player address => item id => owned
    mapping(address => mapping(uint256 => bool)) public playerOwnsItem;

    constructor(address _treasury) Ownable(msg.sender) {
        require(_treasury != address(0), "Invalid treasury address");
        treasury = _treasury;

        // Seed default items
        _createItem("Wallet Slot Upgrade I", 0.001 ether, true);
        _createItem("Wallet Slot Upgrade II", 0.003 ether, true);
        _createItem("AI Replay Viewer", 0.001 ether, true);
        _createItem("Custom Puck Skin", 0.0006 ether, true);
    }

    /**
     * @dev Admin creates a new item
     * @param _name Name of the item
     * @param _price Price in wei
     * @param _isAvailable Whether the item is available for purchase
     */
    function createItem(string calldata _name, uint256 _price, bool _isAvailable) external onlyOwner {
        _createItem(_name, _price, _isAvailable);
    }

    function _createItem(string memory _name, uint256 _price, bool _isAvailable) internal {
        uint256 id = nextItemId++;
        items[id] = Item({
            id: id,
            name: _name,
            price: _price,
            isAvailable: _isAvailable
        });
        itemIds.push(id);
        emit ItemCreated(id, _name, _price);
    }

    /**
     * @dev Admin sets the price of an item
     * @param _itemId ID of the item
     * @param _price New price in wei
     */
    function setItemPrice(uint256 _itemId, uint256 _price) external onlyOwner {
        require(items[_itemId].id != 0, "Item does not exist");
        items[_itemId].price = _price;
        emit ItemPriceUpdated(_itemId, _price);
    }

    /**
     * @dev Admin toggles the availability of an item
     * @param _itemId ID of the item
     */
    function toggleItemAvailability(uint256 _itemId) external onlyOwner {
        require(items[_itemId].id != 0, "Item does not exist");
        items[_itemId].isAvailable = !items[_itemId].isAvailable;
        emit ItemAvailabilityToggled(_itemId, items[_itemId].isAvailable);
    }

    /**
     * @dev Admin updates multiple item settings at once
     * @param _itemId ID of the item
     * @param _name New name (can be empty to keep existing)
     * @param _price New price in wei (0 to keep existing)
     * @param _isAvailable New availability status
     */
    function updateItem(uint256 _itemId, string calldata _name, uint256 _price, bool _isAvailable) external onlyOwner {
        require(items[_itemId].id != 0, "Item does not exist");
        
        if (bytes(_name).length > 0) {
            items[_itemId].name = _name;
        }
        if (_price > 0) {
            items[_itemId].price = _price;
        }
        items[_itemId].isAvailable = _isAvailable;
        
        emit ItemPriceUpdated(_itemId, items[_itemId].price);
        emit ItemAvailabilityToggled(_itemId, items[_itemId].isAvailable);
    }

    /**
     * @dev Admin sets the treasury address
     * @param _newTreasury New treasury address
     */
    function setTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid treasury address");
        treasury = _newTreasury;
    }

    // Pausable functions
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    /**
     * @dev Player purchases an item with ETH payment
     * @param _itemId ID of the item to purchase
     */
    function buyItem(uint256 _itemId) external payable nonReentrant whenNotPaused {
        Item storage item = items[_itemId];
        
        require(item.id != 0, "Item does not exist");
        require(item.isAvailable, "Item not available");
        require(!playerOwnsItem[msg.sender][_itemId], "Already owned");
        require(msg.value >= item.price, "Insufficient ETH payment");

        // Transfer ETH to treasury
        (bool success, ) = payable(treasury).call{value: msg.value}("");
        require(success, "ETH transfer failed");

        // Record ownership
        playerOwnsItem[msg.sender][_itemId] = true;

        emit ItemPurchased(msg.sender, _itemId, item.price, block.timestamp);
    }

    /**
     * @dev View item details
     * @param _itemId ID of the item
     * @return Item struct
     */
    function getItem(uint256 _itemId) external view returns (Item memory) {
        require(items[_itemId].id != 0, "Item does not exist");
        return items[_itemId];
    }

    /**
     * @dev View all items
     * @return Array of all items
     */
    function getAllItems() external view returns (Item[] memory) {
        Item[] memory result = new Item[](itemIds.length);
        for (uint256 i = 0; i < itemIds.length; i++) {
            result[i] = items[itemIds[i]];
        }
        return result;
    }

    /**
     * @dev View available items only
     * @return Array of available items
     */
    function getAvailableItems() external view returns (Item[] memory) {
        uint256 count;
        for (uint256 i = 0; i < itemIds.length; i++) {
            if (items[itemIds[i]].isAvailable) {
                count++;
            }
        }
        
        Item[] memory result = new Item[](count);
        uint256 j;
        for (uint256 i = 0; i < itemIds.length; i++) {
            if (items[itemIds[i]].isAvailable) {
                result[j++] = items[itemIds[i]];
            }
        }
        return result;
    }

    /**
     * @dev View player's owned items
     * @param _player Address of the player
     * @return Array of item IDs owned by the player
     */
    function getPlayerItems(address _player) external view returns (uint256[] memory) {
        uint256 count;
        for (uint256 i = 0; i < itemIds.length; i++) {
            if (playerOwnsItem[_player][itemIds[i]]) {
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        uint256 j;
        for (uint256 i = 0; i < itemIds.length; i++) {
            if (playerOwnsItem[_player][itemIds[i]]) {
                result[j++] = itemIds[i];
            }
        }
        return result;
    }

    /**
     * @dev Check if player owns a specific item
     * @param _player Address of the player
     * @param _itemId ID of the item
     * @return True if player owns the item
     */
    function hasPlayerBoughtItem(address _player, uint256 _itemId) external view returns (bool) {
        return playerOwnsItem[_player][_itemId];
    }
}
