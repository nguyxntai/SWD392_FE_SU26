# Convenience POS API Endpoints

Base URL local:

```text
http://localhost:8080
```

Swagger:

```text
http://localhost:8080/swagger-ui/index.html
```

Auth notes:

```text
- Protected APIs require login.
- Backend reads JWT access token mainly from access_token cookie.
- For browser/FE calls, use credentials/include cookies.
- ADMIN and MANAGER can access management APIs.
- CASHIER can access POS checkout APIs.
- CUSTOMER can access /api/me and redeem APIs.
```

Default seeded accounts:

| Role | Username | Password |
|---|---|---|
| ADMIN | `admin` | `admin123` |
| MANAGER | `manager` | `manager123` |
| CASHIER | `cashier` | `cashier123` |
| CUSTOMER | `customer` | `customer123` |

---

## 1. Auth APIs

### Register Customer

```http
POST /api/auth/register
```

Public.

Body:

```json
{
  "username": "customer01",
  "password": "customer123",
  "fullName": "Customer One",
  "phone": "0900000001",
  "email": "customer01@example.com"
}
```

### Login

```http
POST /api/auth/login
```

Public.

Body:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

Result returns `accessToken`, `refreshToken`, and sets cookies.

### Refresh Token

```http
POST /api/auth/refresh
```

Uses `refresh_token` cookie.

### Logout

```http
POST /api/auth/logout
```

Uses `refresh_token` cookie and clears auth cookies.

---

## 2. Category APIs

### Create Category

```http
POST /api/categories
```

Roles: `ADMIN`, `MANAGER`.

Body:

```json
{
  "name": "Drinks",
  "description": "Beverage products"
}
```

### Update Category

```http
PUT /api/categories/{id}
```

Roles: `ADMIN`, `MANAGER`.

### Delete Category

```http
DELETE /api/categories/{id}
```

Roles: `ADMIN`, `MANAGER`.

### Get Category Detail

```http
GET /api/categories/{id}
```

Public.

### Get Category List

```http
GET /api/categories
```

Public.

---

## 3. Product APIs

### Create Product

```http
POST /api/products
```

Roles: `ADMIN`, `MANAGER`.

Body:

```json
{
  "categoryId": "uuid-category",
  "name": "Flow Milk",
  "barcode": "893FLOW094648",
  "price": 12000,
  "costPrice": 8000,
  "unit": "Box",
  "imageUrl": "",
  "initialQuantity": 30,
  "minStockLevel": 5
}
```

### Update Product

```http
PUT /api/products/{id}
```

Roles: `ADMIN`, `MANAGER`.

### Delete Product

```http
DELETE /api/products/{id}
```

Roles: `ADMIN`, `MANAGER`.

Soft delete: sets product inactive.

### Get Product Detail

```http
GET /api/products/{id}
```

Public.

### Scan Product By Barcode

```http
GET /api/products/barcode?code=893FLOW094648
```

Public.

Used by POS scanner flow.

### Get Product List

```http
GET /api/products
```

Public.

---

## 4. POS Checkout APIs

### Checkout By Cash

```http
POST /api/checkout
```

Roles: `ADMIN`, `MANAGER`, `CASHIER`.

Body without voucher:

```json
{
  "customerPhone": "0000000003",
  "paymentMethod": "CASH",
  "amountReceived": 20000,
  "discountAmount": 0,
  "items": [
    {
      "barcode": "893FLOW094648",
      "quantity": 1
    }
  ]
}
```

Body with voucher:

```json
{
  "customerPhone": "0000000003",
  "paymentMethod": "CASH",
  "amountReceived": 12000,
  "discountAmount": 0,
  "voucherCode": "VCH-20260611195938112",
  "items": [
    {
      "barcode": "893FLOW094648",
      "quantity": 1
    }
  ]
}
```

Cash flow:

```text
Create order PAID
Create payment CASH SUCCESS
Create receipt
Decrease inventory
Create SALE inventory transaction
Earn customer points
Mark voucher used if voucherCode exists
```

Voucher rules:

```text
- Voucher must belong to customerPhone account.
- Voucher must not be used.
- Reward must still be active.
- Other customer cannot use this voucher code.
```

### Initiate PayOS Checkout

```http
POST /api/checkout/payos/initiate
```

Roles: `ADMIN`, `MANAGER`, `CASHIER`.

Body:

```json
{
  "customerPhone": "0000000003",
  "paymentMethod": "BANK_TRANSFER",
  "amountReceived": 0,
  "discountAmount": 0,
  "voucherCode": "VCH-20260611195938112",
  "items": [
    {
      "barcode": "893FLOW094648",
      "quantity": 1
    }
  ]
}
```

PayOS initiate flow:

```text
Create order PENDING_PAYMENT
Create payment PAYOS PENDING
Create PayOS payment link
Return paymentLink to FE
Inventory is not decreased yet
Voucher is not marked used yet
```

After PayOS webhook success:

```text
Payment SUCCESS
Order PAID
Create receipt
Decrease inventory
Earn customer points
Mark voucher used
```

---

## 5. PayOS Webhook APIs

### Webhook Health Check

```http
GET /api/payments/payos/webhook
```

Public.

Used to verify URL is reachable.

### PayOS Webhook Handler

```http
POST /api/payments/payos/webhook
```

Public.

PayOS calls this endpoint after bank transfer status changes.

Production webhook URL example:

```text
https://your-domain.com/api/payments/payos/webhook
```

---

## 6. Order APIs

### Get All Orders

```http
GET /api/orders
```

Roles: `ADMIN`, `MANAGER`.

### Get Order Detail

```http
GET /api/orders/{id}
```

Roles: authenticated users depending on access context.

### Get My Orders

```http
GET /api/me/orders
```

Role: `CUSTOMER`.

---

## 7. Receipt APIs

### Get Receipt Detail

```http
GET /api/receipts/{id}
```

Roles: authenticated.

### Mark Receipt Printed

```http
POST /api/receipts/{id}/print
```

Roles: authenticated.

Used after FE calls `window.print()`.

---

## 8. Inventory APIs

### Get Inventory List

```http
GET /api/inventory
```

Roles: `ADMIN`, `MANAGER`.

### Get Inventory Transactions

```http
GET /api/inventory/transactions
```

Roles: `ADMIN`, `MANAGER`.

Transaction types:

```text
SALE
IMPORT
ADJUSTMENT
```

Reference types:

```text
ORDER
IMPORT_RECEIPT
```

---

## 9. Supplier APIs

### Create Supplier

```http
POST /api/suppliers
```

Roles: `ADMIN`, `MANAGER`.

Body:

```json
{
  "name": "ABC Supplier",
  "phone": "0900000009",
  "email": "supplier@example.com",
  "address": "Ho Chi Minh",
  "active": true
}
```

### Update Supplier

```http
PUT /api/suppliers/{id}
```

Roles: `ADMIN`, `MANAGER`.

### Delete Supplier

```http
DELETE /api/suppliers/{id}
```

Roles: `ADMIN`, `MANAGER`.

Soft delete: sets supplier inactive.

### Get Supplier Detail

```http
GET /api/suppliers/{id}
```

Roles: `ADMIN`, `MANAGER`.

### Get Supplier List

```http
GET /api/suppliers
```

Roles: `ADMIN`, `MANAGER`.

---

## 10. Import Receipt APIs

### Create Import Receipt

```http
POST /api/import-receipts
```

Roles: `ADMIN`, `MANAGER`.

Body:

```json
{
  "supplierId": "uuid-supplier",
  "note": "Import stock",
  "items": [
    {
      "barcode": "893FLOW094648",
      "quantity": 10,
      "unitCost": 8000
    }
  ]
}
```

Import flow:

```text
Create import_receipt
Create import_receipt_items
Increase inventory
Create inventory_transaction type IMPORT
```

### Get Import Receipt Detail

```http
GET /api/import-receipts/{id}
```

Roles: `ADMIN`, `MANAGER`.

### Get Import Receipt List

```http
GET /api/import-receipts
```

Roles: `ADMIN`, `MANAGER`.

---

## 11. Membership APIs

### Get My Points

```http
GET /api/me/points
```

Role: `CUSTOMER`.

### Get My Point History

```http
GET /api/me/points/history
```

Role: `CUSTOMER`.

Point transaction types:

```text
EARN   = earn points from paid order
REDEEM = spend points to redeem reward
```

### Get My Vouchers

```http
GET /api/me/vouchers
```

Role: `CUSTOMER`.

Returns redeemed vouchers from `reward_redemptions`.

---

## 12. Reward APIs

### Create Reward

```http
POST /api/rewards
```

Roles: `ADMIN`, `MANAGER`.

Body:

```json
{
  "name": "Discount 3000",
  "description": "Redeem 1 point for 3000 VND discount",
  "pointsRequired": 1,
  "discountAmount": 3000,
  "active": true
}
```

### Update Reward

```http
PUT /api/rewards/{id}
```

Roles: `ADMIN`, `MANAGER`.

### Delete Reward

```http
DELETE /api/rewards/{id}
```

Roles: `ADMIN`, `MANAGER`.

Soft delete: sets reward inactive.

### Get Reward Detail

```http
GET /api/rewards/{id}
```

Authenticated.

### Get Active Reward List

```http
GET /api/rewards
```

Authenticated.

### Redeem Reward

```http
POST /api/rewards/redeem
```

Role: `CUSTOMER`.

Body:

```json
{
  "rewardId": "uuid-reward"
}
```

Redeem flow:

```text
Check reward active
Check customer has enough points
Subtract points from users.total_points
Create reward_redemptions with voucherCode
Create point_transactions type REDEEM
```

---

## 13. Report APIs

### Revenue Report

```http
GET /api/reports/revenue
```

Roles: `ADMIN`, `MANAGER`.

All time:

```http
GET /api/reports/revenue
```

Today:

```http
GET /api/reports/revenue?period=today
```

This month:

```http
GET /api/reports/revenue?period=month
```

Date range:

```http
GET /api/reports/revenue?from=2026-06-01&to=2026-06-30
```

Result fields:

```text
paidOrderCount
grossRevenue
discountTotal
netRevenue
```

### Top Products Report

```http
GET /api/reports/top-products
```

Roles: `ADMIN`, `MANAGER`.

All time:

```http
GET /api/reports/top-products
```

Today:

```http
GET /api/reports/top-products?period=today
```

This month:

```http
GET /api/reports/top-products?period=month
```

Date range:

```http
GET /api/reports/top-products?from=2026-06-01&to=2026-06-30
```

Result fields:

```text
productId
productName
quantitySold
revenue
```

### Low Stock Report

```http
GET /api/reports/low-stock
```

Roles: `ADMIN`, `MANAGER`.

Low stock rule:

```text
inventory.quantity <= inventory.minStockLevel
```

Result fields:

```text
productId
productName
barcode
quantity
minStockLevel
```

---

## 14. Main FE Flows

### POS Cash Flow

```text
Login as cashier/admin/manager
GET /api/products/barcode?code=...
POST /api/checkout
Print receipt
```

### POS PayOS Flow

```text
Login as cashier/admin/manager
GET /api/products/barcode?code=...
POST /api/checkout/payos/initiate
Open paymentLink
PayOS calls POST /api/payments/payos/webhook
GET /api/orders/{id} to refresh status
Print receipt after order PAID
```

### Import Stock Flow

```text
Login as manager/admin
POST /api/suppliers
POST /api/import-receipts
GET /api/inventory
GET /api/inventory/transactions
```

### Reward/Voucher Flow

```text
Customer buys item and earns points
Admin/Manager creates reward
Customer calls POST /api/rewards/redeem
Customer receives voucherCode
Cashier uses voucherCode in POST /api/checkout
Backend checks voucher belongs to that customer
Backend marks voucher used after successful payment
```

### Report Flow

```text
Login as manager/admin
GET /api/reports/revenue?period=today
GET /api/reports/revenue?period=month
GET /api/reports/revenue?from=2026-06-01&to=2026-06-30
GET /api/reports/top-products?period=today
GET /api/reports/low-stock
```
