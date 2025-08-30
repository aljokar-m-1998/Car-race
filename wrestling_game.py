#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import random
import time

# ألوان ANSI (تعمل على Termux). تُغلق تلقائياً لو غير مدعومة.
class C:
    _on = sys.stdout.isatty()
    RESET = "\033[0m" if _on else ""
    BOLD = "\033[1m" if _on else ""
    DIM = "\033[2m" if _on else ""
    GREEN = "\033[92m" if _on else ""
    YELLOW = "\033[93m" if _on else ""
    RED = "\033[91m" if _on else ""
    CYAN = "\033[96m" if _on else ""
    BLUE = "\033[94m" if _on else ""
    MAGENTA = "\033[95m" if _on else ""
    GREY = "\033[90m" if _on else ""

def clear():
    os.system("clear" if os.name != "nt" else "cls")

def clamp(x, lo, hi):
    return max(lo, min(hi, x))

def bar(current, maximum, length=22):
    ratio = 0.0 if maximum <= 0 else current / maximum
    ratio = clamp(ratio, 0.0, 1.0)
    fill = int(round(ratio * length))
    empty = length - fill
    if ratio >= 0.6:
        color = C.GREEN
    elif ratio >= 0.3:
        color = C.YELLOW
    else:
        color = C.RED
    return f"{color}[{'█'*fill}{' ' * empty}]{C.RESET} {int(current)}/{int(maximum)}"

class Wrestler:
    def __init__(self, name, max_hp=120, max_stamina=100):
        self.name = name
        self.max_hp = max_hp
        self.hp = max_hp
        self.max_stamina = max_stamina
        self.stamina = max_stamina
        self.block_active = False      # يقلل الضرر القادم حتى نهاية هذا الدور
        self.special = 0               # من 0 إلى 100
        self.last_message = ""

    @property
    def alive(self):
        return self.hp > 0

    def receive_damage(self, amount):
        amount = max(0, int(round(amount)))
        if self.block_active:
            amount = int(round(amount * 0.6))  # 40% تقليل ضرر
        self.hp = clamp(self.hp - amount, 0, self.max_hp)
        return amount

    def spend_stamina(self, cost):
        cost = int(cost)
        if self.stamina < cost:
            return False
        self.stamina -= cost
        return True

    def regain_stamina(self, amount):
        self.stamina = clamp(self.stamina + int(amount), 0, self.max_stamina)

    def heal(self, amount):
        self.hp = clamp(self.hp + int(amount), 0, self.max_hp)

    def add_special(self, points):
        self.special = clamp(self.special + int(points), 0, 100)

    def consume_special(self):
        self.special = 0

def hud(player, enemy, round_no):
    print(f"{C.BOLD}{C.CYAN}=== جولة {round_no} ==={C.RESET}")
    print(f"{C.BOLD}{player.name}{C.RESET}")
    print(f"الصحة:  {bar(player.hp, player.max_hp)}")
    print(f"الطاقة: {bar(player.stamina, player.max_stamina)}")
    print(f"الخاص:  {bar(player.special, 100)}")
    print()
    print(f"{C.BOLD}{enemy.name}{C.RESET}")
    print(f"الصحة:  {bar(enemy.hp, enemy.max_hp)}")
    print(f"الطاقة: {bar(enemy.stamina, enemy.max_stamina)}")
    print(f"الخاص:  {bar(enemy.special, 100)}")
    print("-" * 38)

def roll_hit(acc):
    return random.random() <= acc

def roll_damage(min_dmg, max_dmg, crit_chance=0.12, crit_mult=1.5):
    base = random.randint(min_dmg, max_dmg)
    crit = random.random() < crit_chance
    if crit:
        return int(round(base * crit_mult)), True
    return base, False

def msg(text, delay=0.6):
    print(text)
    time.sleep(delay)

def player_menu(player):
    print(f"{C.BOLD}اختياراتك:{C.RESET}")
    # 1-6 أفعال أساسية + 7 الحركة القاضية عند توفرها
    print("1) لكمة سريعة (دقة عالية، ضرر قليل، طاقة قليلة)")
    print("2) ضربة قوية (دقة أقل، ضرر كبير، طاقة أكثر)")
    print("3) مسك/إخضاع (ضرر متوسط + يسحب طاقة الخصم)")
    print("4) استفزاز (تزود الشريط الخاص وتعيد قليل طاقة)")
    print("5) صدّ/بلوك (تقليل الضرر في هذا الدور)")
    print("6) استشفاء خفيف (ترجع صحة بسيطة وطاقة)")
    if player.special >= 100:
        print(f"{C.MAGENTA}7) القاضية! (ضرر ضخم، تستهلك الخاص){C.RESET}")
    choice = input(f"{C.BOLD}اختيارك؟ {C.RESET}").strip()
    return choice

def do_action(attacker, defender, action, is_player=True):
    log = []

    def add(line):
        log.append(line)

    name_a = f"{C.BOLD}{attacker.name}{C.RESET}"
    name_d = f"{C.BOLD}{defender.name}{C.RESET}"

    # تعريف الحركات
    moves = {
        "jab":   {"cost": 8,  "acc": 0.90, "dmg": (8, 12),  "spec_gain": 10},
        "slam":  {"cost": 16, "acc": 0.72, "dmg": (16, 24), "spec_gain": 15},
        "grap":  {"cost": 14, "acc": 0.80, "dmg": (10, 18), "spec_gain": 12, "drain_sta": 10},
        "taunt": {"cost": 0,  "acc": 1.00, "dmg": (0, 0),   "spec_gain": 25, "sta_gain": 6},
        "block": {"cost": 0},
        "heal":  {"cost": 0,  "heal_hp": 7, "sta_gain": 16},
        "ult":   {"cost": 25, "acc": 0.85, "dmg": (30, 45)}  # يحتاج خاص مكتمل
    }

    if action == "1":  # jab
        mv = moves["jab"]
        if not attacker.spend_stamina(mv["cost"]):
            add(f"{name_a}: طاقتي قليلة للحركة! (تحتاج {mv['cost']})")
            return log
        if roll_hit(mv["acc"]):
            dmg, crit = roll_damage(*mv["dmg"])
            dealt = defender.receive_damage(dmg)
            attacker.add_special(mv["spec_gain"])
            add(f"{name_a} يوجه لكمة سريعة! تسبب {dealt} ضرر{' (ضربة حرجة!)' if crit else ''}.")
        else:
            add(f"{name_a} يخطئ اللكمة!")
    elif action == "2":  # slam
        mv = moves["slam"]
        if not attacker.spend_stamina(mv["cost"]):
            add(f"{name_a}: طاقتي قليلة للحركة! (تحتاج {mv['cost']})")
            return log
        if roll_hit(mv["acc"]):
            dmg, crit = roll_damage(*mv["dmg"])
            dealt = defender.receive_damage(dmg)
            attacker.add_special(mv["spec_gain"])
            add(f"{name_a} ينفذ ضربة قوية! تسبب {dealt} ضرر{' (حرجة!)' if crit else ''}.")
        else:
            add(f"{name_a} يطيح بالهواء! الضربة فاتت.")
    elif action == "3":  # grapple
        mv = moves["grap"]
        if not attacker.spend_stamina(mv["cost"]):
            add(f"{name_a}: طاقتي قليلة للحركة! (تحتاج {mv['cost']})")
            return log
        if roll_hit(mv["acc"]):
            dmg, crit = roll_damage(*mv["dmg"])
            dealt = defender.receive_damage(dmg)
            attacker.add_special(mv["spec_gain"])
            drain = mv.get("drain_sta", 0)
            before = defender.stamina
            defender.stamina = clamp(defender.stamina - drain, 0, defender.max_stamina)
            drained = before - defender.stamina
            extra = f" وسحب {drained} طاقة" if drained > 0 else ""
            add(f"{name_a} يمسك بالخصم! تسبب {dealt} ضرر{ ' (حرجة!)' if crit else ''}{extra}.")
        else:
            add(f"{name_a} حاول إخضاع لكن الخصم تفلّت!")
    elif action == "4":  # taunt
        mv = moves["taunt"]
        if not attacker.spend_stamina(mv["cost"]):
            add(f"{name_a}: طاقتي قليلة للحركة!")
            return log
        attacker.add_special(mv["spec_gain"])
        attacker.regain_stamina(mv["sta_gain"])
        add(f"{name_a} يستفز الجمهور! زاد الخاص +{mv['spec_gain']}, واستعاد طاقة +{mv['sta_gain']}.")
    elif action == "5":  # block
        attacker.block_active = True
        add(f"{name_a} يرفع الحماية! الضرر الداخل سيقل هذا الدور.")
    elif action == "6":  # heal light
        mv = moves["heal"]
        attacker.heal(mv["heal_hp"])
        attacker.regain_stamina(mv["sta_gain"])
        add(f"{name_a} يلتقط أنفاسه. استعاد صحة +{mv['heal_hp']} وطاقة +{mv['sta_gain']}.")
    elif action == "7":  # ultimate (only if special full)
        mv = moves["ult"]
        if attacker.special < 100:
            add(f"{name_a}: الشريط الخاص غير مكتمل!")
            return log
        if not attacker.spend_stamina(mv["cost"]):
            add(f"{name_a}: طاقتي لا تكفي للقاضية! (تحتاج {mv['cost']})")
            return log
        # يستهلك الخاص بالكامل
        attacker.consume_special()
        if roll_hit(mv["acc"]):
            dmg, crit = roll_damage(*mv["dmg"], crit_chance=0.2, crit_mult=1.6)
            dealt = defender.receive_damage(dmg)
            add(f"{C.MAGENTA}{name_a} ينفذ القاضية!!! تسبب {dealt} ضرر{' (سحق مدوّي!)' if crit else ''}.{C.RESET}")
        else:
            add(f"{name_a} حاول القاضية لكنها فشلت! لحظة مؤلمة.")
    else:
        add(f"{name_a}: اختيار غير مفهوم، ضاعت الفرصة.")
    return log

def ai_choose(enemy: Wrestler, player: Wrestler):
    # منطق بسيط وذكي بشكل معقول
    # الأولوية: القاضية إن متاحة ومضمونة تقريباً
    if enemy.special >= 100 and enemy.stamina >= 25 and player.hp <= 45:
        return "7"
    # لو صحة العدو قليلة، جرّب ضربة سريعة لإنهاءه
    if player.hp <= 14 and enemy.stamina >= 8:
        return "1"
    # لو طاقة العدو قليلة جداً، استشفاء خفيف
    if enemy.stamina <= 10 and enemy.hp < enemy.max_hp - 6:
        return "6"
    # لو العدو استماتته عالية، استفزاز لرفع الخاص
    if enemy.special <= 70 and random.random() < 0.2:
        return "4"
    # نسبة من الوقت يختار بلوك لو يتوقع ضربة قوية
    if random.random() < 0.12:
        return "5"
    # اختيار بين الضربة القوية والإخضاع واللكمة حسب الطاقة
    if enemy.stamina >= 16 and random.random() < 0.5:
        return "2"
    if enemy.stamina >= 14 and random.random() < 0.6:
        return "3"
    if enemy.stamina >= 8:
        return "1"
    # إن لم تتوفر طاقة كفاية
    return "6"

def any_key():
    try:
        input(f"{C.GREY}(اضغط Enter للمتابعة){C.RESET}")
    except EOFError:
        pass

def game():
    clear()
    print(f"{C.BOLD}{C.BLUE}لعبة المصارعة النصّية — Termux Edition{C.RESET}")
    print("اختَر اسمك أو اتركه افتراضي:")
    pname = input("> ").strip()
    if not pname:
        pname = "المقاتل"
    enemies = ["العملاق", "الصخرة", "البركان", "الإعصار", "العقرب"]
    ename = random.choice(enemies)

    player = Wrestler(pname, max_hp=120, max_stamina=100)
    enemy = Wrestler(ename, max_hp=120, max_stamina=100)

    round_no = 1
    while player.alive and enemy.alive:
        clear()
        hud(player, enemy, round_no)

        # إعادة تعيين البلوك في بداية كل دور
        player.block_active = False
        enemy.block_active = False

        # دور اللاعب
        choice = player_menu(player)
        logs_p = do_action(player, enemy, choice, is_player=True)
        for line in logs_p:
            msg(line, delay=0.5)
        if not enemy.alive:
            break

        # دور العدو (ذكاء اصطناعي)
        time.sleep(0.3)
        ai_choice = ai_choose(enemy, player)
        logs_e = do_action(enemy, player, ai_choice, is_player=False)
        for line in logs_e:
            msg(line, delay=0.5)
        if not player.alive:
            break

        # تعافي طفيف للطاقة نهاية الجولة
        player.regain_stamina(6)
        enemy.regain_stamina(6)

        any_key()
        round_no += 1

    clear()
    hud(player, enemy, round_no)
    if player.alive and not enemy.alive:
        print(f"{C.BOLD}{C.GREEN}فوز!{C.RESET} {player.name} أسقط {enemy.name} أرضاً!")
    elif enemy.alive and not player.alive:
        print(f"{C.BOLD}{C.RED}هزيمة!{C.RESET} {enemy.name} تغلّب على {player.name}.")
    else:
        print(f"{C.BOLD}انتهت المباراة!{C.RESET}")

    print()
    print("هل تريد اللعب مرة أخرى؟ (y/n)")
    again = input("> ").strip().lower()
    if again == "y":
        game()

if __name__ == "__main__":
    try:
        game()
    except KeyboardInterrupt:
        print("\nوداعاً!")
