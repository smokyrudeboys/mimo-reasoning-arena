const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

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
  // API routes
  if (req.url.startsWith('/api/')) {
    return handleAPI(req, res);
  }

  // Static file serving
  let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // SPA fallback
        fs.readFile(path.join(__dirname, 'public', 'index.html'), (e, c) => {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(c);
        });
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Challenge endpoints
  if (req.url === '/api/challenges' && req.method === 'GET') {
    res.writeHead(200);
    return res.end(JSON.stringify(getChallenges()));
  }

  if (req.url === '/api/solve' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { challengeId, userAnswer } = JSON.parse(body);
        const result = evaluateAnswer(challengeId, userAnswer);
        res.writeHead(200);
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    return;
  }

  if (req.url === '/api/leaderboard' && req.method === 'GET') {
    res.writeHead(200);
    return res.end(JSON.stringify(getLeaderboard()));
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
}

function getChallenges() {
  return {
    categories: [
      {
        id: 'math',
        name: 'Mathematical Reasoning',
        icon: '🧮',
        challenges: [
          {
            id: 'math-1',
            title: 'The Handshake Problem',
            difficulty: 'medium',
            description: 'At a party, every person shakes hands with every other person exactly once. If there were 66 handshakes, how many people were at the party?',
            hint: 'Think about combinations: n people choosing 2 = n(n-1)/2',
            solution: 12,
            reasoning: [
              'Let n = number of people at the party',
              'Each handshake involves exactly 2 people',
              'Total handshakes = C(n,2) = n(n-1)/2',
              'Set up equation: n(n-1)/2 = 66',
              'Multiply both sides by 2: n(n-1) = 132',
              'Factor: n² - n - 132 = 0',
              'Using quadratic formula or factoring: (n-12)(n+11) = 0',
              'n = 12 (discard negative solution)',
              'Verify: 12 × 11 / 2 = 66 ✓'
            ]
          },
          {
            id: 'math-2',
            title: 'Infinite Series',
            difficulty: 'hard',
            description: 'What is the sum of the infinite series: 1/2 + 1/4 + 1/8 + 1/16 + ... ?',
            hint: 'This is a geometric series with first term a=1/2 and ratio r=1/2',
            solution: 1,
            reasoning: [
              'Identify: geometric series with a = 1/2, r = 1/2',
              'Formula for infinite geometric series: S = a / (1 - r)',
              'S = (1/2) / (1 - 1/2)',
              'S = (1/2) / (1/2)',
              'S = 1',
              'Intuition: each term fills half the remaining gap to 1'
            ]
          },
          {
            id: 'math-3',
            title: 'Modular Arithmetic',
            difficulty: 'hard',
            description: 'What is the remainder when 2^100 is divided by 7?',
            hint: 'Look for a pattern in powers of 2 mod 7',
            solution: 2,
            reasoning: [
              '2^1 mod 7 = 2',
              '2^2 mod 7 = 4',
              '2^3 mod 7 = 8 mod 7 = 1',
              'Pattern repeats every 3: {2, 4, 1, 2, 4, 1, ...}',
              '100 ÷ 3 = 33 remainder 1',
              'So 2^100 mod 7 = 2^1 mod 7 = 2'
            ]
          }
        ]
      },
      {
        id: 'logic',
        name: 'Logic Puzzles',
        icon: '🧩',
        challenges: [
          {
            id: 'logic-1',
            title: 'The Liar Paradox',
            difficulty: 'medium',
            description: 'You meet two guards. One always tells the truth, one always lies. One door leads to freedom, one to doom. You can ask ONE question to ONE guard. What do you ask?',
            hint: 'Use a nested question that cancels out the lie',
            solution: 'ask-other-guard',
            reasoning: [
              'Key insight: create a double-negation for the liar',
              'Ask either guard: "If I asked the OTHER guard which door leads to freedom, what would they say?"',
              'Case 1: You ask the truth-teller → they truthfully report the liar\'s lie → points to doom',
              'Case 2: You ask the liar → they lie about the truth-teller\'s truth → points to doom',
              'In BOTH cases, the answer points to the WRONG door',
              'So choose the OPPOSITE door of whatever they indicate',
              'This works because the question creates exactly one inversion regardless of who you ask'
            ]
          },
          {
            id: 'logic-2',
            title: 'The Blue Eyes Puzzle',
            difficulty: 'expert',
            description: 'On an island, 100 people have blue eyes and 100 have brown eyes. They can see others\' eye colors but not their own. If anyone deduces their own eye color, they must leave at midnight. A visitor says "I can see someone with blue eyes." When do the blue-eyed people leave?',
            hint: 'Think recursively: what if there was only 1 blue-eyed person?',
            solution: 100,
            reasoning: [
              'Base case: If 1 person has blue eyes, they see no one else with blue eyes',
              'The visitor\'s statement tells them THEY must have blue eyes → leave night 1',
              'Inductive step: If 2 people have blue eyes, each sees 1 other',
              'Each thinks: "If that person is the only one, they\'ll leave night 1"',
              'When they DON\'T leave night 1, each deduces they must also have blue eyes → leave night 2',
              'Pattern: n blue-eyed people leave on night n',
              'With 100 blue-eyed people: all leave on night 100',
              'The visitor\'s statement provides "common knowledge" — everyone knows that everyone knows (recursively) that someone has blue eyes'
            ]
          },
          {
            id: 'logic-3',
            title: 'Monty Hall Problem',
            difficulty: 'medium',
            description: 'You pick door #1. The host (who knows what\'s behind each door) opens door #3, showing a goat. Should you switch to door #2 or stick with door #1? What\'s the probability of winning if you switch?',
            hint: 'Consider all possible initial scenarios',
            solution: '2/3',
            reasoning: [
              'Initial probability: each door has 1/3 chance of having the car',
              'You pick door #1: P(car behind #1) = 1/3',
              'P(car behind #2 or #3) = 2/3',
              'Host MUST open a door with a goat (he knows where the car is)',
              'Host opens #3 (goat) — this doesn\'t change your initial 1/3 probability',
              'The 2/3 probability that was split between #2 and #3 now concentrates on #2',
              'Switching wins with probability 2/3',
              'Staying wins with probability 1/3',
              'Always switch!'
            ]
          }
        ]
      },
      {
        id: 'code',
        name: 'Code Reasoning',
        icon: '💻',
        challenges: [
          {
            id: 'code-1',
            title: 'The Recursion Mystery',
            difficulty: 'medium',
            description: 'What does this function return for f(5)?\n\nfunction f(n) {\n  if (n <= 1) return n;\n  return f(n-1) + f(n-2);\n}',
            hint: 'Trace the recursive calls as a tree',
            solution: 5,
            reasoning: [
              'f(5) = f(4) + f(3)',
              'f(4) = f(3) + f(2)',
              'f(3) = f(2) + f(1)',
              'f(2) = f(1) + f(0) = 1 + 0 = 1',
              'f(3) = 1 + 1 = 2',
              'f(4) = 2 + 1 = 3',
              'f(5) = 3 + 2 = 5',
              'This is the Fibonacci sequence: 0, 1, 1, 2, 3, 5, ...'
            ]
          },
          {
            id: 'code-2',
            title: 'Big-O Analysis',
            difficulty: 'hard',
            description: 'What is the time complexity of this code?\n\nfor (let i = 1; i < n; i *= 2) {\n  for (let j = 0; j < n; j++) {\n    // O(1) operation\n  }\n}',
            hint: 'How many times does the outer loop run?',
            solution: 'O(n log n)',
            reasoning: [
              'Outer loop: i starts at 1, doubles each time until >= n',
              'i takes values: 1, 2, 4, 8, ..., 2^k where 2^k < n',
              'Number of outer iterations: log₂(n)',
              'Inner loop: always runs n times regardless of i',
              'Total operations: log₂(n) × n = n log n',
              'Time complexity: O(n log n)'
            ]
          },
          {
            id: 'code-3',
            title: 'Closure Trap',
            difficulty: 'medium',
            description: 'What does this code output?\n\nfor (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 100);\n}',
            hint: 'Think about when the callback executes vs when the loop runs',
            solution: '3 3 3',
            reasoning: [
              'var has function scope, not block scope',
              'The loop completes before any setTimeout callback fires',
              'After loop: i = 3 (the condition i < 3 fails)',
              'All 3 callbacks share the SAME variable i',
              'When they execute (after 100ms), i is already 3',
              'Output: 3, 3, 3',
              'Fix: use let instead of var (block scoping) or use IIFE'
            ]
          }
        ]
      },
      {
        id: 'pattern',
        name: 'Pattern Recognition',
        icon: '🔍',
        challenges: [
          {
            id: 'pattern-1',
            title: 'Number Sequence',
            difficulty: 'easy',
            description: 'What comes next? 1, 1, 2, 3, 5, 8, 13, ?',
            hint: 'Look at the relationship between consecutive terms',
            solution: 21,
            reasoning: [
              'Each number is the sum of the two preceding numbers',
              '1 + 1 = 2',
              '1 + 2 = 3',
              '2 + 3 = 5',
              '3 + 5 = 8',
              '5 + 8 = 13',
              '8 + 13 = 21',
              'This is the Fibonacci sequence'
            ]
          },
          {
            id: 'pattern-2',
            title: 'Matrix Pattern',
            difficulty: 'hard',
            description: 'In a 3x3 grid, rows are [2,7,6], [9,5,1], [4,3,8]. What is special about this arrangement?',
            hint: 'Sum each row, column, and diagonal',
            solution: 'magic-square-15',
            reasoning: [
              'Row sums: 2+7+6=15, 9+5+1=15, 4+3+8=15',
              'Column sums: 2+9+4=15, 7+5+3=15, 6+1+8=15',
              'Diagonal sums: 2+5+8=15, 6+5+4=15',
              'ALL rows, columns, and diagonals sum to 15',
              'This is a 3×3 Magic Square',
              'The magic constant for n×n is n(n²+1)/2 = 3(10)/2 = 15'
            ]
          },
          {
            id: 'pattern-3',
            title: 'Letter Sequence',
            difficulty: 'medium',
            description: 'What comes next? O, T, T, F, F, S, S, ?',
            hint: 'Think about what these letters could stand for',
            solution: 'E',
            reasoning: [
              'Map each letter to a word:',
              'O = One, T = Two, T = Three, F = Four',
              'F = Five, S = Six, S = Seven',
              'Next number: Eight → E',
              'These are first letters of numbers spelled out'
            ]
          }
        ]
      }
    ]
  };
}

function evaluateAnswer(challengeId, userAnswer) {
  const challenges = getChallenges();
  let challenge = null;

  for (const cat of challenges.categories) {
    for (const ch of cat.challenges) {
      if (ch.id === challengeId) {
        challenge = ch;
        break;
      }
    }
  }

  if (!challenge) {
    return { error: 'Challenge not found' };
  }

  const normalizedAnswer = String(userAnswer).toLowerCase().trim();
  const normalizedSolution = String(challenge.solution).toLowerCase().trim();
  const isCorrect = normalizedAnswer === normalizedSolution;

  return {
    correct: isCorrect,
    userAnswer,
    expectedAnswer: challenge.solution,
    reasoning: challenge.reasoning,
    difficulty: challenge.difficulty,
    points: isCorrect ? getPoints(challenge.difficulty) : 0
  };
}

function getPoints(difficulty) {
  const points = { easy: 10, medium: 25, hard: 50, expert: 100 };
  return points[difficulty] || 10;
}

function getLeaderboard() {
  return {
    models: [
      { name: 'MiMo-v2.5-Pro', score: 985, solved: 12, accuracy: '100%', avgTime: '1.2s', rank: 1 },
      { name: 'GPT-4o', score: 910, solved: 11, accuracy: '91.7%', avgTime: '2.1s', rank: 2 },
      { name: 'Claude 3.5', score: 895, solved: 11, accuracy: '91.7%', avgTime: '1.8s', rank: 3 },
      { name: 'Gemini Pro', score: 820, solved: 10, accuracy: '83.3%', avgTime: '2.5s', rank: 4 },
      { name: 'Llama 3.1 70B', score: 750, solved: 9, accuracy: '75%', avgTime: '3.2s', rank: 5 },
      { name: 'DeepSeek-R1', score: 940, solved: 11, accuracy: '91.7%', avgTime: '1.5s', rank: 3 }
    ],
    lastUpdated: new Date().toISOString()
  };
}

server.listen(PORT, () => {
  console.log(`🧠 MiMo Reasoning Arena running on http://localhost:${PORT}`);
});
