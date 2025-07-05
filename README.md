# 🎁 Secret Santa

A modern, full-stack Secret Santa application built with React, Node.js, and PostgreSQL. Create and manage Secret Santa events, invite participants, and automatically assign gift recipients while maintaining the surprise element.

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose**
- **Make** (usually pre-installed on macOS/Linux)

### 🏃‍♂️ Get Up and Running (4 commands)

```bash
git clone <repository-url>
cd secret-santa
cp .env.example .env    # Setup environment
make start
```

That's it! 🎉

> **💡 Note:** The default `.env` settings work out of the box. For custom configuration, see [ENV_SETUP.md](ENV_SETUP.md)

**Access your application:**

- **Frontend:** <http://localhost:5173>
- **API:** <http://localhost:3000>

### 🛑 Stop the application

```bash
make stop
```

---

## 🔧 Available Commands

Run `make help` to see all available commands:

```bash
make help          # Show all available commands
make start         # Start the application
make stop          # Stop the application
make restart       # Restart the application
make logs          # View logs
make health        # Check service health
make test          # Run tests
make clean         # Clean up containers
```

---

## 📌 Features

- 🎄 **Event Management** – Create and manage Secret Santa events
- 👥 **Participant Handling** – Invite and manage users
- 🤖 **Smart Assignments** – Auto-match gift givers and receivers
- ⚡ **Real-time Updates** – Live updates on event progress
- 📱 **Responsive UI** – Mobile and desktop-friendly
- 🔐 **Secure Auth** – JWT-based authentication & authorization

## 🏗️ Tech Stack

**Frontend:** React 18 + TypeScript + Vite + Tailwind CSS

**Backend:** Node.js + Express + TypeScript + Prisma

**Database:** PostgreSQL

**DevOps:** Docker + Docker Compose

---

## 📚 Need Help?

- **Environment Setup:** See [ENV_SETUP.md](ENV_SETUP.md)
- **Troubleshooting:** See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Development Guide:** See [DEVELOPMENT.md](DEVELOPMENT.md)
- **API Documentation:** See [API.md](API.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Happy Secret Santa! 🎅🎁**
