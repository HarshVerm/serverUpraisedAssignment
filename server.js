const jsonServer = require("json-server");
const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();

server.use(jsonServer.bodyParser);
server.use(middlewares);

server.get("/reset", (req, res) => {
  router.db.set("userResponses", []).write();
  res.sendStatus(200);
});

server.post("/submit-response", (req, res) => {
  const { quizId, selectedOptions, timeTaken } = req.body;

  const answer = router.db.get("userResponses").find({ quizId }).value();

  if (answer) {
    let userResponses = router.db.get("userResponses").value();

    userResponses = userResponses.map((answer) => {
      if (answer.quizId === quizId) {
        return { quizId, selectedOptions, timeTaken };
      }

      return answer;
    });

    router.db.set("userResponses", userResponses).write();
  } else {
    router.db
      .get("userResponses")
      .push({ quizId, selectedOptions, timeTaken })
      .write();
  }

  res.sendStatus(200);
});

server.get("/questions/:quizId", (req, res) => {
  const quizId = Number(req.params.quizId);
  const question = router.db.get("questions").find({ quizId }).value();
  if (question) {
    let newQuestion = { ...question };
    delete newQuestion["correctOption"];
    res.json({
      question: newQuestion,
      nextQuizId: quizId === 10 ? -1 : quizId + 1,
    });
  } else {
    res.json({ error: "Incorrect Id" });
  }
});

server.get("/score-report", (req, res) => {
  const userResponses = router.db.get("userResponses").value();
  const totalQuestions = router.db.get("questions").size().value();

  const totalTime = userResponses.reduce((acc, val) => acc + val.timeTaken, 0);

  const correctAnswers = userResponses.filter((res) => {
    console.log(res);
    const question = router.db
      .get("questions")
      .find({ quizId: res.quizId })
      .value();
    let correctAns = String(question.correctOption.sort());
    return correctAns === String(res.selectedOptions.sort());
  });

  const score = (correctAnswers.length / totalQuestions) * 100;
  res.json({ score: 10, score, timeTaken: totalTime });
});

server.use(router);
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
