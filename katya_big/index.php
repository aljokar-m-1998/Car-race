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
        overflow-x: hidden;
    }
    header {
        padding: 50px 20px 20px;
        animation: fadeIn 2s ease-in-out;
    }
    h1 {
        font-size: 3.5em;
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
    .balloons, .stars {
        position: relative;
        height: 200px;
        margin-top: 30px;
    }
    .balloon {
        width: 60px;
        height: 80px;
        border-radius: 50%;
        position: absolute;
        bottom: 0;
        animation: float 6s ease-in-out infinite;
    }
    .balloon:before {
        content: "";
        position: absolute;
        width: 2px;
        height: 50px;
        background: white;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
    }
    .balloon:nth-child(1) { left: 15%; background: #ff4d4d; animation-delay: 0s; }
    .balloon:nth-child(2) { left: 35%; background: #4dff4d; animation-delay: 2s; }
    .balloon:nth-child(3) { left: 55%; background: #4d4dff; animation-delay: 4s; }
    .balloon:nth-child(4) { left: 75%; background: #ffff4d; animation-delay: 1s; }

    @keyframes float {
        0% { transform: translateY(0); }
        50% { transform: translateY(-100px); }
        100% { transform: translateY(0); }
    }
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    footer {
        margin-top: 50px;
        padding: 20px;
        background: rgba(0,0,0,0.2);
        font-size: 1.2em;
    }
</style>
</head>
<body>
    <header>
        <h1>🎉 З Днем Народження, Катя! 🎉</h1>
        <h2>Happy Birthday, Katya! 💙💛</h2>
        <p>اليوم: <?php echo $today; ?></p>
    </header>

    <p>
        عزيزتي كاتيا، في هذا اليوم المميز أتمنى لكِ عامًا مليئًا بالفرح، الصحة، والنجاحات.  
        لتكن أيامك القادمة أكثر إشراقًا من أي وقت مضى، ولتتحقق كل أحلامك الكبيرة والصغيرة.  
        أتمنى أن يحمل لك العام الجديد لحظات لا تُنسى، وأصدقاء أوفياء، وفرصًا رائعة تفتح لك أبواب السعادة.  
        💐 كل عام وأنتِ بخير، ومع كل شروق شمس، يبدأ فصل جديد من الجمال في حياتك.
    </p>

    <div class="balloons">
        <div class="balloon"></div>
        <div class="balloon"></div>
        <div class="balloon"></div>
        <div class="balloon"></div>
    </div>

    <footer>
        مع أطيب التمنيات من محمود 🌹
    </footer>
</body>
</html>
