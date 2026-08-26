# Freight Flow

> **A full-stack freight marketplace and logistics management platform connecting shippers with transporters through competitive bidding, secure payments, and end-to-end load management.**
Freight Flow is a modern logistics platform designed to simplify freight transportation by bringing **shippers, transporters, and administrators** onto a single platform.
>
🌐 [Live Demo](https://freight-flow-aq2v.onrender.com)

Shippers can create and manage freight loads, transporters can discover loads and place competitive bids, and the platform manages the complete lifecycle from **load creation → bidding → acceptance → transportation → delivery → invoicing**.

---

## ✨ Key Features

### 👤 Role-Based Platform

Freight Flow supports three primary user roles:

* 🚚 **Shipper** — Create and manage freight loads
* 🚛 **Transporter** — Discover loads and submit bids
* 🛡️ **Admin** — Manage and monitor the platform

Authentication and role management are handled securely using **NextAuth**.

---

### 📦 Load Management

Shippers can create detailed freight loads with:

* Pickup and delivery locations
* Distance information
* Material type
* Packaging type
* Cargo weight
* Base price
* Special instructions
* Fragile cargo requirements
* Tarp requirements
* Labour requirements
* Bidding deadline

Loads move through a defined lifecycle:

```text
OPEN
  ↓
BIDDING_CLOSED
  ↓
IN_TRANSIT
  ↓
ARRIVED
  ↓
DELIVERED
```

Cancelled loads are also supported.

---

### 💰 Competitive Bidding

Transporters can compete for available loads by submitting bids.

Each bid contains:

* Bid amount
* Additional notes
* Bid status
* Submission timestamp
* Modification tracking

Supported bid states include:

```text
ACTIVE
OUTBID
ACCEPTED
REJECTED
WITHDRAWN
```

The shipper can review available bids and select the most suitable transporter.

---

### 💳 Escrow & Wallet System

Freight Flow models a secure payment workflow using:

* Wallets
* Escrow transactions
* Platform fees
* Refunds
* Escrow holds
* Escrow releases

This creates a foundation for safer transactions between shippers and transporters.

---

### 🧾 Invoice Management

The platform supports invoice generation and storage associated with completed loads.

Invoices contain:

* Invoice number
* Load reference
* Amount
* GST amount
* Total amount
* Issue date
* Optional PDF URL

---

### 📄 Document Management

Documents can be associated with users and loads.

Examples include:

* RC
* Driving License
* Insurance
* Proof of Delivery
* Invoice

File uploads are supported through **UploadThing**.

---

### 🚛 Transporter Profiles

Transporters can maintain information such as:

* Vehicle number
* Vehicle type
* Vehicle capacity
* Availability
* Total trips
* Rating
* Rating count

This helps shippers evaluate transporters before accepting bids.

---

### 📊 Analytics & Visualizations

The application uses **Recharts** for data visualization and provides the foundation for operational dashboards and analytics.

---

### ⚡ Real-Time Communication

**Socket.IO** and Socket.IO Client are included to support real-time functionality such as live platform updates and notifications.

---

### 🔐 Authentication & Security

The application uses:

* NextAuth
* Prisma Adapter
* Password hashing with bcrypt
* Role-based access
* PostgreSQL-backed sessions
* Zod validation

User accounts can contain additional business information such as:

* Company name
* GST number
* Phone number
* KYC status

KYC states:

```text
PENDING
VERIFIED
REJECTED
```

---

## 🏗️ Tech Stack

### Frontend

* **Next.js 16**
* **React 19**
* **TypeScript**
* **Tailwind CSS 4**
* **shadcn/ui**
* **Lucide React**
* **Framer Motion**

### Backend

* **Next.js App Router**
* **NextAuth**
* **Prisma ORM**
* **PostgreSQL**
* **Socket.IO**

### Database & Infrastructure

* PostgreSQL
* Prisma
* Neon Serverless PostgreSQL adapter

### Other Tools

* React Hook Form
* Zod
* Recharts
* UploadThing
* React PDF
* bcryptjs
* date-fns
* Sonner


---

## 🗄️ Database Architecture

Freight Flow uses **PostgreSQL with Prisma ORM**.

The core data model contains entities such as:

```text
User
 ├── Account
 ├── Session
 ├── TransporterProfile
 ├── Wallet
 ├── Documents
 ├── Loads
 └── Bids

Load
 ├── Bids
 ├── Accepted Bid
 ├── Documents
 ├── Escrow Transaction
 └── Invoice

Wallet
 └── Escrow Transactions
```

The Prisma schema defines separate models for users, transporter profiles, loads, bids, wallets, escrow transactions, documents and invoices, along with authentication models.

---

## 📁 Project Structure

```text
Freight-Flow/
│
├── prisma/
│   └── schema.prisma
│
├── public/
│
├── src/
│   ├── actions/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   └── proxy.ts
│
├── .gitignore
├── components.json
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── prisma.config.ts
├── tsconfig.json
└── README.md
```

The repository is organized around the Next.js App Router with dedicated `actions`, `components`, `hooks`, `lib`, and `types` directories.

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Nikhil-Chaturvedi-077/Freight-Flow.git

cd Freight-Flow
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` or `.env.local` file and configure the required credentials.

Example:

```env
DATABASE_URL="your_postgresql_connection_string"

AUTH_SECRET="your_auth_secret"

# Add other credentials required by your environment
```

> Never commit your `.env` files or production secrets to GitHub.

---

### 4. Generate Prisma Client

```bash
npx prisma generate
```

---

### 5. Set up the database

After configuring your PostgreSQL connection:

```bash
npx prisma db push
```

or use your preferred Prisma migration workflow.

---

### 6. Start the development server

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

The repository's current npm scripts use `next dev --turbopack` for development, `prisma generate && next build` for production builds, and `next start` for production execution.

---

## 🔄 Freight Lifecycle

The overall platform workflow can be represented as:

```text
                 ┌──────────────┐
                 │    Shipper   │
                 └──────┬───────┘
                        │
                        ▼
                Create Freight Load
                        │
                        ▼
                ┌───────────────┐
                │     OPEN      │
                └───────┬───────┘
                        │
                        ▼
              Transporters Place Bids
                        │
                        ▼
              Shipper Reviews Bids
                        │
                        ▼
                 Accept Best Bid
                        │
                        ▼
                ┌───────────────┐
                │  IN_TRANSIT   │
                └───────┬───────┘
                        │
                        ▼
                     ARRIVED
                        │
                        ▼
                   DELIVERED
                        │
                        ▼
                  Invoice / Payment
```

---

## 🧑‍💼 User Roles

| Role           | Responsibilities                                 |
| -------------- | ------------------------------------------------ |
| 🚚 Shipper     | Create loads, manage bids, select transporters   |
| 🚛 Transporter | Browse loads, submit bids, manage transportation |
| 🛡️ Admin      | Platform-level management and monitoring         |

---

## 🧩 Core Domain Models

| Model                | Purpose                                      |
| -------------------- | -------------------------------------------- |
| `User`               | Authentication and user/business information |
| `TransporterProfile` | Vehicle and transporter details              |
| `Load`               | Freight shipment information                 |
| `Bid`                | Transporter offers for loads                 |
| `Wallet`             | User wallet and payment tracking             |
| `EscrowTransaction`  | Escrow/payment lifecycle                     |
| `Document`           | Load/user related documents                  |
| `Invoice`            | Billing and invoice information              |
| `Account`            | OAuth/provider account data                  |
| `Session`            | Authentication sessions                      |

---

## 🛡️ Data & Validation

The platform uses strongly typed database models and application-level validation.

Important business states such as load status, bid status, KYC status, material type, packaging type, and transaction type are represented using Prisma enums, reducing invalid state transitions and improving type safety.

---

## 📈 Future Improvements

Potential future enhancements include:

* 🗺️ Live GPS vehicle tracking
* 📍 Interactive route visualization
* 🔔 Advanced real-time notifications
* 💳 Production payment gateway integration

---

## 🎯 Project Goals

Freight Flow aims to solve common problems in freight transportation by providing:

* Better load discovery
* Transparent competitive bidding
* Centralized shipment management
* Secure payment workflows
* Digital documentation
* Role-based operational dashboards
* Better communication between shippers and transporters

##

##

##
