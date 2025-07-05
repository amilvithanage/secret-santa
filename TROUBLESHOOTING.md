# 🚨 Troubleshooting Guide

This guide helps you resolve common issues when running the Secret Santa application.

## Quick Fixes

### 🔄 Reset Everything

If you're having issues, try a complete reset:

```bash
make clean
make start
```

### 🏥 Check Health

Check if all services are running properly:

```bash
make health
```

---

## Common Issues

### 1. 🐳 Docker Issues

**Problem:** Docker containers won't start

**Solutions:**
```bash
# Check if Docker is running
docker --version
docker compose --version

# Clean up and restart
make clean
make start

# Check container status
docker compose ps

# View detailed logs
make logs
```

### 2. 🔌 Port Conflicts

**Problem:** "Port already in use" errors

**Solutions:**
```bash
# Check what's using the ports
lsof -i :3000    # Backend API
lsof -i :5173    # Frontend
lsof -i :5432    # PostgreSQL

# Kill processes using the ports
kill -9 <PID>

# Or use different ports by editing .env file
```

### 3. 🗄️ Database Connection Issues

**Problem:** "Database connection failed" or "Table does not exist"

**Solutions:**
```bash
# Check database status
make logs-db

# Reset database
make db-reset

# Run migrations
make db-migrate

# Check database connection
docker compose exec postgres pg_isready -U secret_santa_user -d secret_santa
```

### 4. 🌐 Frontend Not Loading

**Problem:** Frontend shows blank page or connection errors

**Solutions:**
```bash
# Check frontend logs
make logs-client

# Verify API connection
curl http://localhost:3000/api/health

# Check environment variables
cat .env | grep VITE_API_URL
```

### 5. 🔧 Environment Variable Issues

**Problem:** Application not reading environment variables

**Solutions:**
```bash
# Ensure .env file exists
ls -la .env

# Recreate from template
cp .env.example .env

# Restart services after env changes
make restart
```

### 6. 🧪 Tests Failing

**Problem:** Tests not running or failing

**Solutions:**
```bash
# Run tests with verbose output
make test

# Run specific test suites
make test-server
make test-client

# Check test environment
npm run test -- --verbose
```

---

## Advanced Troubleshooting

### Docker Deep Clean

If you're having persistent Docker issues:

```bash
# Stop all containers
make stop

# Remove all containers, networks, and volumes
docker compose down -v --remove-orphans

# Clean Docker system
docker system prune -af

# Rebuild everything
make start
```

### Database Issues

If database problems persist:

```bash
# Connect to database directly
docker compose exec postgres psql -U secret_santa_user -d secret_santa

# Check database tables
\dt

# Check database logs
docker compose logs postgres

# Reset database completely
make clean
make start
make db-migrate
```

### Network Issues

If services can't communicate:

```bash
# Check Docker networks
docker network ls

# Inspect the application network
docker network inspect secret-santa_default

# Check container connectivity
docker compose exec server ping postgres
```

---

## Getting Help

### Collect Debug Information

Before asking for help, collect this information:

```bash
# System information
docker --version
docker compose --version
make --version

# Service status
make health
docker compose ps

# Recent logs
make logs > debug-logs.txt
```

### Log Files

Important log locations:
- **Application logs:** `make logs`
- **Database logs:** `make logs-db`
- **Server logs:** `make logs-server`
- **Client logs:** `make logs-client`

### Common Log Messages

**"Connection refused"** → Service not started or wrong port
**"Permission denied"** → Docker permissions or file ownership
**"Port already in use"** → Another service using the same port
**"No such file or directory"** → Missing .env file or wrong paths

---

## Still Having Issues?

1. **Check the logs:** `make logs`
2. **Try a clean restart:** `make clean && make start`
3. **Verify prerequisites:** Docker, Docker Compose, Make
4. **Check environment:** `.env` file exists and has correct values
5. **Open an issue:** Include debug information and logs
