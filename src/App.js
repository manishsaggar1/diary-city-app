import React, { useEffect, useState } from 'react';
import './App.css';

function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

const MAX_QUESTIONS = 10;
const POINTS = {
  Easy: 10,
  Medium: 25,
  Difficult: 50
};

function App() {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(null);
  const [choices, setChoices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [points, setPoints] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [sessionOver, setSessionOver] = useState(false);
  const [difficulty, setDifficulty] = useState('Easy');
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(true);
  const [showPasswordScreen, setShowPasswordScreen] = useState(true);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [hallOfFame, setHallOfFame] = useState(() => {
    const saved = localStorage.getItem('hallOfFame');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    fetch(process.env.PUBLIC_URL + '/questions.json')
      .then(res => res.json())
      .then(data => setQuestions(data));
  }, []);

  useEffect(() => {
    if (questions.length > 0) {
      pickRandomQuestion('init');
    }
    // eslint-disable-next-line
  }, [questions]);

  function pickRandomQuestion(mode = 'next') {
    setShowAnswer(false);
    setSelected(null);
    if (mode !== 'init') {
      setQuestionCount(qc => qc + 1);
    }
    // Adaptive difficulty: increase after 3 and 6 correct answers
    let nextDifficulty = difficulty;
    if (points >= 150) nextDifficulty = 'Difficult';
    else if (points >= 50) nextDifficulty = 'Medium';
    else nextDifficulty = 'Easy';
    setDifficulty(nextDifficulty);
    // Filter questions by difficulty
    let filtered = questions.filter(q => (q.Level || '').toLowerCase().includes(nextDifficulty.toLowerCase()));
    if (filtered.length === 0) filtered = questions; // fallback
    const idx = Math.floor(Math.random() * filtered.length);
    const q = filtered[idx];
    setCurrent(q);
    // T or F : logic
    if (q.Question && q.Question.trim().toLowerCase().startsWith('t or f :')) {
      setChoices(['True', 'False']);
    } else {
      // Pick 3 random incorrect answers
      const incorrect = shuffle(questions.filter(x => x.Answer !== q.Answer)).slice(0, 3).map(x => x.Answer);
      const allChoices = shuffle([q.Answer, ...incorrect]);
      setChoices(allChoices);
    }
  }

  function handleChoice(choice) {
    setSelected(choice);
    setShowAnswer(true);
    // Determine correct answer for T or F
    const isTF = current.Question && current.Question.trim().toLowerCase().startsWith('t or f :');
    let correctAnswer = current.Answer;
    if (isTF) {
      if (typeof correctAnswer === 'string') {
        correctAnswer = correctAnswer.trim().toLowerCase() === 'true' ? 'True' : 'False';
      }
    }
    if (choice === correctAnswer) {
      setPoints(p => p + POINTS[difficulty]);
    }
  }

  function handleNext() {
    if (questionCount + 1 >= MAX_QUESTIONS) {
      setSessionOver(true);
      // Update hall of fame
      const newScore = { name: playerName, score: points, date: new Date().toLocaleDateString() };
      const updatedHallOfFame = [...hallOfFame, newScore]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      setHallOfFame(updatedHallOfFame);
      localStorage.setItem('hallOfFame', JSON.stringify(updatedHallOfFame));
    } else {
      pickRandomQuestion();
    }
  }

  function handleRestart() {
    setPoints(0);
    setQuestionCount(0);
    setSessionOver(false);
    setShowNameInput(true);
    pickRandomQuestion('init');
  }

  function handlePasswordSubmit(e) {
    e.preventDefault();
    const correctPassword = process.env.REACT_APP_PASSWORD || 'default123';
    if (password === correctPassword) {
      setShowPasswordScreen(false);
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password. Please try again.');
      setPassword('');
    }
  }

  function handleNameSubmit(e) {
    e.preventDefault();
    if (playerName.trim()) {
      setShowNameInput(false);
    }
  }

  if (showPasswordScreen) {
    return (
      <div className="App" style={{ minHeight: '100vh', background: '#f0f4ff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="flashcard">
          <img src={process.env.PUBLIC_URL + '/logo.png'} alt="Logo" className="flashcard-logo" style={{ width: 160, height: 100, marginBottom: 16 }} />
          <h2 className="flashcard-question">Enter Password</h2>
          <form onSubmit={handlePasswordSubmit} style={{ width: '100%' }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '1.2rem',
                borderRadius: '12px',
                border: '2px solid #ccc',
                marginBottom: '16px'
              }}
            />
            {passwordError && (
              <p style={{ color: '#e74c3c', marginBottom: '16px', fontSize: '1rem' }}>
                {passwordError}
              </p>
            )}
            <button type="submit" className="next-btn">Enter</button>
          </form>
        </div>
      </div>
    );
  }

  if (showNameInput) {
    return (
      <div className="App" style={{ minHeight: '100vh', background: '#f0f4ff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="flashcard">
          <img src={process.env.PUBLIC_URL + '/logo.png'} alt="Logo" className="flashcard-logo" style={{ width: 160, height: 100, marginBottom: 16 }} />
          <h2 className="flashcard-question">Enter Your Name</h2>
          <form onSubmit={handleNameSubmit} style={{ width: '100%' }}>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your name"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '1.2rem',
                borderRadius: '12px',
                border: '2px solid #ccc',
                marginBottom: '16px'
              }}
            />
            <button type="submit" className="next-btn">Start Game</button>
          </form>
        </div>
      </div>
    );
  }

  if (!current) return <div className="App">Loading...</div>;

  // Determine correct answer for T or F
  const isTF = current.Question && current.Question.trim().toLowerCase().startsWith('t or f :');
  let correctAnswer = current.Answer;
  if (isTF) {
    if (typeof correctAnswer === 'string') {
      correctAnswer = correctAnswer.trim().toLowerCase() === 'true' ? 'True' : 'False';
    }
  }

  if (sessionOver) {
    return (
      <div className="App" style={{ minHeight: '100vh', background: '#f0f4ff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="flashcard">
          <img src={process.env.PUBLIC_URL + '/logo.png'} alt="Logo" className="flashcard-logo" style={{ width: 160, height: 100, marginBottom: 16 }} />
          <h2 className="flashcard-question">Session Complete!</h2>
          <p style={{ fontSize: '1.3rem', margin: '18px 0 8px 0' }}>Your Score: {points} points</p>
          
          <div style={{ width: '100%', marginTop: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Hall of Fame</h3>
            {hallOfFame.map((score, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px',
                background: index === 0 ? '#ffd700' : '#fff',
                borderRadius: '8px',
                marginBottom: '8px',
                border: '1px solid #eee'
              }}>
                <span>{score.name}</span>
                <span>{score.score} points</span>
                <span>{score.date}</span>
              </div>
            ))}
          </div>
          
          <button className="next-btn" onClick={handleRestart} style={{ marginTop: '24px' }}>Play Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="App" style={{ minHeight: '100vh', background: '#f0f4ff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="points-container">
        <div className="points">
          <div className="points-label">Points: {points}</div>
        </div>
      </div>
      <div className="flashcard">
        <img src={process.env.PUBLIC_URL + '/logo.png'} alt="Logo" className="flashcard-logo" style={{ width: 160, height: 100, marginBottom: 16 }} />
        <h2 className="flashcard-question">{current.Question}</h2>
        <div className="choices">
          {choices.map((choice, idx) => (
            <button
              key={idx}
              className="choice-btn"
              onClick={() => handleChoice(choice)}
              disabled={showAnswer}
              title={choice.length > 100 ? choice : ''}
              style={{
                background: showAnswer
                  ? choice === correctAnswer
                    ? '#b2f2a5'
                    : choice === selected
                    ? '#f2b2b2'
                    : '#fff'
                  : '#fff',
                border: showAnswer && choice === correctAnswer ? '2px solid #2ecc40' : '2px solid #ccc',
                color: '#222',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                margin: '12px 0',
                width: '100%',
                minHeight: '60px',
                maxHeight: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'normal',
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                padding: '16px',
                transition: 'all 0.2s',
                cursor: showAnswer ? 'default' : 'pointer',
              }}
            >
              {choice.length > 180 && !showAnswer
                ? choice.slice(0, 180) + '...'
                : choice}
            </button>
          ))}
        </div>
        {showAnswer && (
          <div className="answer-section">
            <p style={{ fontSize: '1.3rem', margin: '18px 0 8px 0' }}><strong>Answer:</strong> {current.Answer}</p>
            {current.Source && <p><strong>Source:</strong> {current.Source}</p>}
            {current.Category && <p><strong>Category:</strong> {current.Category}</p>}
            {current.Level && <p><strong>Level:</strong> {current.Level}</p>}
            <button className="next-btn" onClick={handleNext}>Next Question</button>
          </div>
        )}
        <div style={{ marginTop: 16, fontSize: '1rem', color: '#888' }}>Question {questionCount + 1} / {MAX_QUESTIONS} | Difficulty: {difficulty} | Points: {POINTS[difficulty]}</div>
      </div>
    </div>
  );
}

export default App;
