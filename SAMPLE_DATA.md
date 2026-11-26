# TicketFlow – Sample Input Data for API Testing

This document contains structured, copy-pasteable sample payloads and test scenarios for verifying all endpoints of the **TicketFlow** API.

Base URL: `http://localhost:5000`

---

## Table of Contents

1. [User Authentication Payloads](#1-user-authentication-payloads)
2. [Support Ticket Payloads](#2-support-ticket-payloads)
3. [Ticket Status & Priority Updates](#3-ticket-status--priority-updates)
4. [Comment Payloads](#4-comment-payloads)
5. [Search, Filtering & Pagination Queries](#5-search-filtering--pagination-queries)
6. [Negative Test Cases (Validation & Authorization)](#6-negative-test-cases-validation--authorization)
7. [End-to-End cURL Testing Sequence](#7-end-to-end-curl-testing-sequence)

---

## 1. User Authentication Payloads

### A. Register Standard User 1 (`POST /api/auth/register`)
```json
{
  "name": "Alice Johnson",
  "email": "alice.johnson@example.com",
  "password": "Password123!",
  "role": "USER"
}
```

### B. Register Standard User 2 (`POST /api/auth/register`)
```json
{
  "name": "Bob Martinez",
  "email": "bob.martinez@example.com",
  "password": "Password123!",
  "role": "USER"
}
```

### C. Register Administrator 1 (`POST /api/auth/register`)
```json
{
  "name": "Sarah Connor",
  "email": "sarah.admin@example.com",
  "password": "AdminSecurePassword2026!",
  "role": "ADMIN"
}
```

### D. Register Administrator 2 (`POST /api/auth/register`)
```json
{
  "name": "David Miller",
  "email": "david.admin@example.com",
  "password": "AdminSecurePassword2026!",
  "role": "ADMIN"
}
```

### E. User Login (`POST /api/auth/login`)
```json
{
  "email": "alice.johnson@example.com",
  "password": "Password123!"
}
```

### F. Admin Login (`POST /api/auth/login`)
```json
{
  "email": "sarah.admin@example.com",
  "password": "AdminSecurePassword2026!"
}
```

---

## 2. Support Ticket Payloads

### A. Technical Issue (`POST /api/tickets`)
```json
{
  "title": "High latency on payment gateway integration",
  "description": "Requests to /checkout/process are timing out after 30 seconds during peak checkout times. Error code ERR_CONNECTION_TIMED_OUT observed across multiple sessions.",
  "category": "TECHNICAL",
  "priority": "HIGH"
}
```

### B. Bug Report (`POST /api/tickets`)
```json
{
  "title": "User avatar upload button unresponsive on Safari mobile",
  "description": "Clicking the file upload button on iOS Safari 17.4 does not open the native file selector dialog. Works correctly on desktop Chrome and Android.",
  "category": "BUG",
  "priority": "MEDIUM"
}
```

### C. Billing Dispute (`POST /api/tickets`)
```json
{
  "title": "Duplicate charge on monthly subscription invoice #INV-8921",
  "description": "My credit card was charged twice ($49.00 each) on November 25, 2026 for the Pro tier renewal. Please review the transaction logs and issue a credit refund.",
  "category": "BILLING",
  "priority": "URGENT"
}
```

### D. Feature Request (`POST /api/tickets`)
```json
{
  "title": "Support Webhook notifications for ticket state transitions",
  "description": "We would like to receive real-time HTTP POST webhooks whenever a ticket is marked as IN_PROGRESS or RESOLVED so we can sync status with our internal dashboard.",
  "category": "FEATURE_REQUEST",
  "priority": "LOW"
}
```

### E. General Inquiry (`POST /api/tickets`)
```json
{
  "title": "Data retention and HIPAA compliance inquiries",
  "description": "Could you provide documentation regarding your database backup encryption policies and how audit logs are archived over a 90-day retention period?",
  "category": "GENERAL",
  "priority": "LOW"
}
```

---

## 3. Ticket Status & Priority Updates

### A. User Updating Their Own Ticket (`PUT /api/tickets/:id`)
```json
{
  "title": "High latency on payment gateway - Stack traces included",
  "description": "Updated diagnostics: The issue appears specifically when processing Stripe 3D Secure verification callbacks.",
  "priority": "URGENT"
}
```

### B. Admin Transitioning Ticket to In Progress (`PATCH /api/tickets/:id/status`)
```json
{
  "status": "IN_PROGRESS",
  "priority": "URGENT",
  "assignedTo": "<ADMIN_USER_OBJECT_ID>"
}
```

### C. Admin Resolving Ticket (`PATCH /api/tickets/:id/status`)
```json
{
  "status": "RESOLVED",
  "priority": "MEDIUM"
}
```

### D. Admin Closing Ticket (`PATCH /api/tickets/:id/status`)
```json
{
  "status": "CLOSED"
}
```

---

## 4. Comment Payloads

### A. User Adding Diagnostic Comment (`POST /api/tickets/:ticketId/comments`)
```json
{
  "content": "Attached error logs from client session: [Timestamp: 2026-11-26T10:14:00Z] StripeGatewayException: Connection pool exhausted."
}
```

### B. Admin Providing Troubleshooting Steps (`POST /api/tickets/:ticketId/comments`)
```json
{
  "content": "Hello Alice, our engineering team has provisioned additional connection pool capacity on the payment proxy. Could you retry the transaction now?"
}
```

### C. User Confirming Resolution (`POST /api/tickets/:ticketId/comments`)
```json
{
  "content": "Confirmed! The latency has dropped back below 200ms and checkouts are succeeding. Thank you for the prompt resolution."
}
```

### D. Admin Closing Remarks (`POST /api/tickets/:ticketId/comments`)
```json
{
  "content": "Glad to hear that. We have marked this ticket as RESOLVED. If any further issues arise, feel free to open a new ticket."
}
```

---

## 5. Search, Filtering & Pagination Queries

All query parameters can be combined in `GET /api/tickets`:

### A. Filter Open Tickets Only
```
GET /api/tickets?status=OPEN
```

### B. Filter Urgent Priority Technical Tickets
```
GET /api/tickets?category=TECHNICAL&priority=URGENT
```

### C. Search by Keyword (Matches Title or Description)
```
GET /api/tickets?search=latency
```

### D. Pagination with Ascending Chronological Sorting
```
GET /api/tickets?page=1&limit=5&sortBy=createdAt&sortOrder=asc
```

### E. Complex Multi-Filter (Admin View)
```
GET /api/tickets?status=IN_PROGRESS&priority=HIGH&category=BUG&page=1&limit=10
```

---

## 6. Negative Test Cases (Validation & Authorization)

Use these payloads to verify robust error handling, schema rejection, and RBAC guard enforcement:

### A. Registration with Invalid Email (Expects `400 Bad Request`)
```json
{
  "name": "John Doe",
  "email": "invalid-email-address",
  "password": "Password123!"
}
```

### B. Registration with Short Password (Expects `400 Bad Request`)
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "123"
}
```

### C. Ticket Creation with Missing Description (Expects `400 Bad Request`)
```json
{
  "title": "Short ticket",
  "category": "TECHNICAL"
}
```

### D. Ticket Creation with Invalid Category (Expects `400 Bad Request`)
```json
{
  "title": "Valid Ticket Title",
  "description": "Valid description explaining the support ticket context.",
  "category": "UNKNOWN_CATEGORY"
}
```

### E. Empty Comment Content (Expects `400 Bad Request`)
```json
{
  "content": ""
}
```

### F. Non-Admin Attempting Admin Statistics (Expects `403 Forbidden`)
```
GET /api/admin/stats
Header: Authorization: Bearer <USER_TOKEN>
```

### G. User Attempting to Delete a Resolved Ticket (Expects `400 Bad Request`)
```
DELETE /api/tickets/<RESOLVED_TICKET_ID>
Header: Authorization: Bearer <USER_TOKEN>
```

---

## 7. End-to-End cURL Testing Sequence

Execute these commands in your terminal to test the complete user lifecycle:

```bash
# 1. Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice User",
    "email": "alice.test@example.com",
    "password": "password123",
    "role": "USER"
  }'

# 2. Login to obtain JWT Token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice.test@example.com",
    "password": "password123"
  }'

# (Export the token returned from login)
export TOKEN="<PASTE_YOUR_JWT_TOKEN_HERE>"

# 3. Create a Support Ticket
curl -X POST http://localhost:5000/api/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Database connection spike in cluster east",
    "description": "Queries are experiencing intermittent delays.",
    "category": "TECHNICAL",
    "priority": "HIGH"
  }'

# (Export the ticket _id returned above)
export TICKET_ID="<PASTE_TICKET_ID_HERE>"

# 4. Add a comment to the ticket
curl -X POST http://localhost:5000/api/tickets/$TICKET_ID/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "Logs have been uploaded to S3 diagnostics bucket."
  }'

# 5. Retrieve comments for the ticket
curl -X GET http://localhost:5000/api/tickets/$TICKET_ID/comments \
  -H "Authorization: Bearer $TOKEN"

# 6. Check user notifications
curl -X GET http://localhost:5000/api/notifications \
  -H "Authorization: Bearer $TOKEN"
```
