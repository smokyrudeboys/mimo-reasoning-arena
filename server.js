const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PORT = process.env.PORT || 3000;
const MIMO_API_KEY = process.env.MIMO_API_KEY || '';
const MIMO_BASE_URL = 'https://api.xiaomimimo.com/v1/chat/completions';

const MODELS = {
  'pro': 'MiMo-V2.5-Pro',
  'standard': 'MiMo-V2.5'
};

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    return handleAPI(req, res);
  }

  let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      fs.readFile(path.join(__dirname, 'public', 'index.html'), (e, c) => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(c);
      });
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

function handleAPI(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.url === '/api/generate' && req.method === 'POST') return handleGenerate(req, res);
  if (req.url === '/api/review' && req.method === 'POST') return handleReview(req, res);
  if (req.url === '/api/debug' && req.method === 'POST') return handleDebug(req, res);
  if (req.url === '/api/explain' && req.method === 'POST') return handleExplain(req, res);
  if (req.url === '/api/test' && req.method === 'POST') return handleTestGen(req, res);
  if (req.url === '/api/optimize' && req.method === 'POST') return handleOptimize(req, res);
  if (req.url === '/api/health' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    return res.end(JSON.stringify({
      status: 'ok',
      models: Object.values(MODELS),
      apiConfigured: !!MIMO_API_KEY,
      version: '2.0.0',
      features: ['generate', 'review', 'debug', 'explain', 'test', 'optimize']
    }));
  }

  res.setHeader('Content-Type', 'application/json');
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
}

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function callMiMoAPI(messages, model = 'MiMo-V2.5-Pro') {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
      stream: false
    });

    const url = new URL(MIMO_BASE_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MIMO_API_KEY}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(parsed.error.message || JSON.stringify(parsed.error)));
            return;
          }
          const choice = parsed.choices?.[0];
          resolve({
            content: choice?.message?.content || '',
            reasoning: choice?.message?.reasoning_content || null,
            usage: parsed.usage || null,
            model: parsed.model || model
          });
        } catch (e) {
          reject(new Error(`Parse error: ${data.substring(0, 200)}`));
        }
      });
    });

    request.on('error', reject);
    request.write(payload);
    request.end();
  });
}

async function handleGenerate(req, res) {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { prompt, language, model } = await getRequestBody(req);
    const selectedModel = MODELS[model] || 'MiMo-V2.5-Pro';
    const messages = [
      {
        role: 'developer',
        content: `You are MiMo CodeForge powered by Xiaomi ${selectedModel}. Generate clean, production-ready code with chain-of-thought reasoning. Include comments, error handling, and follow best practices. Output the code in a markdown code block.`
      },
      {
        role: 'user',
        content: `Generate ${language || ''} code: ${prompt}`
      }
    ];

    const result = await callMiMoAPI(messages, selectedModel);
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, type: 'generate', ...result }));
  } catch (e) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: e.message }));
  }
}

async function handleReview(req, res) {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { code, language, focus, model } = await getRequestBody(req);
    const selectedModel = MODELS[model] || 'MiMo-V2.5-Pro';
    const messages = [
      {
        role: 'developer',
        content: `You are MiMo CodeForge Code Reviewer powered by Xiaomi ${selectedModel}. Perform a thorough code review with chain-of-thought reasoning. Analyze: security vulnerabilities, performance issues, code quality, best practices, potential bugs. Provide severity ratings (critical/warning/info) and specific fix suggestions with code examples.`
      },
      {
        role: 'user',
        content: `Review this ${language || ''} code${focus ? ` (focus on: ${focus})` : ''}:\n\n\`\`\`${language || ''}\n${code}\n\`\`\``
      }
    ];

    const result = await callMiMoAPI(messages, selectedModel);
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, type: 'review', ...result }));
  } catch (e) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: e.message }));
  }
}

async function handleDebug(req, res) {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { code, error, language, model } = await getRequestBody(req);
    const selectedModel = MODELS[model] || 'MiMo-V2.5-Pro';
    const messages = [
      {
        role: 'developer',
        content: `You are MiMo CodeForge Debugger powered by Xiaomi ${selectedModel}. Analyze the code and error using chain-of-thought reasoning. Identify the root cause, explain why it happens, and provide a corrected version with detailed explanation of the fix.`
      },
      {
        role: 'user',
        content: `Debug this ${language || ''} code:\n\n\`\`\`${language || ''}\n${code}\n\`\`\`\n\nError: ${error}`
      }
    ];

    const result = await callMiMoAPI(messages, selectedModel);
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, type: 'debug', ...result }));
  } catch (e) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: e.message }));
  }
}

async function handleExplain(req, res) {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { code, language, level, model } = await getRequestBody(req);
    const selectedModel = MODELS[model] || 'MiMo-V2.5-Pro';
    const messages = [
      {
        role: 'developer',
        content: `You are MiMo CodeForge Explainer powered by Xiaomi ${selectedModel}. Explain code with chain-of-thought reasoning at ${level || 'intermediate'} level. Break down the logic step by step, explain design patterns used, time/space complexity, and provide analogies where helpful.`
      },
      {
        role: 'user',
        content: `Explain this ${language || ''} code:\n\n\`\`\`${language || ''}\n${code}\n\`\`\``
      }
    ];

    const result = await callMiMoAPI(messages, selectedModel);
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, type: 'explain', ...result }));
  } catch (e) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: e.message }));
  }
}

async function handleTestGen(req, res) {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { code, language, framework, model } = await getRequestBody(req);
    const selectedModel = MODELS[model] || 'MiMo-V2.5-Pro';
    const messages = [
      {
        role: 'developer',
        content: `You are MiMo CodeForge Test Generator powered by Xiaomi ${selectedModel}. Generate comprehensive unit tests with chain-of-thought reasoning. Cover edge cases, error scenarios, and happy paths. Use ${framework || 'the standard testing framework'} for the language.`
      },
      {
        role: 'user',
        content: `Generate unit tests for this ${language || ''} code:\n\n\`\`\`${language || ''}\n${code}\n\`\`\``
      }
    ];

    const result = await callMiMoAPI(messages, selectedModel);
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, type: 'test', ...result }));
  } catch (e) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: e.message }));
  }
}

async function handleOptimize(req, res) {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { code, language, target, model } = await getRequestBody(req);
    const selectedModel = MODELS[model] || 'MiMo-V2.5-Pro';
    const messages = [
      {
        role: 'developer',
        content: `You are MiMo CodeForge Optimizer powered by Xiaomi ${selectedModel}. Optimize code with chain-of-thought reasoning. Focus on: ${target || 'performance and readability'}. Show before/after comparison, explain trade-offs, and provide Big-O analysis where applicable.`
      },
      {
        role: 'user',
        content: `Optimize this ${language || ''} code:\n\n\`\`\`${language || ''}\n${code}\n\`\`\``
      }
    ];

    const result = await callMiMoAPI(messages, selectedModel);
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, type: 'optimize', ...result }));
  } catch (e) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: e.message }));
  }
}

server.listen(PORT, () => {
  console.log(`🔥 MiMo CodeForge v2.0 running on http://localhost:${PORT}`);
  console.log(`📡 Models: ${Object.values(MODELS).join(', ')}`);
  console.log(`🔑 API: ${MIMO_API_KEY ? 'Connected' : 'Demo mode (set MIMO_API_KEY)'}`);
});
