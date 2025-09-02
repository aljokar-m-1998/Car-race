<?php
date_default_timezone_set("Africa/Cairo");
$time = date("H:i:s");
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>مرحباً يا محمود</title>
<style>
    body {
        margin: 0;
        font-family: Tahoma, sans-serif;
        background: linear-gradient(135deg, #4facfe, #00f2fe);
        color: white;
        text-align: center;
        padding-top: 15%;
    }
    h1 {
        font-size: 3em;
        margin-bottom: 0.3em;
    }
    p {
        font-size: 1.5em;
        background: rgba(0,0,0,0.3);
        display: inline-block;
        padding: 10px 20px;
        border-radius: 10px;
    }
</style>
</head>
<body>
    <h1>👋 أهلاً يا محمود</h1>
    <p>الوقت الآن: <?php echo $time; ?></p>
</body>
</html>
