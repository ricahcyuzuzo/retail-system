# Proforma Invoice Management System

## Overview
The Proforma Invoice Management system allows users to create, track, and manage proforma invoices for their retail business. Proforma invoices are preliminary invoices sent to customers before the actual sale, providing them with a detailed breakdown of costs.

## Features

### Backend API Endpoints

#### 1. Create Proforma Invoice
- **POST** `/api/proformas`
- **Description**: Create a new proforma invoice
- **Authentication**: Required (Bearer token)
- **Request Body**:
  ```json
  {
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "+1234567890",
    "customerAddress": "123 Main St, City, State",
    "items": [
      {
        "productId": "product_id_here",
        "quantity": 2,
        "unitPrice": 25.00,
        "description": "Optional item description"
      }
    ],
    "taxAmount": 5.00,
    "discountAmount": 2.50,
    "currency": "USD",
    "validUntil": "2024-12-31",
    "notes": "Optional notes",
    "terms": "Payment terms and conditions"
  }
  ```

#### 2. List Proforma Invoices
- **GET** `/api/proformas`
- **Description**: Get all proforma invoices with optional filtering
- **Authentication**: Required (Bearer token)
- **Query Parameters**:
  - `status`: Filter by status (draft, sent, accepted, rejected, paid, expired)
  - `customerName`: Search by customer name
  - `page`: Page number for pagination
  - `limit`: Number of items per page

#### 3. Get Proforma Invoice Details
- **GET** `/api/proformas/:id`
- **Description**: Get detailed information about a specific proforma invoice
- **Authentication**: Required (Bearer token)

#### 4. Update Proforma Invoice Status
- **PUT** `/api/proformas/:id/status`
- **Description**: Update the status of a proforma invoice
- **Authentication**: Required (Bearer token)
- **Request Body**:
  ```json
  {
    "status": "sent"
  }
  ```

#### 5. Send Proforma Invoice
- **PUT** `/api/proformas/:id/send`
- **Description**: Mark a draft proforma invoice as sent
- **Authentication**: Required (Bearer token)

### Frontend Features

#### 1. Proforma Invoice List
- View all proforma invoices in a table format
- Filter by status
- Search by customer name
- Pagination support
- Status indicators with color coding

#### 2. Create Proforma Invoice
- Customer information form
- Dynamic item addition/removal
- Product selection with automatic price population
- Tax and discount calculations
- Terms and conditions
- Validation for required fields

#### 3. Proforma Invoice Details
- Complete invoice information display
- Item breakdown with quantities and prices
- Status management with action buttons
- Customer details
- Totals calculation

#### 4. Status Management
- **Draft**: Initial state when created
- **Sent**: When invoice is sent to customer
- **Accepted**: When customer accepts the invoice
- **Rejected**: When customer rejects the invoice
- **Paid**: When payment is received
- **Expired**: When validity period expires

## Database Schema

### ProformaInvoice Model
```javascript
{
  invoiceNumber: String (auto-generated),
  customerName: String (required),
  customerEmail: String,
  customerPhone: String,
  customerAddress: String,
  items: [ProformaItem],
  subtotal: Number (required),
  taxAmount: Number (default: 0),
  discountAmount: Number (default: 0),
  totalAmount: Number (required),
  currency: String (default: 'USD'),
  status: String (enum: ['draft', 'sent', 'accepted', 'rejected', 'paid', 'expired']),
  validUntil: Date,
  notes: String,
  terms: String,
  createdBy: ObjectId (ref: 'User'),
  sentAt: Date,
  paidAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### ProformaItem Model
```javascript
{
  productId: ObjectId (ref: 'Product'),
  productName: String,
  quantity: Number,
  unitPrice: Number,
  totalPrice: Number,
  description: String
}
```

## Usage Examples

### Creating a Proforma Invoice
1. Navigate to "Proforma Invoices" in the sidebar
2. Click "Create Proforma" button
3. Fill in customer information
4. Add items by selecting products and quantities
5. Set tax and discount amounts
6. Add optional notes and terms
7. Click "Create Proforma"

### Managing Invoice Status
1. View the proforma invoice list
2. Click "View" on any invoice
3. Use the action buttons to update status:
   - "Mark Accepted" for sent invoices
   - "Mark Rejected" for sent invoices
   - "Mark as Paid" for accepted invoices

### Filtering and Searching
1. Use the status filter dropdown to show specific statuses
2. Use the customer name search to find specific customers
3. Clear filters to show all invoices

## Integration

The Proforma Invoice system integrates with:
- **Product Management**: Uses existing products for invoice items
- **User Authentication**: Requires login for all operations
- **Sales System**: Can be converted to actual sales when accepted
- **Reporting**: Can be included in financial reports

## Security

- All endpoints require authentication
- User can only access invoices they created
- Input validation on all fields
- SQL injection protection through Mongoose
- XSS protection through proper data sanitization

## Future Enhancements

1. **Email Integration**: Send proforma invoices via email
2. **PDF Generation**: Generate printable PDF invoices
3. **Payment Integration**: Connect with payment gateways
4. **Automated Expiry**: Automatic status updates for expired invoices
5. **Bulk Operations**: Create multiple invoices at once
6. **Templates**: Customizable invoice templates
7. **Notifications**: Email notifications for status changes 