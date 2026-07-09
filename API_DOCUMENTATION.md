# StockFlow REST API Documentation

This document describes the REST API endpoints available in the StockFlow Stock Management backend. 

All endpoints (except Authentication) require JWT Authentication.

---

## 1. Authentication

### Obtain JWT Tokens
Obtains an access token and a refresh token.
* **URL**: `/api/token/`
* **Method**: `POST`
* **Content-Type**: `application/json`
* **Request Payload**:
  ```json
  {
    "username": "admin",
    "password": "adminpassword"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "refresh": "eyJhbGciOi...",
    "access": "eyJhbGciOi..."
  }
  ```

### Refresh Access Token
Obtains a new access token using a valid refresh token.
* **URL**: `/api/token/refresh/`
* **Method**: `POST`
* **Content-Type**: `application/json`
* **Request Payload**:
  ```json
  {
    "refresh": "eyJhbGciOi..."
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "access": "eyJhbGciOi..."
  }
  ```

---

## 2. Category Endpoints

### List Categories
Retrieves a paginated list of categories. Supports searching by name.
* **URL**: `/api/categories/`
* **Method**: `GET`
* **Headers**: `Authorization: Bearer <access_token>`
* **Query Parameters**:
  * `page` (optional): Page number (default: 1)
  * `search` (optional): Search query matching category name
* **Response (200 OK)**:
  ```json
  {
    "count": 1,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": "23fa3b45-6677-4cbe-b4db-ea1c3a63f15c",
        "name": "Electronics",
        "description": "Electronic gadgets and appliances",
        "products_count": 5
      }
    ]
  }
  ```

### Create Category
Creates a new category.
* **URL**: `/api/categories/`
* **Method**: `POST`
* **Headers**: `Authorization: Bearer <access_token>`
* **Request Payload**:
  ```json
  {
    "name": "Accessories",
    "description": "Phone covers, chargers, etc."
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "id": "b73a3a41-2ab2-4b2a-a92c-7b2ef3a6bf42",
    "name": "Accessories",
    "description": "Phone covers, chargers, etc.",
    "products_count": 0
  }
  ```

### Retrieve Category
Retrieves details of a category by UUID.
* **URL**: `/api/categories/<uuid:id>/`
* **Method**: `GET`
* **Headers**: `Authorization: Bearer <access_token>`
* **Response (200 OK)**:
  ```json
  {
    "id": "b73a3a41-2ab2-4b2a-a92c-7b2ef3a6bf42",
    "name": "Accessories",
    "description": "Phone covers, chargers, etc.",
    "products_count": 0
  }
  ```

### Update Category (Full)
Updates all fields of a category.
* **URL**: `/api/categories/<uuid:id>/`
* **Method**: `PUT`
* **Headers**: `Authorization: Bearer <access_token>`
* **Request Payload**:
  ```json
  {
    "name": "Mobile Accessories",
    "description": "Phone cases and replacement cables"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "id": "b73a3a41-2ab2-4b2a-a92c-7b2ef3a6bf42",
    "name": "Mobile Accessories",
    "description": "Phone cases and replacement cables",
    "products_count": 0
  }
  ```

### Delete Category
Deletes a category. Any products linked to it will have their category set to null.
* **URL**: `/api/categories/<uuid:id>/`
* **Method**: `DELETE`
* **Headers**: `Authorization: Bearer <access_token>`
* **Response**: `204 No Content`

---

## 3. Product Endpoints

### List Products
Retrieves a paginated list of active products. Supports searching by product name or code, and filtering by category ID.
* **URL**: `/api/products/`
* **Method**: `GET`
* **Headers**: `Authorization: Bearer <access_token>`
* **Query Parameters**:
  * `page` (optional): Page number (default: 1)
  * `search` (optional): Search query matching product name or code
  * `Category` (optional): Category UUID
* **Response (200 OK)**:
  ```json
  {
    "count": 1,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": "4031c3b4-f65c-4be5-926c-d2ab7ca6e4a2",
        "ProductID": 59302,
        "ProductCode": "PRD-59302",
        "ProductName": "Smart Watch",
        "ProductImage": "http://localhost:8000/media/uploads/watch.jpg",
        "CreatedDate": "2026-07-09T05:22:15Z",
        "UpdatedDate": null,
        "IsFavourite": false,
        "Active": true,
        "HSNCode": "91021100",
        "TotalStock": "150.00000000",
        "Category": "23fa3b45-6677-4cbe-b4db-ea1c3a63f15c"
      }
    ]
  }
  ```

### Create Product
Creates a new product. This endpoint uses `multipart/form-data` to support image uploads.
* **URL**: `/api/products/`
* **Method**: `POST`
* **Headers**: `Authorization: Bearer <access_token>`
* **Form-Data Request Fields**:
  * `ProductName` (required): Name of the product
  * `ProductID` (required): Big integer ID
  * `ProductCode` (required): Unique product code
  * `Category` (optional): Category UUID
  * `HSNCode` (optional): Product HSN code
  * `ProductImage` (optional): Upload binary file
* **Response (201 Created)**:
  ```json
  {
    "id": "4031c3b4-f65c-4be5-926c-d2ab7ca6e4a2",
    "ProductID": 59302,
    "ProductCode": "PRD-59302",
    "ProductName": "Smart Watch",
    "ProductImage": "http://localhost:8000/media/uploads/watch.jpg",
    "CreatedDate": "2026-07-09T05:22:15Z",
    "UpdatedDate": null,
    "IsFavourite": false,
    "Active": true,
    "HSNCode": "91021100",
    "TotalStock": "0.00000000",
    "Category": "23fa3b45-6677-4cbe-b4db-ea1c3a63f15c"
  }
  ```

### Retrieve Product
Retrieves details of a single product.
* **URL**: `/api/products/<uuid:id>/`
* **Method**: `GET`
* **Headers**: `Authorization: Bearer <access_token>`
* **Response (200 OK)**:
  ```json
  {
    "id": "4031c3b4-f65c-4be5-926c-d2ab7ca6e4a2",
    "ProductID": 59302,
    "ProductCode": "PRD-59302",
    "ProductName": "Smart Watch",
    "ProductImage": "http://localhost:8000/media/uploads/watch.jpg",
    "CreatedDate": "2026-07-09T05:22:15Z",
    "UpdatedDate": null,
    "IsFavourite": false,
    "Active": true,
    "HSNCode": "91021100",
    "TotalStock": "150.00000000",
    "Category": "23fa3b45-6677-4cbe-b4db-ea1c3a63f15c"
  }
  ```

### Delete Product
Soft-deletes a product by setting its `Active` field to `false`.
* **URL**: `/api/products/<uuid:id>/`
* **Method**: `DELETE`
* **Headers**: `Authorization: Bearer <access_token>`
* **Response (204 No Content)**:
  ```json
  {
    "success": true,
    "message": "Product deleted successfully."
  }
  ```

---

## 4. Product Variants & Sub-variants

### List Product Variants
Retrieves variants configured for a specific product.
* **URL**: `/api/products/<uuid:product_id>/variants/`
* **Method**: `GET`
* **Headers**: `Authorization: Bearer <access_token>`
* **Response (200 OK)**:
  ```json
  [
    {
      "id": "cf3b45a2-3b4e-4cbe-88aa-ea4b63f25cde",
      "name": "Color",
      "options": [
        { "id": "1", "value": "Black" },
        { "id": "2", "value": "White" }
      ]
    }
  ]
  ```

### List Product Sub-variants
Retrieves combinations of variants (sub-variants) for a product.
* **URL**: `/api/products/<uuid:product_id>/subvariants/`
* **Method**: `GET`
* **Headers**: `Authorization: Bearer <access_token>`
* **Response (200 OK)**:
  ```json
  [
    {
      "id": "fa2b3c4d-6161-4141-8b9a-7a6b5c4d3e2f",
      "name": "Color: Black",
      "stock": "100.00000000",
      "low_stock_threshold": "10.00000000",
      "options": [
        { "id": "1", "value": "Black" }
      ]
    }
  ]
  ```

---

## 5. Stock Transactions

### Record Stock Purchase (Stock In)
Records a purchase movement, adding inventory stock to a sub-variant.
* **URL**: `/api/stock/purchase/`
* **Method**: `POST`
* **Headers**: `Authorization: Bearer <access_token>`
* **Request Payload**:
  ```json
  {
    "sub_variant_id": "fa2b3c4d-6161-4141-8b9a-7a6b5c4d3e2f",
    "quantity": 50,
    "notes": "Purchase order PO-23948"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "id": "e3fa4b62-66aa-4cde-b4db-ea1c3a63f15c",
    "sub_variant": "fa2b3c4d-6161-4141-8b9a-7a6b5c4d3e2f",
    "transaction_type": "IN",
    "quantity": "50.00000000",
    "notes": "Purchase order PO-23948",
    "created_at": "2026-07-09T06:12:45Z"
  }
  ```

### Record Stock Sale (Stock Out)
Records a sale or reduction movement, subtracting stock from a sub-variant. Enforces positive stock checks.
* **URL**: `/api/stock/sale/`
* **Method**: `POST`
* **Headers**: `Authorization: Bearer <access_token>`
* **Request Payload**:
  ```json
  {
    "sub_variant_id": "fa2b3c4d-6161-4141-8b9a-7a6b5c4d3e2f",
    "quantity": 10,
    "notes": "Retail sale Invoice #4092"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "id": "d3fa3b45-66aa-4cbe-b4db-ea1c3a63f15c",
    "sub_variant": "fa2b3c4d-6161-4141-8b9a-7a6b5c4d3e2f",
    "transaction_type": "OUT",
    "quantity": "10.00000000",
    "notes": "Retail sale Invoice #4092",
    "created_at": "2026-07-09T06:14:10Z"
  }
  ```

---

## 6. Dashboard & Reports

### Dashboard Overview
Retrieves real-time aggregated metrics, top products, recent logs, and a 7-day cumulative stock trend chart level timeline.
* **URL**: `/api/products/dashboard/`
* **Method**: `GET`
* **Headers**: `Authorization: Bearer <access_token>`
* **Response (200 OK)**:
  ```json
  {
    "total_products": 5,
    "total_stock": 140.0,
    "low_stock_count": 1,
    "transactions_today": 2,
    "top_products_by_stock": [
      {
        "id": "4031c3b4-f65c-4be5-926c-d2ab7ca6e4a2",
        "name": "Smart Watch",
        "stock": 140.0,
        "value": 14000.0
      }
    ],
    "recent_transactions": [
      {
        "id": "TX-D3FA3B",
        "type": "OUT",
        "product": "Smart Watch (Color: Black)",
        "qty": 10.0,
        "date": "2026-07-09"
      }
    ],
    "chart_data": [
      { "name": "Jul 03", "stock": 100.0 },
      { "name": "Jul 04", "stock": 100.0 },
      { "name": "Jul 05", "stock": 100.0 },
      { "name": "Jul 06", "stock": 100.0 },
      { "name": "Jul 07", "stock": 100.0 },
      { "name": "Jul 08", "stock": 100.0 },
      { "name": "Jul 09", "stock": 140.0 }
    ]
  }
  ```

### Stock Report
Retrieves filtered and paginated stock transactions history.
* **URL**: `/api/stock/report/`
* **Method**: `GET`
* **Headers**: `Authorization: Bearer <access_token>`
* **Query Parameters**:
  * `start_date` (optional): Filter start date (`YYYY-MM-DD`)
  * `end_date` (optional): Filter end date (`YYYY-MM-DD`)
  * `product_id` (optional): Product UUID
  * `transaction_type` (optional): `PURCHASE` (maps to IN) or `SALE` (maps to OUT)
  * `page` (optional): Page index
  * `page_size` (optional): Items count per page (default: 20)
* **Response (200 OK)**:
  ```json
  {
    "count": 1,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": "d3fa3b45-66aa-4cbe-b4db-ea1c3a63f15c",
        "created_at": "2026-07-09T06:14:10Z",
        "transaction_type": "OUT",
        "quantity": "10.00000000",
        "notes": "Retail sale Invoice #4092",
        "product_name": "Smart Watch",
        "sub_variant_name": "Color: Black"
      }
    ]
  }
  ```
