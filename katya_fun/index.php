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
    p {
        font-size: 1.2em;
        max-width: 600px;
        margin: 20px auto;
        background: rgba(0,0,0,0.3);
        padding: 15px;
        border-radius: 10px;
        line-height: 1.6;
    }
    .balloon-game {
        position: absolute;
        width: 60px;
        height: 80px;
        background: red;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
    }
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
    }
</style>
</head>
<body>
    <header>
        <h1>🎉 З Днем Народження, Катя! 🎉</h1>
        <h2>Нехай цей рік буде найкращим у твоєму житті!</h2>
        <p>Сьогодні: <?php echo $today; ?></p>
    </header>

    <p>
        Дорога Катя, бажаю тобі безмежного щастя, міцного здоров’я та здійснення найзаповітніших мрій.  
        Нехай кожен день нового року приносить тобі радість, тепло та любов.  
        Хай удача завжди буде поруч, а серце наповнюється світлом і гармонією.  
        🌸 З найкращими побажаннями від Махмуд.
    </p>

    <div id="balloon" class="balloon-game"></div>

    <script>
        const balloon = document.getElementById('balloon');
        const popSound = new Audio('https://www.soundjay.com/buttons/sounds/button-16.mp3');

        function moveBalloon() {
            const x = Math.random() * (window.innerWidth - 60);
            const y = Math.random() * (window.innerHeight - 80);
            balloon.style.left = x + 'px';
            balloon.style.top = y + 'px';
        }

        balloon.addEventListener('click', () => {
            popSound.play();
            moveBalloon();
        });

        moveBalloon();
    </script>
</body>
</html>
