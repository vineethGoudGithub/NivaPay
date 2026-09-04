# NivaPay — Crypto Wallet Web Application

A full-stack crypto wallet application engineered with **Spring Boot 3**, **PostgreSQL (NeonDB Serverless)**, **React 18**, **Vite**, and **Docker**. NivaPay provides seamless user registration, authenticated wallet management, real-time balance tracking, and atomic peer-to-peer balance transfers with optimistic locking.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [NeonDB PostgreSQL Setup](#-neondb-postgresql-setup)
- [Environment Configuration (.env)](#-environment-configuration-env)
- [Quick Start: Docker & Docker Compose](#-quick-start-docker--docker-compose)
- [Local Development Setup](#-local-development-setup)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
- [API Reference](#-api-reference)
- [Project Directory Structure](#-project-directory-structure)
- [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 🌟 Overview

NivaPay allows users to create an account, view their personal cryptocurrency balance, receive payments using their account address/email or dynamic QR code, and send payments securely to other registered users. 

The backend guarantees data integrity during concurrent transfers via **JPA Optimistic Locking (`@Version`)** and transactional boundaries (`@Transactional`). All data persists safely on a serverless **NeonDB PostgreSQL** database cluster with SSL encryption enabled.

---

## 🚀 Key Features

- **User Authentication & Profile**: Secure signup, login, and user profile management with password hashing.
- **Automated Wallet Provisioning**: A unique wallet instance is automatically provisioned for every registered user upon signup.
- **Atomic Peer-to-Peer Transfers**: Transfer funds safely between users by recipient email. Race conditions are eliminated via optimistic locking.
- **Dynamic QR Code Payment Support**: Instantly generate QR codes linked to user account identifiers for easy payment requests.
- **Serverless PostgreSQL**: Backed by high-performance, autoscaling NeonDB with SSL pooling.
- **Full Dockerization**: Production-ready multi-stage Dockerfiles for both backend and frontend, managed with Docker Compose.

---

## 🛠️ Architecture & Tech Stack

### Backend
- **Framework**: Spring Boot 3.2.5 (Java 17)
- **Persistence**: Spring Data JPA & Hibernate
- **Database**: PostgreSQL (NeonDB Serverless)
- **Driver**: `org.postgresql:postgresql`
- **Environment Management**: `dotenv-java` + Spring Environment Variables
- **Build Tool**: Apache Maven (Wrapper included)

### Frontend
- **Framework**: React 18 + Vite
- **Routing**: React Router v6
- **Animations**: Framer Motion
- **Web Server (Docker)**: Nginx Alpine (Reverse Proxy & SPA routing)

---

## 🐘 NeonDB PostgreSQL Setup

The application is configured to connect to your **NeonDB PostgreSQL** database:

- **Raw Connection URI**:
  ```text
  postgresql://neondb_owner:npg_qFNjQTai85RB@ep-odd-butterfly-a5u74p8l-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
  ```

- **JDBC Connection Parameters**:
  - **JDBC URL**: `jdbc:postgresql://ep-odd-butterfly-a5u74p8l-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require`
  - **Host**: `ep-odd-butterfly-a5u74p8l-pooler.us-east-2.aws.neon.tech`
  - **Port**: `5432`
  - **Database Name**: `neondb`
  - **Username**: `neondb_owner`
  - **Password**: `npg_qFNjQTai85RB`
  - **SSL Mode**: `require`

The schema tables (`users`, `wallets`) are automatically initialized and kept in sync by Hibernate using `spring.jpa.hibernate.ddl-auto=update`.

---

## 🔐 Environment Configuration (.env)

A root `.env` file and `frontend/.env` file have been provided.

### Root `.env` (Backend & Docker Compose)
```env
# Server Configuration
PORT=6060

# NeonDB PostgreSQL Credentials
DATABASE_URL=postgresql://neondb_owner:npg_qFNjQTai85RB@ep-odd-butterfly-a5u74p8l-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
SPRING_DATASOURCE_URL=jdbc:postgresql://ep-odd-butterfly-a5u74p8l-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
SPRING_DATASOURCE_USERNAME=neondb_owner
SPRING_DATASOURCE_PASSWORD=npg_qFNjQTai85RB

# Hibernate Mode
SPRING_JPA_HIBERNATE_DDL_AUTO=update

# Frontend API URL
VITE_API_BASE=http://localhost:6060/api
```

### Frontend `.env` (`frontend/.env`)
```env
VITE_API_BASE=http://localhost:6060/api
```

> **Security Note**: Never commit actual secrets to public source control repositories. A `.env.example` template is provided for sharing.

---

## 🐳 Quick Start: Docker & Docker Compose

To build and run the entire stack (Backend + Frontend) in isolated Docker containers:

### 1. Build and start containers
```bash
docker compose up --build -d
```

### 2. Verify running containers
```bash
docker compose ps
```
Services exposed:
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:6060](http://localhost:6060)

### 3. View container logs
```bash
# Backend logs
docker compose logs -f backend

# Frontend logs
docker compose logs -f frontend
```

### 4. Stop containers
```bash
docker compose down
```

---

## 💻 Local Development Setup

### Prerequisites
- **Java**: OpenJDK 17 or higher
- **Node.js**: v18 or v20+ (with npm)
- **Maven**: 3.8+ (or use included `./mvnw` / `mvnw.cmd`)

---

### 1. Backend Setup

1. Open a terminal in the project root:
   ```bash
   cd wallet
   ```
2. Verify your `.env` file exists with the NeonDB credentials.
3. Build and launch the Spring Boot application:
   ```bash
   # Windows
   mvnw.cmd spring-boot:run

   # Linux / macOS
   ./mvnw spring-boot:run
   ```
4. The backend starts on **port 6060**:
   - Health check: [http://localhost:6060/](http://localhost:6060/)

---

### 2. Frontend Setup

1. Open a new terminal and navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the web interface at **[http://localhost:5173](http://localhost:5173)**.

---

## 📡 API Reference

Base URL: `http://localhost:6060/api`

### Authentication Endpoints

#### 1. User Registration
- **Endpoint**: `POST /auth/signup`
- **Request Body**:
  ```json
  {
    "name": "Alex Smith",
    "email": "alex@example.com",
    "password": "SecurePassword123"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "id": 1,
    "name": "Alex Smith",
    "email": "alex@example.com",
    "createdAt": "2026-09-04T22:00:00"
  }
  ```

#### 2. User Login
- **Endpoint**: `POST /auth/login`
- **Request Body**:
  ```json
  {
    "email": "alex@example.com",
    "password": "SecurePassword123"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "id": 1,
    "name": "Alex Smith",
    "email": "alex@example.com"
  }
  ```

---

### Wallet Endpoints

#### 3. Get Wallet Balance
- **Endpoint**: `GET /wallet?userId={userId}`
- **Response** (`200 OK`):
  ```json
  {
    "id": 1,
    "balance": 1500.00000000,
    "version": 0,
    "createdAt": "2026-09-04T22:00:00",
    "updatedAt": "2026-09-04T22:00:00"
  }
  ```

#### 4. Send Funds (Transfer)
- **Endpoint**: `POST /wallet/send?userId={senderUserId}`
- **Request Body**:
  ```json
  {
    "recipientEmail": "bob@example.com",
    "amount": 50.00
  }
  ```
- **Response** (`200 OK`): Returns updated sender wallet.

---

### User Endpoints

#### 5. Get User Profile
- **Endpoint**: `GET /user/profile?userId={userId}`
- **Response** (`200 OK`):
  ```json
  {
    "id": 1,
    "name": "Alex Smith",
    "email": "alex@example.com",
    "wallet": {
      "id": 1,
      "balance": 1450.00000000
    }
  }
  ```

---

## 📁 Project Directory Structure

```text
wallet/
├── Dockerfile                    # Multi-stage Spring Boot Dockerfile
├── docker-compose.yml            # Container orchestration (Backend + Frontend)
├── .dockerignore                 # Exclusions for backend Docker build
├── .env                          # Backend environment variables & NeonDB credentials
├── .env.example                  # Template environment variables file
├── pom.xml                       # Maven configuration with PostgreSQL driver
├── src/                          # Spring Boot Java application
│   └── main/
│       ├── java/app/
│       │   ├── BackendApplication.java
│       │   ├── config/           # CORS & MVC configuration
│       │   ├── controller/       # Auth, Wallet, User controllers
│       │   ├── dto/              # Data transfer objects
│       │   ├── model/            # User & Wallet JPA entities
│       │   ├── repo/             # Spring Data repositories
│       │   └── services/         # Business logic & Hash utilities
│       └── resources/
│           └── application.properties # NeonDB PostgreSQL & Hibernate configs
└── frontend/                     # React + Vite frontend application
    ├── Dockerfile                # Multi-stage frontend Dockerfile (Vite build + Nginx)
    ├── nginx.conf                # Production Nginx reverse proxy & SPA config
    ├── .dockerignore             # Exclusions for frontend Docker build
    ├── .env                      # Frontend environment variables
    ├── .env.example              # Frontend template environment variables
    ├── package.json              # React dependencies and scripts
    ├── vite.config.js            # Vite configuration with proxy
    └── src/
        ├── api.js                # Dynamic API client using VITE_API_BASE
        ├── App.jsx               # Root React component
        ├── main.jsx              # Application entry point
        └── pages/                # Dashboard, Login, Signup pages
```

---

## ❓ Troubleshooting & FAQs

### 1. SSL Connection Errors with NeonDB
NeonDB mandates SSL (`sslmode=require`). Verify that your `SPRING_DATASOURCE_URL` includes `?sslmode=require`.

### 2. Port Conflict on 6060 or 3000
If port `6060` or `3000` is already in use by another service on your host machine, change the host port mappings in `docker-compose.yml`:
```yaml
ports:
  - "7070:6060" # backend
  - "8080:80"   # frontend
```

### 3. Frontend Cannot Connect to Backend
Make sure `VITE_API_BASE` is pointing to your active backend host (`http://localhost:6060/api` when accessing locally from your browser).
