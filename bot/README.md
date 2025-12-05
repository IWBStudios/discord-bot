# Instalation

## Requirements 
* [Node.js >= v22.21](https://nodejs.org/en/download)
* [Bun.js >= v1.3.3](https://bun.com/docs/installation)
* PM2

---

Install PM2
```bash
npm install -g pm2
```

Install dependencies
```bash
cd bot
bun install
```

---

## How to run
### Development:
```bash
bun run dev
```

### Production:
Standalone:
```bash
bun run build
bun run start
```

With PM2
```bash
bun run start:prod
```