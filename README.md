# MiMo CodeForge ⚡

AI-powered code generation, review, debugging & explanation platform built on **Xiaomi MiMo V2.5-Pro API** with chain-of-thought reasoning.

![MiMo V2.5-Pro](https://img.shields.io/badge/MiMo-V2.5--Pro-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-22.x-green?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)
![API](https://img.shields.io/badge/API-OpenAI_Compatible-purple?style=for-the-badge)

## 🚀 Overview

MiMo CodeForge is a developer tool that leverages Xiaomi's MiMo V2.5-Pro reasoning model to provide intelligent code assistance. It integrates directly with the [MiMo API Open Platform](https://platform.xiaomimimo.com) using the OpenAI-compatible protocol.

### Why MiMo V2.5-Pro?

- **Chain-of-Thought Reasoning** — MiMo shows its thinking process, making responses transparent and verifiable
- **AIME 2025 Score: 68.5** — Exceptional mathematical and logical reasoning
- **LiveCodeBench: 55.4** — Top-tier code generation capabilities
- **7B efficiency** — Achieves GPT-4-class reasoning at a fraction of the size

## ⚡ Features

| Feature | Description |
|---------|-------------|
| **Code Generation** | Generate production-ready code with detailed comments |
| **Code Review** | Security, performance, and best-practice analysis |
| **Debugging** | Root cause analysis with chain-of-thought reasoning |
| **Code Explanation** | Step-by-step breakdown at any skill level |

## 🔧 Tech Stack

- **Backend**: Pure Node.js (zero dependencies)
- **Frontend**: Vanilla JS + Tailwind CSS (CDN)
- **AI Model**: Xiaomi MiMo-V2.5-Pro via OpenAI-compatible API
- **Protocol**: OpenAI Chat Completions API
- **Deployment**: Vercel Serverless / Any Node.js host

## 📦 Quick Start

```bash
# Clone
git clone https://github.com/smokyrudeboys/mimo-codeforge.git
cd mimo-codeforge

# Set MiMo API key (from platform.xiaomimimo.com)
export MIMO_API_KEY=sk-your-key-here

# Run
node server.js
```

Visit `http://localhost:3000`

## 🔑 Getting Your MiMo API Key

1. Register at [platform.xiaomimimo.com](https://platform.xiaomimimo.com)
2. Go to Console → API Keys
3. Create a new key (format: `sk-xxxxx`)
4. Set as environment variable: `export MIMO_API_KEY=sk-xxxxx`

## 📡 API Reference

### Base Configuration

```
Base URL: https://api.xiaomimimo.com/v1
Model: MiMo-V2.5-Pro
Protocol: OpenAI Compatible
```

### Endpoints

#### POST `/api/generate`
Generate code from natural language description.

```json
{
  "prompt": "Create a binary search function",
  "language": "python",
  "context": "Must handle edge cases"
}
```

#### POST `/api/review`
AI-powered code review with severity ratings.

```json
{
  "code": "def login(user, pwd): ...",
  "language": "python",
  "focus": "security"
}
```

#### POST `/api/debug`
Root cause analysis and fix suggestions.

```json
{
  "code": "function broken() { ... }",
  "error": "TypeError: Cannot read property 'x' of undefined",
  "language": "javascript"
}
```

#### POST `/api/explain`
Step-by-step code explanation.

```json
{
  "code": "const memo = (fn) => { ... }",
  "language": "javascript",
  "level": "beginner"
}
```

### Response Format

```json
{
  "success": true,
  "type": "generate",
  "result": "...",
  "reasoning": "Step 1: Analyze the requirements...",
  "usage": { "prompt_tokens": 150, "completion_tokens": 500, "total_tokens": 650 },
  "model": "MiMo-V2.5-Pro"
}
```

## 🏗️ Architecture

```
mimo-codeforge/
├── server.js          # Node.js server + MiMo API integration
├── package.json       # Project metadata (zero deps)
├── public/
│   └── index.html     # SPA with all 4 tools
├── vercel.json        # Vercel deployment config
├── README.md
└── LICENSE
```

## 🌐 Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel --prod
```

Set `MIMO_API_KEY` in Vercel Environment Variables.

### Docker

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY . .
ENV MIMO_API_KEY=sk-your-key
EXPOSE 3000
CMD ["node", "server.js"]
```

### Any VPS

```bash
export MIMO_API_KEY=sk-your-key
node server.js
# Or with PM2: pm2 start server.js --name mimo-codeforge
```

## 🔌 MiMo Platform Integration

This project uses the following MiMo API features:

- **OpenAI-compatible chat completions** (`/v1/chat/completions`)
- **Chain-of-thought reasoning** (`reasoning_content` in response)
- **Developer role messages** for system instructions
- **Token usage tracking** for monitoring consumption

Compatible with MiMo Token Plan (all tiers: Lite, Standard, Pro, Max).

### Supported Models

| Model | Use Case | Credit Rate |
|-------|----------|-------------|
| MiMo-V2.5-Pro | Complex reasoning, code generation | 2x |
| MiMo-V2.5 | General tasks, explanations | 1x |
| MiMo-V2-Omni | Multimodal understanding | 1x |

## 🛠️ Development Tools Integration

MiMo CodeForge is designed to complement your existing AI coding workflow:

- **Claude Code** — Use MiMo as backend model via Token Plan
- **Cursor** — Configure MiMo as custom model provider
- **OpenCode** — Direct MiMo API integration
- **Hermes Agent** — MiMo as reasoning provider

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Xiaomi AI Lab](https://github.com/XiaomiMiMo) — MiMo model development
- [MiMo API Platform](https://platform.xiaomimimo.com) — API infrastructure
- [MiMo Orbit 100T Program](https://100t.xiaomimimo.com) — Creator incentive program

---

<p align="center">
  <strong>Built with ⚡ using Xiaomi MiMo V2.5-Pro</strong><br>
  <sub>Empowering developers with AI-driven code intelligence</sub>
</p>
