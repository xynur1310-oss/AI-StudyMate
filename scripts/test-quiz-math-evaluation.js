// Automated Test Suite for AI StudyMate Quiz, Math Equivalence, and Question Verification Engine
import http from 'http';

function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('=== MEMULAI TEST SUITE EVALUASI KUIS DAN MATEMATIKA ===\n');
  let passedCount = 0;
  let totalTests = 0;

  function assert(condition, testName) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
    }
  }

  // 1. Soal matematika fungsi komposisi (Test Kasus Utama User)
  // f(x) = x + 2, (g o f)(x) = 2x^2 + 4x - 3 -> g(x) = 2x^2 - 4x - 3
  const mathQuestion = {
    id: 'q_math_comp',
    type: 'multiple_choice',
    question: 'Diketahui f(x) = x + 2 dan (g o f)(x) = 2x^2 + 4x - 3. Tentukan fungsi g(x)!',
    options: ['2x^2 - 4x - 3', '2x^2 - 7', '2x^2 + 1', '2x^2 - 4x + 3'],
    correctAnswer: '2x^2 - 4x - 3',
    correctOptionId: 'A',
    explanation: 'Misalkan t = x + 2, maka x = t - 2. g(t) = 2(t - 2)^2 + 4(t - 2) - 3 = 2t^2 - 4t - 3. Maka g(x) = 2x^2 - 4x - 3.',
  };

  // Test 1: Pilihan benar (A: 2x^2 - 4x - 3)
  {
    const res = await makeRequest('/api/evaluate-quiz', {
      userAnswers: { q_math_comp: '2x^2 - 4x - 3' },
      clientQuestionsFallback: [mathQuestion],
    });
    assert(res.data.score === 100 && res.data.correctCount === 1, '1. Matematika komposisi: Jawaban benar (2x^2 - 4x - 3) dinilai BENAR (100)');
  }

  // Test 2: Pilihan salah (2x^2 - 7) TIDAK BOLEH DINILAI BENAR
  {
    const res = await makeRequest('/api/evaluate-quiz', {
      userAnswers: { q_math_comp: '2x^2 - 7' },
      clientQuestionsFallback: [mathQuestion],
    });
    assert(res.data.score === 0 && res.data.correctCount === 0 && res.data.evaluatedQuestions[0].isCorrect === false, '2. Matematika komposisi: Jawaban salah (2x^2 - 7) TIDAK BOLEH BENAR');
  }

  // Test 3: Pilihan salah (2x^2 + 1) TIDAK BOLEH DINILAI BENAR
  {
    const res = await makeRequest('/api/evaluate-quiz', {
      userAnswers: { q_math_comp: '2x^2 + 1' },
      clientQuestionsFallback: [mathQuestion],
    });
    assert(res.data.score === 0 && res.data.correctCount === 0, '3. Matematika komposisi: Jawaban salah (2x^2 + 1) TIDAK BOLEH BENAR');
  }

  // Test 4: Single question check practice mode
  {
    const resWrong = await makeRequest('/api/check-single-question', {
      questionId: 'q_math_comp',
      userAnswer: '2x^2 - 7',
      clientQuestionsFallback: [mathQuestion],
    });
    assert(resWrong.data.isCorrect === false && resWrong.data.correctAnswer === '2x^2 - 4x - 3', '4. Mode latihan check-single-question: Jawaban salah dievaluasi isCorrect: false');

    const resRight = await makeRequest('/api/check-single-question', {
      questionId: 'q_math_comp',
      userAnswer: '2x^2 - 4x - 3',
      clientQuestionsFallback: [mathQuestion],
    });
    assert(resRight.data.isCorrect === true && resRight.data.correctAnswer === '2x^2 - 4x - 3', '5. Mode latihan check-single-question: Jawaban tepat dievaluasi isCorrect: true');
  }

  // Test 5: True / False Evaluation
  const tfQuestion = {
    id: 'q_tf_1',
    type: 'true_false',
    question: 'Fungsi komposisi (f o g)(x) selalu sama dengan (g o f)(x).',
    options: ['Benar', 'Salah'],
    correctAnswer: 'Salah',
    explanation: 'Komposisi fungsi secara umum tidak bersifat komutatif.',
  };

  {
    const resFalseCorrect = await makeRequest('/api/evaluate-quiz', {
      userAnswers: { q_tf_1: 'Salah' },
      clientQuestionsFallback: [tfQuestion],
    });
    assert(resFalseCorrect.data.score === 100 && resFalseCorrect.data.evaluatedQuestions[0].isCorrect === true, '6. True/False: Menjawab "Salah" pada pernyataan salah dinilai BENAR');

    const resFalseWrong = await makeRequest('/api/evaluate-quiz', {
      userAnswers: { q_tf_1: 'Benar' },
      clientQuestionsFallback: [tfQuestion],
    });
    assert(resFalseWrong.data.score === 0 && resFalseWrong.data.evaluatedQuestions[0].isCorrect === false, '7. True/False: Menjawab "Benar" pada pernyataan salah dinilai SALAH');
  }

  // Test 6: Short answer normalization & math equivalence
  const saQuestion = {
    id: 'q_sa_1',
    type: 'short_answer',
    question: 'Jika f(x) = 3x + 6, tentukan invers dari fungsi f(x)!',
    correctAnswer: '(x - 6)/3',
    acceptedAnswers: ['(x-6)/3', 'x/3 - 2', '(1/3)x - 2', '1/3x - 2'],
    explanation: 'y = 3x + 6 <=> 3x = y - 6 <=> x = (y - 6)/3. Maka f^(-1)(x) = (x - 6)/3.',
  };

  {
    const resExact = await makeRequest('/api/evaluate-quiz', {
      userAnswers: { q_sa_1: '(x - 6)/3' },
      clientQuestionsFallback: [saQuestion],
    });
    assert(resExact.data.evaluatedQuestions[0].isCorrect === true, '8. Short answer: Format exact (x - 6)/3 dinilai BENAR');

    const resEquiv = await makeRequest('/api/evaluate-quiz', {
      userAnswers: { q_sa_1: 'x/3 - 2' },
      clientQuestionsFallback: [saQuestion],
    });
    assert(resEquiv.data.evaluatedQuestions[0].isCorrect === true, '9. Short answer: Format ekuivalen x/3 - 2 dinilai BENAR');

    const resWrong = await makeRequest('/api/evaluate-quiz', {
      userAnswers: { q_sa_1: 'x/3 + 2' },
      clientQuestionsFallback: [saQuestion],
    });
    assert(resWrong.data.evaluatedQuestions[0].isCorrect === false, '10. Short answer: Jawaban salah x/3 + 2 dinilai SALAH');
  }

  console.log(`\n=== HASIL: ${passedCount}/${totalTests} TESTS BERHASIL DENGAN SEMPURNA ===`);
}

runTests().catch(console.error);
