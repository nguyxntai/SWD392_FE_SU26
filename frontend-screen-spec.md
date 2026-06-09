# Frontend Screen Specification - Convenience Store POS

Tài liệu này mô tả các màn hình FE cần xây dựng theo từng role, dựa trên backend hiện tại.

Backend response chung:

```json
{
  "code": 1000,
  "message": "...",
  "result": {},
  "errors": null,
  "timestamp": "...",
  "path": "/api/..."
}
```

FE luôn lấy dữ liệu chính từ `result`.

---

## 1. Auth Screens

### 1.1 Login Screen

Route gợi ý:

```text
/login
```

Dùng cho:

```text
ADMIN, MANAGER, CASHIER, CUSTOMER
```

Mục tiêu:

```text
Người dùng đăng nhập vào hệ thống.
```

Fields:

```text
username
password
```

Action chính:

```text
Bấm Login
```

API:

```http
POST /api/auth/login
```

Body:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

FE xử lý sau khi login success:

```text
Backend set access_token và refresh_token trong cookie.
FE đọc role từ response hoặc gọi API profile sau này nếu bổ sung.
Điều hướng theo role.
```

Điều hướng gợi ý:

```text
ADMIN -> /admin/dashboard
MANAGER -> /manager/products
CASHIER -> /pos
CUSTOMER -> /me/orders
```

Error cần hiển thị:

```text
Sai tài khoản hoặc mật khẩu
Tài khoản bị khoá
Server error
```

---

### 1.2 Customer Register Screen

Route gợi ý:

```text
/register
```

Dùng cho:

```text
CUSTOMER tự đăng ký
```

Fields:

```text
username
password
fullName
phone
email
```

API:

```http
POST /api/auth/register
```

Body:

```json
{
  "username": "customer01",
  "password": "123456",
  "fullName": "Nguyen Van A",
  "phone": "0900000000",
  "email": "a@example.com"
}
```

Success:

```text
Hiển thị đăng ký thành công.
Điều hướng về /login.
```

Error:

```text
Username trùng
Phone trùng
Email trùng
Validation failed
```

---

## 2. Cashier POS Screens

### 2.1 POS Checkout Screen

Route gợi ý:

```text
/pos
```

Dùng cho:

```text
CASHIER, MANAGER, ADMIN
```

Mục tiêu:

```text
Cashier scan barcode, tạo cart, chọn phương thức thanh toán và checkout.
```

Layout gợi ý:

```text
Left: Barcode input + product search result
Center: Cart items table
Right: Payment summary
```

Barcode input:

```text
Input luôn focus.
Máy scan USB hoạt động như bàn phím.
Khi scan xong thường bắn Enter.
FE bắt Enter để gọi API scan barcode.
```

API scan product:

```http
GET /api/products/barcode?code={barcode}
```

Response result:

```json
{
  "id": "uuid",
  "categoryId": "uuid",
  "categoryName": "Beverage",
  "name": "Coca Cola",
  "barcode": "893...",
  "price": 10000,
  "costPrice": 7000,
  "unit": "Can",
  "imageUrl": "...",
  "status": "ACTIVE",
  "quantity": 50,
  "minStockLevel": 5
}
```

FE cart state gợi ý:

```ts
type CartItem = {
  productId: string;
  barcode: string;
  name: string;
  price: number;
  quantity: number;
  availableQuantity: number;
  subtotal: number;
};
```

Khi scan thành công:

```text
Nếu product chưa có trong cart: thêm quantity = 1.
Nếu product đã có: tăng quantity +1.
Nếu quantity vượt availableQuantity: báo không đủ tồn kho.
```

Cart table columns:

```text
Product name
Barcode
Unit price
Quantity
Subtotal
Remove action
```

Cart actions:

```text
Tăng quantity
Giảm quantity
Xoá item
Clear cart
```

Payment summary:

```text
Total amount
Discount amount
Final amount
Payment method
Amount received
Change amount
Customer phone optional
```

Payment methods:

```text
CASH
BANK_TRANSFER
EWALLET
```

---

### 2.2 Cash Checkout Flow

Khi cashier chọn:

```text
Payment method = CASH
```

FE gọi:

```http
POST /api/checkout
```

Body:

```json
{
  "customerPhone": "0900000000",
  "paymentMethod": "CASH",
  "amountReceived": 100000,
  "discountAmount": 0,
  "items": [
    {
      "productId": "uuid-product-1",
      "barcode": "893...",
      "quantity": 2
    }
  ]
}
```

Success result:

```json
{
  "order": {
    "id": "uuid-order",
    "cashierName": "Cashier A",
    "customerName": "Customer A",
    "totalAmount": 20000,
    "discountAmount": 0,
    "finalAmount": 20000,
    "status": "PAID",
    "items": [],
    "payment": {},
    "receipt": {}
  },
  "receiptNumber": "RCPT-..."
}
```

FE sau success:

```text
Clear cart.
Mở receipt view/modal.
Cho cashier bấm Print.
```

---

### 2.3 PayOS Checkout Flow

Khi cashier chọn:

```text
Payment method = BANK_TRANSFER hoặc EWALLET
```

FE gọi:

```http
POST /api/checkout/payos/initiate
```

Body giống checkout cash, chỉ khác paymentMethod:

```json
{
  "customerPhone": "0900000000",
  "paymentMethod": "BANK_TRANSFER",
  "amountReceived": 0,
  "discountAmount": 0,
  "items": [
    {
      "productId": "uuid-product-1",
      "barcode": "893...",
      "quantity": 2
    }
  ]
}
```

Success result:

```json
{
  "orderId": "uuid-order",
  "paymentId": "uuid-payment",
  "merchantReference": "1763046001123",
  "providerSessionId": "1763046001123",
  "paymentLink": "https://pay.payos.vn/...",
  "finalAmount": 20000,
  "status": "PENDING"
}
```

FE sau success:

```text
Hiển thị QR/link từ paymentLink.
Hiển thị trạng thái: Chờ thanh toán.
Không clear cart ngay nếu muốn cho phép retry.
Không tự mark paid.
```

Điểm quan trọng:

```text
FE không gọi API để xác nhận thanh toán.
PayOS sẽ gọi webhook về backend.
```

FE cần biết payment đã thành công bằng cách:

```text
Cách đơn giản phase này: cashier bấm refresh order detail.
Cách tốt hơn phase sau: FE polling GET /api/orders/{orderId} mỗi vài giây.
Cách real-time hơn: dùng WebSocket/SSE sau này.
```

Nếu order detail trả:

```text
status = PAID
```

FE clear cart và mở receipt.

Nếu order vẫn:

```text
PENDING_PAYMENT
```

FE tiếp tục hiển thị chờ thanh toán.

Nếu order/payment fail/cancel:

```text
Hiển thị thanh toán thất bại hoặc đã huỷ.
Cho cashier tạo lại payment link.
```

---

### 2.4 Receipt Modal / Receipt Page

Route/modal gợi ý:

```text
/pos/receipt/{receiptId}
```

hoặc modal sau checkout.

Hiển thị:

```text
Store name
Receipt number
Order id
Cashier
Customer nếu có
Items
Total amount
Discount
Final amount
Payment method
Paid time
Printed time
```

API lấy receipt:

```http
GET /api/receipts/{id}
```

API mark printed:

```http
POST /api/receipts/{id}/print
```

FE print:

```text
Phase 1 dùng window.print().
Sau khi gọi print, gọi POST /api/receipts/{id}/print để backend lưu printedAt.
```

---

## 3. Manager Screens

### 3.1 Product List Screen

Route:

```text
/manager/products
```

Dùng cho:

```text
MANAGER, ADMIN
```

API:

```http
GET /api/products
```

Table columns:

```text
Image
Name
Barcode
Category
Price
Cost price
Unit
Quantity
Status
Actions
```

Actions:

```text
Create product
Edit product
Deactivate product
View detail
```

---

### 3.2 Create Product Screen

Route:

```text
/manager/products/create
```

Fields:

```text
categoryId
name
barcode
price
costPrice
unit
imageUrl
initialQuantity
minStockLevel
```

API:

```http
POST /api/products
```

Body:

```json
{
  "categoryId": "uuid-category",
  "name": "Coca Cola",
  "barcode": "893...",
  "price": 10000,
  "costPrice": 7000,
  "unit": "Can",
  "imageUrl": "https://...",
  "initialQuantity": 50,
  "minStockLevel": 5
}
```

Success:

```text
Quay về product list.
```

Error:

```text
Barcode trùng
Category không tồn tại
Validation failed
```

---

### 3.3 Edit Product Screen

Route:

```text
/manager/products/{id}/edit
```

API lấy detail:

```http
GET /api/products/{id}
```

API update:

```http
PUT /api/products/{id}
```

Body có thể update một phần:

```json
{
  "categoryId": "uuid-category",
  "name": "Coca Cola 330ml",
  "barcode": "893...",
  "price": 12000,
  "costPrice": 8000,
  "unit": "Can",
  "imageUrl": "https://...",
  "active": true,
  "minStockLevel": 10
}
```

---

### 3.4 Category List Screen

Route:

```text
/manager/categories
```

API:

```http
GET /api/categories
```

Columns:

```text
Name
Description
Actions
```

Actions:

```text
Create
Edit
Delete
```

Create API:

```http
POST /api/categories
```

Update API:

```http
PUT /api/categories/{id}
```

Delete API:

```http
DELETE /api/categories/{id}
```

---

### 3.5 Inventory Screen

Route:

```text
/manager/inventory
```

API:

```http
GET /api/inventory
```

Columns:

```text
Product name
Barcode
Quantity
Min stock level
Low stock badge
```

Low stock rule:

```text
lowStock = true nếu quantity <= minStockLevel
```

---

### 3.6 Inventory Transactions Screen

Route:

```text
/manager/inventory/transactions
```

API:

```http
GET /api/inventory/transactions
```

Columns:

```text
Product
Created by
Type
Quantity change
Before
After
Reference type
Reference id
Created at
```

Type hiện có:

```text
SALE
IMPORT
ADJUSTMENT
```

Phase 1 chủ yếu có `SALE` từ checkout.

---

## 4. Admin Screens

### 4.1 Admin Dashboard

Route:

```text
/admin/dashboard
```

Dùng cho:

```text
ADMIN
```

Hiện backend chưa có report endpoint riêng.

FE phase này có thể hiển thị shortcut:

```text
Products
Categories
Inventory
Orders
POS
```

Phase sau bổ sung:

```text
Revenue report
Inventory report
User management
Role management
```

---

### 4.2 Order Management Screen

Route:

```text
/admin/orders
/manager/orders
```

API:

```http
GET /api/orders
```

Columns:

```text
Order id
Cashier
Customer
Total
Discount
Final amount
Status
Created at
Actions
```

Action:

```text
View detail
View receipt
```

Order status:

```text
PENDING_PAYMENT
PAID
CANCELLED
REFUNDED
```

---

### 4.3 Order Detail Screen

Route:

```text
/admin/orders/{id}
```

API:

```http
GET /api/orders/{id}
```

Display:

```text
Order summary
Cashier
Customer
Items
Payment info
Receipt info
Inventory transaction link optional
```

Payment info:

```text
method
provider
status
amountReceived
changeAmount
paidAt
```

---

## 5. Customer Screens

### 5.1 My Orders Screen

Route:

```text
/me/orders
```

Dùng cho:

```text
CUSTOMER
```

API:

```http
GET /api/me/orders
```

Columns/cards:

```text
Order id
Final amount
Status
Created at
Receipt number nếu có
Actions
```

Action:

```text
View order detail
View receipt
```

---

### 5.2 My Points Screen

Route:

```text
/me/points
```

API:

```http
GET /api/me/points
```

Display:

```text
Total points
Explanation: mỗi 10,000 VND = 1 point
```

---

### 5.3 My Vouchers Screen

Route:

```text
/me/vouchers
```

API:

```http
GET /api/me/vouchers
```

Hiện tại backend trả list rỗng.

FE nên hiển thị empty state:

```text
Bạn chưa có voucher nào.
```

---

## 6. PayOS Webhook For FE Understanding

FE không gọi webhook.

Webhook URL backend:

```text
POST /api/payments/payos/webhook
```

PayOS gọi URL này khi giao dịch đổi trạng thái.

Khi chạy local:

```text
localhost không dùng làm webhook được.
Cần ngrok expose port 8080.
```

Ví dụ:

```text
ngrok http 8080
```

Nếu ngrok URL là:

```text
https://abc123.ngrok-free.app
```

Webhook URL đăng ký với PayOS là:

```text
https://abc123.ngrok-free.app/api/payments/payos/webhook
```

---

## 7. Frontend Permission Matrix

| Screen | ADMIN | MANAGER | CASHIER | CUSTOMER |
|---|---:|---:|---:|---:|
| Login | yes | yes | yes | yes |
| Register | yes | yes | yes | yes |
| POS Checkout | yes | yes | yes | no |
| Product Management | yes | yes | no | no |
| Category Management | yes | yes | no | no |
| Inventory | yes | yes | no | no |
| Orders all | yes | yes | yes | no |
| My Orders | no | no | no | yes |
| My Points | no | no | no | yes |
| Receipt view | yes | yes | yes | yes |

---

## 8. Suggested FE Build Order

```text
1. Login
2. Product list + create category/product seed data
3. POS screen scan barcode
4. Cash checkout
5. Receipt modal + print
6. PayOS initiate + waiting state
7. Order detail polling for PayOS success
8. Inventory screen
9. Customer my orders/points
```
