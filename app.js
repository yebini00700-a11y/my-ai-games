const DEFAULT_GAME = String.raw`<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Flappy Heart</title>
  <style>
    * { box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      margin: 0;
      display: grid;
      place-items: center;
      background: #10131f;
      color: #fff7ed;
      font-family: "Segoe UI", "Malgun Gothic", system-ui, sans-serif;
      overflow: hidden;
    }
    .game-wrap {
      width: min(100vw, 520px);
      padding: 16px;
      text-align: center;
    }
    h1 {
      margin: 0 0 8px;
      font-size: clamp(26px, 8vw, 42px);
      letter-spacing: 0;
    }
    .hint {
      min-height: 22px;
      margin: 0 0 12px;
      color: #bdd7ff;
      font-size: 14px;
    }
    canvas {
      width: min(100%, 420px);
      aspect-ratio: 420 / 560;
      border: 3px solid #ff5f6d;
      border-radius: 8px;
      box-shadow: 0 18px 60px rgba(0, 0, 0, 0.4), 0 0 26px rgba(255, 95, 109, 0.28);
      touch-action: none;
    }
  </style>
</head>
<body>
  <main class="game-wrap">
    <h1>Flappy Heart</h1>
    <p class="hint">클릭, 터치, 스페이스바로 점프</p>
    <canvas id="gameCanvas" width="420" height="560" aria-label="Flappy Heart 게임"></canvas>
  </main>

  <script>
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    const heart = {
      x: 84,
      y: 280,
      radius: 16,
      velocity: 0,
      gravity: 0.34,
      jump: -6.4
    };

    let pillars = [];
    let particles = [];
    let score = 0;
    let bestScore = 0;
    let frame = 0;
    let speed = 2.7;
    let started = false;
    let gameOver = false;

    function createPillar() {
      const gap = Math.max(126, 156 - Math.floor(score / 6) * 4);
      const minTop = 58;
      const maxTop = canvas.height - gap - 92;
      const top = Math.floor(Math.random() * (maxTop - minTop + 1)) + minTop;
      pillars.push({
        x: canvas.width + 18,
        width: 58,
        top,
        bottom: top + gap,
        passed: false,
        color: score % 2 === 0 ? "#36d6c6" : "#ffd166"
      });
    }

    function jump() {
      if (gameOver) {
        reset();
        return;
      }
      started = true;
      heart.velocity = heart.jump;
      burst(heart.x - 8, heart.y + 12, "#ff8fa3", 7);
    }

    function reset() {
      heart.y = 280;
      heart.velocity = 0;
      pillars = [];
      particles = [];
      score = 0;
      frame = 0;
      speed = 2.7;
      started = false;
      gameOver = false;
    }

    function burst(x, y, color, count) {
      for (let i = 0; i < count; i++) {
        particles.push({
          x,
          y,
          vx: Math.random() * -2.4 - 0.4,
          vy: Math.random() * 2 - 1,
          life: 24,
          color
        });
      }
    }

    function drawBackground() {
      const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
      sky.addColorStop(0, "#17213f");
      sky.addColorStop(0.58, "#26385b");
      sky.addColorStop(1, "#163a35");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
      for (let i = 0; i < 34; i++) {
        const x = (i * 83 + frame * 0.18) % canvas.width;
        const y = 26 + (i * 47) % 220;
        ctx.fillRect(x, y, 2, 2);
      }

      ctx.fillStyle = "#253021";
      ctx.fillRect(0, canvas.height - 34, canvas.width, 34);
      ctx.fillStyle = "#7dd87d";
      ctx.fillRect(0, canvas.height - 40, canvas.width, 7);
    }

    function drawHeart(x, y, size) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(size / 28, size / 28);
      ctx.beginPath();
      ctx.moveTo(0, 9);
      ctx.bezierCurveTo(-28, -10, -14, -31, 0, -17);
      ctx.bezierCurveTo(14, -31, 28, -10, 0, 9);
      ctx.closePath();
      ctx.fillStyle = "#ff5f6d";
      ctx.shadowColor = "rgba(255, 95, 109, 0.55)";
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.restore();
    }

    function drawPillar(pillar) {
      ctx.fillStyle = pillar.color;
      ctx.fillRect(pillar.x, 0, pillar.width, pillar.top);
      ctx.fillRect(pillar.x, pillar.bottom, pillar.width, canvas.height - pillar.bottom - 34);

      ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
      ctx.fillRect(pillar.x + pillar.width - 10, 0, 10, pillar.top);
      ctx.fillRect(pillar.x + pillar.width - 10, pillar.bottom, 10, canvas.height - pillar.bottom - 34);

      ctx.fillStyle = "#fff1a8";
      ctx.fillRect(pillar.x - 4, pillar.top - 12, pillar.width + 8, 12);
      ctx.fillRect(pillar.x - 4, pillar.bottom, pillar.width + 8, 12);
    }

    function updateParticles() {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        ctx.globalAlpha = Math.max(0, p.life / 24);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        if (p.life <= 0) particles.splice(i, 1);
      }
    }

    function updateGame() {
      if (!started || gameOver) return;

      frame++;
      heart.velocity += heart.gravity;
      heart.y += heart.velocity;

      if (frame % 86 === 0) createPillar();
      if (frame % 560 === 0) speed += 0.28;

      if (heart.y - heart.radius < 0 || heart.y + heart.radius > canvas.height - 38) {
        endGame();
      }

      for (let i = pillars.length - 1; i >= 0; i--) {
        const pillar = pillars[i];
        pillar.x -= speed;

        const hitsX = heart.x + heart.radius > pillar.x && heart.x - heart.radius < pillar.x + pillar.width;
        const hitsY = heart.y - heart.radius < pillar.top || heart.y + heart.radius > pillar.bottom;
        if (hitsX && hitsY) endGame();

        if (!pillar.passed && pillar.x + pillar.width < heart.x) {
          pillar.passed = true;
          score++;
          burst(heart.x, heart.y, "#ffd166", 10);
        }

        if (pillar.x + pillar.width < -8) pillars.splice(i, 1);
      }
    }

    function endGame() {
      if (gameOver) return;
      gameOver = true;
      bestScore = Math.max(bestScore, score);
      burst(heart.x, heart.y, "#ffffff", 18);
    }

    function drawHud() {
      ctx.fillStyle = "#fff7ed";
      ctx.font = "800 24px Segoe UI, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Score " + score, 18, 36);

      ctx.fillStyle = "rgba(255, 247, 237, 0.76)";
      ctx.font = "700 14px Segoe UI, sans-serif";
      ctx.fillText("Best " + bestScore, 20, 58);
    }

    function drawOverlay() {
      if (started && !gameOver) return;

      ctx.fillStyle = "rgba(9, 11, 20, 0.62)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.textAlign = "center";

      if (!started) {
        ctx.fillStyle = "#fff7ed";
        ctx.font = "800 24px Segoe UI, sans-serif";
        ctx.fillText("시작하려면 점프", canvas.width / 2, canvas.height / 2 - 8);
        ctx.fillStyle = "#bdd7ff";
        ctx.font = "600 15px Segoe UI, sans-serif";
        ctx.fillText("클릭, 터치, 스페이스바", canvas.width / 2, canvas.height / 2 + 24);
      }

      if (gameOver) {
        ctx.fillStyle = "#ff7a88";
        ctx.font = "900 34px Segoe UI, sans-serif";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 30);
        ctx.fillStyle = "#fff7ed";
        ctx.font = "800 19px Segoe UI, sans-serif";
        ctx.fillText("최종 점수 " + score, canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillStyle = "#bdd7ff";
        ctx.font = "600 15px Segoe UI, sans-serif";
        ctx.fillText("한 번 더 점프하면 재시작", canvas.width / 2, canvas.height / 2 + 44);
      }
    }

    function loop() {
      updateGame();
      drawBackground();
      pillars.forEach(drawPillar);
      updateParticles();
      drawHeart(heart.x, heart.y, heart.radius * 2.2);
      drawHud();
      drawOverlay();
      requestAnimationFrame(loop);
    }

    window.addEventListener("keydown", (event) => {
      if (event.code === "Space") {
        event.preventDefault();
        jump();
      }
    });
    canvas.addEventListener("pointerdown", jump);

    loop();
  </script>
</body>
</html>`;

const STORAGE_KEYS = {
  apiKey: "vanilla-game-maker-api-key",
  gameCode: "vanilla-game-maker-code"
};

const elements = {
  apiKey: document.getElementById("apiKey"),
  modelName: document.getElementById("modelName"),
  rememberKey: document.getElementById("rememberKey"),
  prompt: document.getElementById("prompt"),
  generateButton: document.getElementById("generateButton"),
  previewButton: document.getElementById("previewButton"),
  resetButton: document.getElementById("resetButton"),
  copyButton: document.getElementById("copyButton"),
  downloadButton: document.getElementById("downloadButton"),
  codeEditor: document.getElementById("codeEditor"),
  gameFrame: document.getElementById("gameFrame"),
  status: document.getElementById("status"),
  codeSize: document.getElementById("codeSize")
};

let currentCode = localStorage.getItem(STORAGE_KEYS.gameCode) || DEFAULT_GAME;

const savedKey = localStorage.getItem(STORAGE_KEYS.apiKey);
if (savedKey) {
  elements.apiKey.value = savedKey;
  elements.rememberKey.checked = true;
}

function setStatus(message, type = "") {
  elements.status.textContent = message;
  elements.status.className = `status ${type}`.trim();
}

function setBusy(isBusy) {
  elements.generateButton.disabled = isBusy;
  elements.previewButton.disabled = isBusy;
  elements.resetButton.disabled = isBusy;
  elements.copyButton.disabled = isBusy;
  elements.downloadButton.disabled = isBusy;
}

function renderGame() {
  elements.codeEditor.value = currentCode;
  elements.gameFrame.srcdoc = currentCode;
  elements.codeSize.textContent = `${Math.max(1, Math.round(new Blob([currentCode]).size / 1024))} KB`;
}

function normalizeModelName(value) {
  return value.trim().replace(/^models\//, "") || "gemini-3.5-flash";
}

function cleanModelText(text) {
  const trimmed = text.trim();
  const htmlFence = trimmed.match(/^```html\s*([\s\S]*?)\s*```$/i);
  if (htmlFence) return htmlFence[1].trim();

  const anyFence = trimmed.match(/^```\s*([\s\S]*?)\s*```$/);
  if (anyFence) return anyFence[1].trim();

  return trimmed;
}

function extractGeneratedText(data) {
  return (data.candidates || [])
    .flatMap((candidate) => candidate.content?.parts || [])
    .map((part) => part.text || "")
    .join("\n")
    .trim();
}

function buildPrompt(userRequest) {
  return [
    "너는 HTML5 Canvas 게임 개발자다.",
    "아래 현재 게임 코드를 사용자의 요청에 맞게 수정해서, 실행 가능한 완전한 HTML 문서 하나만 출력해라.",
    "마크다운 코드블록, 설명, 인사말은 출력하지 마라.",
    "외부 라이브러리와 외부 파일 없이 HTML, CSS, 바닐라 JavaScript만 사용해라.",
    "iframe sandbox에서 실행되므로 localStorage, sessionStorage, cookies, parent, top 접근은 사용하지 마라.",
    "한국어 UI 문구는 깨지지 않는 UTF-8 텍스트로 작성해라.",
    "기본 조작은 클릭, 터치, 스페이스바 중 최소 하나 이상 유지해라.",
    "",
    "[현재 게임 코드]",
    currentCode,
    "",
    "[사용자 요청]",
    userRequest
  ].join("\n");
}

async function generateGame() {
  const apiKey = elements.apiKey.value.trim();
  const userRequest = elements.prompt.value.trim();
  const modelName = normalizeModelName(elements.modelName.value);

  if (!apiKey) {
    setStatus("키 필요", "error");
    elements.apiKey.focus();
    return;
  }

  if (!userRequest) {
    setStatus("요청 필요", "error");
    elements.prompt.focus();
    return;
  }

  if (elements.rememberKey.checked) {
    localStorage.setItem(STORAGE_KEYS.apiKey, apiKey);
  } else {
    localStorage.removeItem(STORAGE_KEYS.apiKey);
  }

  setBusy(true);
  setStatus("생성 중", "busy");

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: buildPrompt(userRequest)
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "text/plain"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = cleanModelText(extractGeneratedText(data));

    if (!generatedText || !generatedText.toLowerCase().includes("<html")) {
      throw new Error("모델 응답에서 완전한 HTML 문서를 찾지 못했습니다.");
    }

    currentCode = generatedText;
    localStorage.setItem(STORAGE_KEYS.gameCode, currentCode);
    renderGame();
    setStatus("반영 완료", "ok");
  } catch (error) {
    console.error(error);
    setStatus("실패", "error");
    alert("생성에 실패했습니다.\n\n" + error.message);
  } finally {
    setBusy(false);
  }
}

function refreshFromEditor() {
  currentCode = elements.codeEditor.value;
  localStorage.setItem(STORAGE_KEYS.gameCode, currentCode);
  renderGame();
  setStatus("새로고침", "ok");
}

async function copyCode() {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(elements.codeEditor.value);
  } else {
    elements.codeEditor.focus();
    elements.codeEditor.select();
    document.execCommand("copy");
  }
  setStatus("복사 완료", "ok");
}

function downloadCode() {
  const blob = new Blob([elements.codeEditor.value], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "ai-game.html";
  anchor.click();
  URL.revokeObjectURL(url);
  setStatus("저장 준비", "ok");
}

function resetGameCode() {
  currentCode = DEFAULT_GAME;
  localStorage.setItem(STORAGE_KEYS.gameCode, currentCode);
  renderGame();
  setStatus("초기화", "ok");
}

elements.generateButton.addEventListener("click", generateGame);
elements.previewButton.addEventListener("click", refreshFromEditor);
elements.resetButton.addEventListener("click", resetGameCode);
elements.copyButton.addEventListener("click", copyCode);
elements.downloadButton.addEventListener("click", downloadCode);
elements.rememberKey.addEventListener("change", () => {
  if (!elements.rememberKey.checked) localStorage.removeItem(STORAGE_KEYS.apiKey);
});

renderGame();
