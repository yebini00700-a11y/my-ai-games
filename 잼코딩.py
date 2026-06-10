import streamlit as st
from google import genai
import re

# 1. 페이지 설정 및 API 키 인증
st.set_page_config(layout="wide", page_title="AI 동아리 게임 메이커")
st.title("🤖 AI와 함께 만드는 실시간 게임 업그레이드")

# 구글 Gemini API 키 설정 (본인의 API 키를 입력하세요)
GOOGLE_API_KEY = st.secrets["AIzaSyBn8GkD-t2ouWGjy4QXvD2CvFLY3bRPdM0" ]

# 2. 세션 상태 초기화 (새로운 '플래피 하트' 게임 소스코드)
if "game_code" not in st.session_state:
    st.session_state.game_code = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Flappy Heart</title>
        <style>
            body { margin: 0; text-align: center; background: #111; color: white; font-family: sans-serif; overflow: hidden; }
            canvas { background: #222; border: 3px solid #ff4d4d; display: block; margin: 10px auto; max-width: 100%; box-shadow: 0 0 15px rgba(255, 77, 77, 0.5); }
            #info { font-size: 14px; color: #aaa; margin-bottom: 5px; }
        </style>
    </head>
    <body>
        <h1>💖 플래피 하트 (Flappy Heart) v1.0</h1>
        <div id="info">마우스 클릭, 화면 터치, 또는 스페이스바를 누르면 하트가 점프합니다!</div>
        <canvas id="gameCanvas" width="400" height="500"></canvas>
        <script>
            const canvas = document.getElementById('gameCanvas');
            const ctx = canvas.getContext('2d');

            // 게임 물리 및 상태 변수
            let heart = { x: 80, y: 250, size: 15, velocity: 0, gravity: 0.35, jump: -6 };
            let pillars = [];
            let score = 0;
            let gameOver = false;
            let gameStarted = false;
            let frame = 0;
            let gameSpeed = 2.5;

            // 기둥(장애물) 생성 함수
            function createPillar() {
                let gap = 130; // 기둥 사이 빈 공간 사이즈
                let minHeight = 40;
                let maxHeight = canvas.height - gap - minHeight;
                let topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
                pillars.push({
                    x: canvas.width,
                    top: topHeight,
                    bottom: topHeight + gap,
                    width: 55,
                    passed: false
                });
            }

            // 조작 이벤트 처리
            function jumpAction() {
                if (gameOver) {
                    resetGame();
                    return;
                }
                if (!gameStarted) gameStarted = true;
                heart.velocity = heart.jump;
            }
            
            window.addEventListener('keydown', (e) => { if (e.code === 'Space') jumpAction(); });
            canvas.addEventListener('touchstart', (e) => { e.preventDefault(); jumpAction(); });
            canvas.addEventListener('mousedown', jumpAction);

            function resetGame() {
                heart.y = 250;
                heart.velocity = 0;
                pillars = [];
                score = 0;
                gameSpeed = 2.5;
                gameOver = false;
                gameStarted = false;
                frame = 0;
            }

            // 메인 게임 루프
            function loop() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                if (gameStarted && !gameOver) {
                    frame++;
                    
                    // 중력 및 가속도 적용
                    heart.velocity += heart.gravity;
                    heart.y += heart.velocity;

                    // 천장이나 바닥에 닿으면 사망
                    if (heart.y + heart.size > canvas.height || heart.y - heart.size < 0) {
                        gameOver = true;
                    }

                    // 주기적으로 기둥 생성
                    if (frame % 90 === 0) {
                        createPillar();
                    }

                    // 시간이 지날수록 점진적으로 속도 증가 (난이도 상승)
                    if (frame % 600 === 0) {
                        gameSpeed += 0.4;
                    }
                }

                // 기둥 업데이트 및 충돌 검사
                for (let i = pillars.length - 1; i >= 0; i--) {
                    if (gameStarted && !gameOver) {
                        pillars[i].x -= gameSpeed;
                    }

                    // 기둥 그리기 (네온 스타일 그린)
                    ctx.fillStyle = '#00ffcc';
                    // 위쪽 기둥
                    ctx.fillRect(pillars[i].x, 0, pillars[i].width, pillars[i].top);
                    // 아래쪽 기둥
                    ctx.fillRect(pillars[i].x, pillars[i].bottom, pillars[i].width, canvas.height - pillars[i].bottom);

                    // 히트박스 충돌 체크
                    if (
                        heart.x + heart.size > pillars[i].x &&
                        heart.x - heart.size < pillars[i].x + pillars[i].width
                    ) {
                        if (heart.y - heart.size < pillars[i].top || heart.y + heart.size > pillars[i].bottom) {
                            gameOver = true;
                        }
                    }

                    // 점수 계산 (기둥을 완전히 통과했을 때)
                    if (!pillars[i].passed && pillars[i].x + pillars[i].width < heart.x) {
                        pillars[i].passed = true;
                        score++;
                    }

                    // 화면 밖으로 사라진 기둥 메모리 삭제
                    if (pillars[i].x + pillars[i].width < 0) {
                        pillars.splice(i, 1);
                    }
                }

                // 하트 플레이어 그리기 (이모지 렌더링)
                ctx.fillStyle = '#ff4d4d';
                ctx.font = '28px Arial';
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'center';
                ctx.fillText('❤️', heart.x, heart.y);

                // 스코어 보드
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 22px sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Score: ' + score, 20, 40);

                // 대기 화면 대화상자
                if (!gameStarted && !gameOver) {
                    ctx.fillStyle = 'rgba(0,0,0,0.6)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#fff';
                    ctx.font = '20px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('클릭하거나 터치해서 시작', canvas.width / 2, canvas.height / 2);
                }

                // 게임 오버 화면
                if (gameOver) {
                    ctx.fillStyle = 'rgba(0,0,0,0.75)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#ff4d4d';
                    ctx.font = 'bold 32px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);
                    ctx.fillStyle = '#fff';
                    ctx.font = '20px sans-serif';
                    ctx.fillText('최종 스코어: ' + score, canvas.width / 2, canvas.height / 2 + 15);
                    ctx.fillStyle = '#aaa';
                    ctx.font = '16px sans-serif';
                    ctx.fillText('다시 하려면 화면을 클릭하세요', canvas.width / 2, canvas.height / 2 + 60);
                }

                requestAnimationFrame(loop);
            }
            loop();
        </script>
    </body>
    </html>
    """

# 3. 화면 레이아웃 분할 (좌측: AI 채팅 및 명령 / 우측: 게임 화면)
col1, col2 = st.columns([1, 1.2])

with col1:
    st.subheader("💬 AI 개발자에게 게임 업그레이드 시키기")
    st.write("현재 구동 중인 플래피 하트 게임을 원하는 대로 바꿔보세요!")
    
    user_prompt = st.text_area(
        "어떤 기능을 추가하거나 바꾸고 싶나요?", 
        placeholder="예시:\n- 배경을 네온 가득한 사이버펑크 도시로 바꿔줘.\n- 10점 넘으면 기둥 색이 빨갛게 변하고 속도가 2배 빨라지게 해줘.\n- 하트 말고 귀여운 노란색 새(🐤) 아이콘으로 변경해줘.",
        height=180
    )
    
    if st.button("🚀 게임에 즉시 반영하기"):
        if not user_prompt:
            st.warning("명령어를 입력해주세요!")
        elif GOOGLE_API_KEY == "YOUR_GEMINI_API_KEY_HERE":
            st.error("기장님! 코드 상단의 GOOGLE_API_KEY 변수에 실제 API 키를 입력하셔야 작동합니다!")
        else:
            with st.spinner("AI가 열심히 코드를 수정하고 있습니다... 잠시만 기다려주세요!"):
                try:
                    client = genai.Client(api_key=GOOGLE_API_KEY)
                    
                    full_prompt = f"""
                    너는 최고의 HTML5 게임 개발자야. 사용자가 제공한 현재 게임 코드(HTML/CSS/JS Canvas)를 분석하고, 사용자의 추가 요구사항을 완벽하게 반영한 하나의 정제된 HTML 코드만 새로 작성해줘.
                    
                    [현재 게임 코드]
                    {st.session_state.game_code}
                    
                    [사용자 요구사항]
                    {user_prompt}
                    
                    주의사항 및 규칙:
                    1. 다른 코드 설명이나 인사말, 주석은 절대 포함하지 말고 오직 순수한 HTML 코드만 출력해라.
                    2. 마크다운 언어 기호(```html 이나 ```)도 절대 쓰지 말고 문자열 그대로 코드만 출력해라.
                    3. 게임의 기본 틀(플래피 버드 방식의 점프와 장애물 메커니즘, 캔버스 크기 등)을 깨뜨리지 않는 선에서 사용자의 요구를 창의적이고 버그 없이 구현해라.
                    """
                    
                    response = client.models.generate_content(
                        model='gemini-2.5-flash',
                        contents=full_prompt,
                    )
                    new_code = response.text
                    
                    # 마크다운 방어 코드
                    if "```html" in new_code:
                        new_code = re.search(r"```html(.*?)```", new_code, re.DOTALL).group(1)
                    elif "```" in new_code:
                        new_code = re.search(r"```(.*?)```", new_code, re.DOTALL).group(1)
                        
                    st.session_state.game_code = new_code
                    st.success("✨ 게임 업그레이드 완료! 우측에서 확인해보세요.")
                    
                except Exception as e:
                    st.error(f"에러가 발생했습니다: {e}")

with col2:
    st.subheader("🎮 실시간 업데이트된 게임 플레이")
    # HTML 코드를 iframe 형태로 실시간 렌더링
    st.components.v1.html(st.session_state.game_code, height=650, scrolling=True)
