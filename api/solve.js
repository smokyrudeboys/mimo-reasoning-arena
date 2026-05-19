const { getChallenges, getPoints } = require('./_data');

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { challengeId, userAnswer } = req.body;
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
    return res.status(404).json({ error: 'Challenge not found' });
  }

  const normalizedAnswer = String(userAnswer).toLowerCase().trim();
  const normalizedSolution = String(challenge.solution).toLowerCase().trim();
  const isCorrect = normalizedAnswer === normalizedSolution;

  res.status(200).json({
    correct: isCorrect,
    userAnswer,
    expectedAnswer: challenge.solution,
    reasoning: challenge.reasoning,
    difficulty: challenge.difficulty,
    points: isCorrect ? getPoints(challenge.difficulty) : 0
  });
};
