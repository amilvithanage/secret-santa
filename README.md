# 🎁 Secret Santa

A modern, full-stack Secret Santa application built with React, Node.js, and PostgreSQL. This application allows users to create and manage Secret Santa events, invite participants, and automatically assign gift recipients while maintaining the surprise element.

## 📌 Features

- 🎄 **Event Management** – Create and manage Secret Santa events
- 👥 **Participant Handling** – Invite and manage users
- 🤖 **Smart Assignments** – Auto-match gift givers and receivers
- ⚡ **Real-time Updates** – Live updates on event progress
- 📱 **Responsive UI** – Mobile and desktop-friendly
- 🔐 **Secure Auth** – JWT-based authentication & authorization

## 🏗️ Tech Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling

### Backend

- **Node.js** with TypeScript
- **Express.js** for API framework
- **PostgreSQL** for database
- **Prisma** for database ORM
- **JWT** for authentication

### Development

- **TypeScript** for type safety
- **ESLint** and **Prettier** for code quality
- **Jest** for testing
- **Docker** for containerization

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL (v14+)
- Docker & Docker Compose

### 🧰 Installation

1. Clone the repository:

```bash
# TODO: Add repository-url
git clone <repository-url>
cd secret-santa
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

- Copy `.env.example` to `.env` and fill in the required values.

### 💻 Running the Application

To run the application locally, use Docker Compose:

```
docker-compose up
```

This command will build and start both the frontend and backend services.

### 🧪 Running Tests

To run tests for the frontend and backend:

- For the client:

  ```
  npm test:client
  ```

- For the server:

  ```
  npm test:server
  ```

## 📁 Project Structure

The project is organized into several key directories:

```
secret-santa/
├── apps/
│   ├── client/      # React frontend (Vite + Tailwind)
│   └── server/      # Node.js backend (Express + Prisma)
│
├── packages/        # Shared code/libraries (e.g., TypeScript types)
├── .github/         # CI/CD workflows (GitHub Actions)
├── docker-compose.yml
├── .env.example
├── README.md
```

## ⚙️ CI/CD

The project includes a CI/CD pipeline defined in `.github/workflows/main.yml`, which automates the build, test, and deployment processes.
