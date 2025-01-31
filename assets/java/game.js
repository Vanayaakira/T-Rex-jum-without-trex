const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');


let score = 0;
let baseGameSpeed = 6;
let gameSpeed = baseGameSpeed;
let gravity = 0.5;
let isJumping = false;
let gameOver = false;
let isTransitioning = false;
let currentTheme = 'space';
let gameStarted = false;
let obstacleTimer = 0;


const themes = {
    space: {
        background: '#1a1a2e',
        playerColor: '#4a90e2',
        groundColor: '#4a90e2',
        obstacleColor: '#4a90e2',
        triangleColor: '#e74c3c',
        textColor: '#4a90e2'
    },
    earth: {
        background: '#87CEEB',
        playerColor: '#FFD700',
        groundColor: '#8B4513',
        obstacleColor: '#228B22',
        triangleColor: '#CD853F',
        textColor: '#000000'
    }
};


const player = {
    x: 50,
    y: 150,
    radius: 15,
    velocityY: 0,
    jumpForce: -10,
    color: themes.space.playerColor
};


const particles = Array.from({length: 50}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 2,
    speed: Math.random() * 2 + 1,
    color: '#ffffff'
}));


const OBSTACLE_TYPES = {
    RECTANGLE: 'rectangle',
    LOW_TRIANGLE: 'lowTriangle'
};


const obstacles = [];

function updateGameSpeed() {
    gameSpeed = baseGameSpeed + Math.floor(score / 10) * 2;
}

function showGameOver() {
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOverModal').style.display = 'flex';
}

function restartGame() {
    document.getElementById('gameOverModal').style.display = 'none';
    score = 0;
    gameSpeed = baseGameSpeed;
    gameOver = false;
    obstacles.length = 0;
    player.y = 150;
    player.velocityY = 0;
    currentTheme = 'space';
    updateParticlesForTheme();
    gameLoop();
}

function startThemeTransition() {
    isTransitioning = true;
    obstacles.length = 0; 
    
    setTimeout(() => {
        currentTheme = 'earth';
        updateParticlesForTheme();
        isTransitioning = false;
        obstacleTimer = 0; 
    }, 2000);
}

function updateParticlesForTheme() {
    particles.forEach(particle => {
        if (currentTheme === 'space') {
            particle.color = '#ffffff';
            particle.radius = Math.random() * 2;
        } else {
            particle.color = '#ffffff';
            particle.radius = Math.random() * 3 + 1;
        }
    });
}

function drawParticles() {
    particles.forEach(particle => {
        ctx.beginPath();
        if (currentTheme === 'earth') {
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.arc(particle.x + 5, particle.y, particle.radius * 0.8, 0, Math.PI * 2);
            ctx.arc(particle.x + 2.5, particle.y - 2, particle.radius * 0.9, 0, Math.PI * 2);
        } else {
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        }
        ctx.fillStyle = particle.color;
        ctx.fill();

        particle.x -= particle.speed;
        if (particle.x < 0) {
            particle.x = canvas.width;
            particle.y = Math.random() * canvas.height;
        }
    });
}

function drawTriangle(x, y, width, height) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y - height/2);
    ctx.lineTo(x + width, y + height/2);
    ctx.closePath();
    ctx.fillStyle = themes[currentTheme].triangleColor;
    ctx.fill();
}

function isPlayerAboveTriangle(playerX, playerY, triangleX, triangleWidth) {
    return playerY < 150 && 
           playerX + player.radius > triangleX && 
           playerX - player.radius < triangleX + triangleWidth;
}

function generateObstacle() {
    let type;
    if (score >= 20) {
        type = Math.random() > 0.5 ? OBSTACLE_TYPES.RECTANGLE : OBSTACLE_TYPES.LOW_TRIANGLE;
    } else {
        type = OBSTACLE_TYPES.RECTANGLE;
    }

    obstacles.push({
        x: canvas.width,
        y: 150,
        width: 20,
        height: type === OBSTACLE_TYPES.RECTANGLE ? 30 : 20,
        type
    });
}

function gameLoop() {
    if (!gameOver) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.backgroundColor = themes[currentTheme].background;

        updateGameSpeed();
        drawParticles();

        ctx.beginPath();
        ctx.moveTo(0, 165);
        ctx.lineTo(canvas.width, 165);
        ctx.strokeStyle = themes[currentTheme].groundColor;
        ctx.stroke();

        if (isJumping && player.y === 150) {
            player.velocityY = player.jumpForce;
        }

        player.velocityY += gravity;
        player.y += player.velocityY;

        if (player.y > 150) {
            player.y = 150;
            player.velocityY = 0;
        }

        const gradient = ctx.createRadialGradient(
            player.x, player.y, 0,
            player.x, player.y, player.radius
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, themes[currentTheme].playerColor);
        
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        if (score === 20 && !isTransitioning) {
            startThemeTransition();
        }

        obstacleTimer++;
if (obstacleTimer > 50) {
    generateObstacle();
    obstacleTimer = 0;
}
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obstacle = obstacles[i];
            obstacle.x -= gameSpeed;

            if (obstacle.type === OBSTACLE_TYPES.RECTANGLE) {
                ctx.fillStyle = themes[currentTheme].obstacleColor;
                ctx.fillRect(obstacle.x, obstacle.y - obstacle.height, obstacle.width, obstacle.height);
                
                const dx = player.x - Math.max(obstacle.x, Math.min(player.x, obstacle.x + obstacle.width));
                const dy = player.y - Math.max(obstacle.y - obstacle.height, Math.min(player.y, obstacle.y));
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < player.radius) {
                    gameOver = true;
                    showGameOver();
                }
            } else {
                drawTriangle(obstacle.x, obstacle.y - 10, obstacle.width, obstacle.height);
                
                if (isPlayerAboveTriangle(player.x, player.y, obstacle.x, obstacle.width)) {
                    gameOver = true;
                    showGameOver();
                }
            }

            if (obstacle.x + obstacle.width < 0) {
                obstacles.splice(i, 1);
                score++;
            }
        }

        ctx.fillStyle = themes[currentTheme].textColor;
        ctx.font = '16px "Press Start 2P"';
        ctx.fillText(`SCORE: ${score}`, 20, 30);
        ctx.fillText(`SPEED: ${gameSpeed}`, 20, 60);

        requestAnimationFrame(gameLoop);
    }
}

function startGame() {
    document.getElementById('welcomeModal').style.display = 'none';
    gameStarted = true;
    gameLoop();
}

// Event Listeners
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        isJumping = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
        isJumping = false;
    }
});