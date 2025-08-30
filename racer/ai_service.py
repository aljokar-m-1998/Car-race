# -*- coding: utf-8 -*-
# ai_service.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import math

app = Flask(__name__)
CORS(app)

def angle_diff(a, b):
    # يرجع الفرق في الزاوية داخل المدى [-pi, pi]
    d = (a - b + math.pi) % (2*math.pi) - math.pi
    return d

@app.route("/ai/decision", methods=["POST"])
def ai_decision():
    data = request.get_json(force=True)
    ai = data["ai"]       # {x,y,angle,speed}
    target = data["target"]  # {cx, cy} — نقطة الهدف (checkpoint الحالي)
    params = data.get("params", {"max_speed": 220.0, "aggr": 1.0})

    ax, ay, a_ang, a_spd = ai["x"], ai["y"], ai["angle"], ai["speed"]
    tx, ty = target["cx"], target["cy"]

    # زاوية الهدف والمسافة
    desired = math.atan2(ty - ay, tx - ax)
    diff = angle_diff(desired, a_ang)
    dist = math.hypot(tx - ax, ty - ay)

    # توجيه: لو الفرق كبير نلف بقوة، لو صغير نقلل
    steer = max(-1.0, min(1.0, (diff / (math.pi/2)) * 1.2))  # تطبيع
    # تسارع: نسرّع أكثر لو متجهين صح، نقلل قرب المنعطف
    align = max(0.0, 1.0 - abs(diff) / (math.pi/2))
    target_speed = params["max_speed"] * (0.5 + 0.5*align)
    # كبح/تسارع بسيط
    throttle = 1.0 if a_spd < target_speed else (-0.7 if a_spd > target_speed*1.1 else 0.0)

    # كبح إضافي لو المسافة قصيرة ومنعطف حاد
    if dist < 140 and abs(diff) > 0.6:
        throttle = min(throttle, -0.8)

    return jsonify({"throttle": float(throttle), "steer": float(steer)})
    
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001)
