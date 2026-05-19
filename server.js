const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PORT = process.env.PORT || 3000;
const MIMO_API_KEY = process.env.MIMO_API_KEY || '';
const MIMO_BASE_URL = 'https://api.xiaomimimo.com/v1/chat/completions';

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
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.url === '/api/generate' && req.method === 'POST') {
    return handleGenerate(req, res);
  }
  if (req.url === '/api/review' && req.method === 'POST') {
    return handleReview(req, res);
  }
  if (req.url === '/api/debug' && req.method === 'POST') {
    return handleDebug(req, res);
  }
  if (req.url === '/api/explain' && req.method === 'POST') {
    return handleExplain(req, res);
  }
  if (req.url === '/api/health' && req.method === 'GET') {
    res.writeHead(200);
    return res.end(JSON.stringify({ status: 'ok', model: 'MiMo-V2.5-Pro', apiConfigured: !!MIMO_API_KEY }));
  }

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
  });
}

async function callMiMoAPI(messages, model = 'MiMo-V2.5-Pro') {
  const apiKey = MIMO_API_KEY;
  if (!apiKey) {
    return { error: false, content: generateMockResponse(messages) };
  }

  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: model,
      messages: messages,
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
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.choices && parsed.choices[0]) {
            resolve({
              content: parsed.choices[0].message.content,
              reasoning: parsed.choices[0].message.reasoning_content || null,
              usage: parsed.usage || null,
              model: parsed.model || model
            });
          } else {
            resolve({ content: data, error: true });
          }
        } catch (e) {
          resolve({ content: data, error: true });
        }
      });
    });

    request.on('error', (e) => resolve({ content: e.message, error: true }));
    request.write(payload);
    request.end();
  });
}

function generateMockResponse(messages) {
  const lastMsg = messages[messages.length - 1].content;
  return `[MiMo-V2.5-Pro Demo Response]\n\nThis is a demonstration response. To enable live MiMo API calls, set the MIMO_API_KEY environment variable.\n\nYour request: "${lastMsg.substring(0, 100)}..."\n\nIn production, MiMo-V2.5-Pro would provide:\n- Chain-of-thought reasoning\n- Step-by-step code analysis\n- Detailed explanations with examples`;
}

async function handleGenerate(req, res) {
  try {
    const { prompt, language, context } = await getRequestBody(req);
    const messages = [
      {
        role: 'developer',
        content: `You are MiMo CodeForge, an expert code generation assistant powered by Xiaomi MiMo-V2.5-Pro. Generate clean, well-documented, production-ready code. Always include comments explaining your reasoning. Language: ${language || 'auto-detect'}.`
      },
      {
        role: 'user',
        content: context ? `Context:\n${context}\n\nRequest: ${prompt}` : prompt
      }
    ];

    const result = await callMiMoAPI(messages);
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      type: 'generate',
      result: result.content,
      reasoning: result.reasoning,
      usage: result.usage,
      model: result.model || 'MiMo-V2.5-Pro'
    }));
  } catch (e) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: e.message }));
  }
}

async function handleReview(req, res) {
  try {
    const { code, language, focus } = await getRequestBody(req);
    const messages = [
      {
        role: 'developer',
        content: `You are MiMo CodeForge Code Reviewer powered by Xiaomi MiMo-V2.5-Pro. Perform a thorough code review with chain-of-thought reasoning. Analyze: security vulnerabilities, performance issues, code quality, best practices, potential bugs. Provide severity ratings (critical/warning/info) and specific fix suggestions with code examples.`
      },
      {
        role: 'user',
        content: `Review this ${language || ''} code${focus ? ` (focus on: ${focus})` : ''}:\n\n\`\`\`${language || ''}\n${code}\n\`\`\``
      }
    ];

    const result = await callMiMoAPI(messages);
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      type: 'review',
      result: result.content,
      reasoning: result.reasoning,
      usage: result.usage,
      model: result.model || 'MiMo-V2.5-Pro'
    }));
  } catch (e) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: e.message }));
  }
}

async function handleDebug(req, res) {
  try {
    const { code, error, language } = await getRequestBody(req);
    const messages = [
      {
        role: 'developer',
        content: `You are MiMo CodeForge Debugger powered by Xiaomi MiMo-V2.5-Pro. Analyze the code and error using chain-of-thought reasoning. Identify the root cause, explain why it happens, and provide a corrected version with detailed explanation of the fix.`
      },
      {
        role: 'user',
        content: `Debug this ${language || ''} code:\n\n\`\`\`${language || ''}\n${code}\n\`\`\`\n\nError: ${error}`
      }
    ];

    const result = await callMiMoAPI(messages);
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      type: 'debug',
      result: result.content,
      reasoning: result.reasoning,
      usage: result.usage,
      model: result.model || 'MiMo-V2.5-Pro'
    }));
  } catch (e) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: e.message }));
  }
}

async function handleExplain(req, res) {
  try {
    const { code, language, level } = await getRequestBody(req);
    const messages = [
      {
        role: 'developer',
        content: `You are MiMo CodeForge Explainer powered by Xiaomi MiMo-V2.5-Pro. Explain code with chain-of-thought reasoning at ${level || 'intermediate'} level. Break down the logic step by step, explain design patterns used, time/space complexity, and provide analogies where helpful.`
      },
      {
        role: 'user',
        content: `Explain this ${language || ''} code:\n\n\`\`\`${language || ''}\n${code}\n\`\`\``
      }
    ];

    const result = await callMiMoAPI(messages);
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      type: 'explain',
      result: result.content,
      reasoning: result.reasoning,
      usage: result.usage,
      model: result.model || 'MiMo-V2.5-Pro'
    }));
  } catch (e) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: e.message }));
  }
}

server.listen(PORT, () => {
  console.log(`🔥 MiMo CodeForge running on http://localhost:${PORT}`);
  console.log(`📡 MiMo API: ${MIMO_API_KEY ? 'Connected' : 'Demo mode (set MIMO_API_KEY)'}`);
});
