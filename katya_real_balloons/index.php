<?php
date_default_timezone_set("Europe/Kyiv");
$today = date("Y-m-d");
?>
<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8">
<title>З Днем Народження, Катя!</title>
<style>
    body {
        margin: 0;
        font-family: 'Segoe UI', Tahoma, sans-serif;
        background: linear-gradient(135deg, #0057B7, #FFD700);
        color: white;
        text-align: center;
        overflow: hidden;
    }
    header {
        padding: 40px 20px 10px;
        animation: fadeIn 2s ease-in-out;
    }
    h1 {
        font-size: 3em;
        margin-bottom: 0.2em;
        text-shadow: 2px 2px 5px rgba(0,0,0,0.3);
    }
    h2 {
        font-size: 1.5em;
        margin-top: 0;
        font-weight: normal;
    }
    .balloon {
        position: absolute;
        width: 70px;
        height: 90px;
        border-radius: 50%;
        cursor: pointer;
        background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), transparent 40%), 
                    radial-gradient(circle at 70% 70%, rgba(0,0,0,0.2), transparent 40%);
        background-color: red;
        box-shadow: inset -5px -10px 15px rgba(0,0,0,0.2);
        animation: float 6s ease-in-out infinite;
    }
    .balloon:before {
        content: "";
        position: absolute;
        width: 2px;
        height: 50px;
        background: white;
        top: 90px;
        left: 50%;
        transform: translateX(-50%);
    }
    @keyframes float {
        0% { transform: translateY(0); }
        50% { transform: translateY(-100px); }
        100% { transform: translateY(0); }
    }
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    /* صندوق التهنئة */
    #gift-box {
        margin: 40px auto;
        width: 300px;
        height: 150px;
        background: rgba(0,0,0,0.3);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 1.5em;
        font-weight: bold;
        box-shadow: 0 0 15px rgba(0,0,0,0.5);
        transition: background 0.5s;
    }
    #gift-box:hover {
        background: rgba(0,0,0,0.5);
    }
    #message {
        display: none;
        font-size: 1.2em;
        max-width: 600px;
        margin: 20px auto;
        background: rgba(0,0,0,0.3);
        padding: 15px;
        border-radius: 10px;
        line-height: 1.6;
    }
</style>
</head>
<body>
    <header>
        <h1>🎉 З Днем Народження, Катя! 🎉</h1>
        <h2>Нехай цей рік буде найкращим у твоєму житті!</h2>
        <p>Сьогодні: <?php echo $today; ?></p>
    </header>

    <div id="gift-box">🎁 Натисни, щоб відкрити</div>

    <div id="message">
        Дорога Катя, бажаю тобі безмежного щастя, міцного здоров’я та здійснення найзаповітніших мрій.  
        Нехай кожен день нового року приносить тобі радість, тепло та любов.  
        Хай удача завжди буде поруч, а серце наповнюється світлом і гармонією.  
        🌸 З найкращими побажаннями від Махмуд.
    </div>

    <script>
        const colors = ['#ff4d4d', '#4dff4d', '#4d4dff', '#ffff4d', '#ff66ff', '#00ffff'];
        const popSound = new Audio('https://www.soundjay.com/buttons/sounds/button-16.mp3');

        function createBalloon() {
            const balloon = document.createElement('div');
            balloon.className = 'balloon';
            balloon.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            document.body.appendChild(balloon);

            function moveBalloon() {
                const x = Math.random() * (window.innerWidth - 70);
                const y = Math.random() * (window.innerHeight - 90);
                balloon.style.left = x + 'px';
                balloon.style.top = y + 'px';
            }

            balloon.addEventListener('click', () => {
                popSound.play();
                moveBalloon();
            });

            moveBalloon();
            setInterval(moveBalloon, 3000);
        }

        for (let i = 0; i < 12; i++) {
            createBalloon();
        }

        document.getElementById('gift-box').addEventListener('click', function() {
            this.style.display = 'none';
            document.getElementById('message').style.display = 'block';
        });
    </script>
</body>
</html>
