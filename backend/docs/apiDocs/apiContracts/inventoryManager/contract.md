# Inventory Manager API Contract

This document outlines the API endpoints for the `InventoryManager` service within the Zarfolio project. This service is responsible for managing all aspects of the gold and jewelry inventory, including item details, stock levels, categories, and real-time gold prices.

---

## 1. Item Management

### 1.1. Get All Items

* **Endpoint:** `/api/v1/inventory/items`
* **Method:** `GET`
* **Description:** Retrieves a paginated list of all inventory items, with optional filtering and search capabilities.
* **Query Parameters:**
    * `search` (optional, `string`): Search by item code, name, or description.
    * `category` (optional, `string`): Filter by item category ID.
    * `limit` (optional, `integer`): Maximum number of items to return (default: 100).
    * `offset` (optional, `integer`): Number of items to skip for pagination.
* **Request Body:** None
* **Responses:**
    * **`200 OK`**: Successfully retrieved the list of items.
        ```json
        {
          "items": [
            {
              "id": "uuid-v4-generated-id-1",
              "code": "GOLD-RING-001",
              "name": "Men's Gold Ring",
              "category_id": "uuid-v4-category-id-1",
              "gold_weight_grams": 5.25,
              "purity_karat": 18,
              "stone_weight_carats": 0.5,
              "stone_type": "Diamond",
              "wage_per_gram": 120000.0,
              "purchase_price": 50000000.0,
              "image_url": "[http://yourdomain.com/assets/gold-ring-001.jpg](http://yourdomain.com/assets/gold-ring-001.jpg)",
              "current_stock": 10,
              "location": "Showcase 1",
              "description": "Handmade gold ring with diamond setting",
              "is_active": true,
              "created_at": "2024-06-10T10:00:00Z",
              "updated_at": "2024-06-10T10:00:00Z"
            }
          ],
          "total_count": 150,
          "page_size": 100,
          "page_number": 1
        }
        ```
    * **`400 Bad Request`**: Invalid query parameters.
    * **`500 Internal Server Error`**: Unexpected server error.
        ```json
        {
          "error": "Error message"
        }
        ```

### 1.2. Get Item by ID

* **Endpoint:** `/api/v1/inventory/items/{item_id}`
* **Method:** `GET`
* **Description:** Retrieves the detailed information for a specific item.
* **Path Parameters:**
    * `item_id` (`string`, UUID): The unique identifier of the item.
* **Request Body:** None
* **Responses:**
    * **`200 OK`**: Successfully retrieved item details.
        ```json
        {
          "id": "uuid-v4-generated-id-1",
          "code": "GOLD-RING-001",
          "name": "Men's Gold Ring",
          "category_id": "uuid-v4-category-id-1",
          "gold_weight_grams": 5.25,
          "purity_karat": 18,
          "stone_weight_carats": 0.5,
          "stone_type": "Diamond",
          "wage_per_gram": 120000.0,
          "purchase_price": 50000000.0,
          "image_url": "[http://yourdomain.com/assets/gold-ring-001.jpg](http://yourdomain.com/assets/gold-ring-001.jpg)",
          "current_stock": 10,
          "location": "Showcase 1",
          "description": "Handmade gold ring with diamond setting",
          "is_active": true,
          "created_at": "2024-06-10T10:00:00Z",
          "updated_at": "2024-06-10T10:00:00Z"
        }
        ```
    * **`404 Not Found`**: Item with the specified ID was not found.
    * **`500 Internal Server Error`**: Unexpected server error.
        ```json
        {
          "error": "Item not found"
        }
        ```

### 1.3. Create New Item

* **Endpoint:** `/api/v1/inventory/items`
* **Method:** `POST`
* **Description:** Creates a new inventory item.
* **Request Body:**
    ```json
    {
      "code": "NEW-ITEM-001",
      "name": "New Gold Chain",
      "category_id": "uuid-v4-category-id-2",
      "gold_weight_grams": 10.0,
      "purity_karat": 18,
      "stone_weight_carats": 0.0,
      "stone_type": "",
      "wage_per_gram": 150000.0,
      "purchase_price": 70000000.0,
      "image_url": "[http://yourdomain.com/assets/new-gold-chain.jpg](http://yourdomain.com/assets/new-gold-chain.jpg)",
      "current_stock": 5,
      "location": "Showcase 2",
      "description": "Simple gold chain",
      "is_active": true
    }
    ```
* **Responses:**
    * **`201 Created`**: Item successfully created.
        ```json
        {
          "id": "uuid-v4-new-item-id",
          "message": "Item created successfully."
        }
        ```
    * **`400 Bad Request`**: Invalid input data (e.g., missing required fields, invalid format).
    * **`409 Conflict`**: Item with this code already exists.
    * **`500 Internal Server Error`**: Unexpected server error.
        ```json
        {
          "error": "Error message"
        }
        ```

### 1.4. Update Item

* **Endpoint:** `/api/v1/inventory/items/{item_id}`
* **Method:** `PATCH`
* **Description:** Updates existing details of an inventory item. Only provided fields will be updated.
* **Path Parameters:**
    * `item_id` (`string`, UUID): The unique identifier of the item to update.
* **Request Body:** (Partial update; any combination of fields from item creation, e.g.)
    ```json
    {
      "name": "Updated Gold Ring",
      "wage_per_gram": 130000.0,
      "current_stock": 12,
      "is_active": false
    }
    ```
* **Responses:**
    * **`200 OK`**: Item successfully updated.
        ```json
        {
          "message": "Item updated successfully."
        }
        ```
    * **`400 Bad Request`**: Invalid input data.
    * **`404 Not Found`**: Item with the specified ID was not found.
    * **`500 Internal Server Error`**: Unexpected server error.
        ```json
        {
          "error": "Error message"
        }
        ```

### 1.5. Delete Item (Soft Delete)

* **Endpoint:** `/api/v1/inventory/items/{item_id}`
* **Method:** `DELETE`
* **Description:** Performs a soft delete on an item, setting its `is_active` status to `false`. The item remains in the database for historical purposes.
* **Path Parameters:**
    * `item_id` (`string`, UUID): The unique identifier of the item to delete.
* **Request Body:** None
* **Responses:**
    * **`200 OK`**: Item successfully deactivated.
        ```json
        {
          "message": "Item deactivated successfully."
        }
        ```
    * **`404 Not Found`**: Item with the specified ID was not found.
    * **`500 Internal Server Error`**: Unexpected server error.
        ```json
        {
          "error": "Error message"
        }
        ```

---

## 2. Stock Management

### 2.1. Decrease Item Stock

* **Endpoint:** `/api/v1/inventory/stock/decrease`
* **Method:** `POST`
* **Description:** Decreases the current stock quantity of a specific item. This is typically triggered by a sale transaction.
* **Request Body:**
    ```json
    {
      "item_id": "uuid-v4-item-id",
      "quantity": 1,
      "reason": "sale", // e.g., "sale", "damaged", "lost"
      "transaction_id": "uuid-v4-transaction-id" // Optional: ID of the related sales transaction
    }
    ```
* **Responses:**
    * **`200 OK`**: Stock successfully decreased.
        ```json
        {
          "message": "Stock decreased successfully.",
          "new_stock_level": 9
        }
        ```
    * **`400 Bad Request`**: Invalid input (e.g., negative quantity, insufficient stock).
    * **`404 Not Found`**: Item with the specified ID was not found.
    * **`500 Internal Server Error`**: Unexpected server error.
        ```json
        {
          "error": "Error message"
        }
        ```

### 2.2. Increase Item Stock

* **Endpoint:** `/api/v1/inventory/stock/increase`
* **Method:** `POST`
* **Description:** Increases the current stock quantity of a specific item. This is typically triggered by a purchase or production transaction.
* **Request Body:**
    ```json
    {
      "item_id": "uuid-v4-item-id",
      "quantity": 5,
      "reason": "purchase", // e.g., "purchase", "production", "return"
      "transaction_id": "uuid-v4-transaction-id" // Optional: ID of the related purchase transaction
    }
    ```
* **Responses:**
    * **`200 OK`**: Stock successfully increased.
        ```json
        {
          "message": "Stock increased successfully.",
          "new_stock_level": 15
        }
        ```
    * **`400 Bad Request`**: Invalid input (e.g., negative quantity).
    * **`404 Not Found`**: Item with the specified ID was not found.
    * **`500 Internal Server Error`**: Unexpected server error.
        ```json
        {
          "error": "Error message"
        }
        ```

---

## 3. Category Management

### 3.1. Get All Categories

* **Endpoint:** `/api/v1/inventory/categories`
* **Method:** `GET`
* **Description:** Retrieves a list of all defined item categories.
* **Request Body:** None
* **Responses:**
    * **`200 OK`**: Successfully retrieved the list of categories.
        ```json
        {
          "categories": [
            {
              "id": "uuid-v4-category-id-1",
              "name": "Rings",
              "description": "All types of rings",
              "created_at": "2024-06-10T10:00:00Z",
              "updated_at": "2024-06-10T10:00:00Z"
            },
            {
              "id": "uuid-v4-category-id-2",
              "name": "Chains",
              "description": "Necklaces and chains",
              "created_at": "2024-06-10T10:00:00Z",
              "updated_at": "2024-06-10T10:00:00Z"
            }
          ]
        }
        ```
    * **`500 Internal Server Error`**: Unexpected server error.
        ```json
        {
          "error": "Error message"
        }
        ```

### 3.2. Create New Category

* **Endpoint:** `/api/v1/inventory/categories`
* **Method:** `POST`
* **Description:** Creates a new item category.
* **Request Body:**
    ```json
    {
      "name": "Bracelets",
      "description": "Wrist jewelry"
    }
    ```
* **Responses:**
    * **`201 Created`**: Category successfully created.
        ```json
        {
          "id": "uuid-v4-new-category-id",
          "message": "Category created successfully."
        }
        ```
    * **`400 Bad Request`**: Invalid input data (e.g., missing name).
    * **`409 Conflict`**: Category with this name already exists.
    * **`500 Internal Server Error`**: Unexpected server error.
        ```json
        {
          "error": "Error message"
        }
        ```

### 3.3. Update Category

* **Endpoint:** `/api/v1/inventory/categories/{category_id}`
* **Method:** `PATCH`
* **Description:** Updates the details of an existing category.
* **Path Parameters:**
    * `category_id` (`string`, UUID): The unique identifier of the category to update.
* **Request Body:**
    ```json
    {
      "description": "Elegant wrist jewelry"
    }
    ```
* **Responses:**
    * **`200 OK`**: Category successfully updated.
        ```json
        {
          "message": "Category updated successfully."
        }
        ```
    * **`400 Bad Request`**: Invalid input data.
    * **`404 Not Found`**: Category with the specified ID was not found.
    * **`500 Internal Server Error`**: Unexpected server error.
        ```json
        {
          "error": "Error message"
        }
        ```

### 3.4. Delete Category

* **Endpoint:** `/api/v1/inventory/categories/{category_id}`
* **Method:** `DELETE`
* **Description:** Deletes a category. This operation might require handling items currently associated with this category (e.g., reassigning them to a default category or disallowing deletion if items exist).
* **Path Parameters:**
    * `category_id` (`string`, UUID): The unique identifier of the category to delete.
* **Request Body:** None
* **Responses:**
    * **`200 OK`**: Category successfully deleted.
        ```json
        {
          "message": "Category deleted successfully."
        }
        ```
    * **`400 Bad Request`**: Cannot delete category (e.g., if items are linked).
    * **`404 Not Found`**: Category with the specified ID was not found.
    * **`500 Internal Server Error`**: Unexpected server error.
        ```json
        {
          "error": "Error message"
        }
        ```

---

## 4. Real-time Price Data

### 4.1. Get Current Gold Price

* **Endpoint:** `/api/v1/inventory/gold-price`
* **Method:** `GET`
* **Description:** Retrieves the latest stored real-time gold price (e.g., per gram for 18 karat gold, various coin types).
* **Request Body:** None
* **Responses:**
    * **`200 OK`**: Successfully retrieved the gold price.
        ```json
        {
          "karat_18_price_per_gram": 3400000.0, // Example price in Toman
          "karat_24_price_per_gram": 4533333.33,
          "coin_bahar_azadi_price": 400000000.0, // Example coin price
          "last_updated_at": "2024-06-10T14:30:00Z"
        }
        ```
    * **`500 Internal Server Error`**: Unable to retrieve price (e.g., no data available, external API error).
        ```json
        {
          "error": "Could not retrieve gold price"
        }
        ```