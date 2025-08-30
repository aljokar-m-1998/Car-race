# -*- coding: utf-8 -*-
# أداة بسيطة لفحص ثغرات مكتبات بايثون من OSV
import json, urllib.request, urllib.error, ssl

try:
    import pkg_resources
except ImportError:
    print("❌ مكتبة pkg_resources مش متوفرة. نزّل setuptools:")
    print("pip install setuptools")
    exit()

def list_installed_packages():
    """ترجع قائمة المكتبات المثبتة"""
    return [(dist.project_name, dist.version) for dist in pkg_resources.working_set]

def call_osv_batch(queries):
    """استعلام OSV API"""
    url = "https://api.osv.dev/v1/querybatch"
    payload = json.dumps({"queries": queries}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=25) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.URLError as e:
        return {"error": f"network_error: {e}"}
    except Exception as e:
        return {"error": f"unexpected_error: {e}"}

def scan_packages():
    pkgs = list_installed_packages()
    if not pkgs:
        print("⚠️ لا توجد مكتبات مثبتة.")
        return

    print(f"🔍 تم العثور على {len(pkgs)} مكتبة. جاري الفحص...\n")
    results = []

    chunk = 50
    for i in range(0, len(pkgs), chunk):
        sub = pkgs[i:i+chunk]
        queries = [{"package": {"name": n, "ecosystem": "PyPI"}, "version": v} for n,v in sub]
        resp = call_osv_batch(queries)
        if "error" in resp:
            print(f"❌ خطأ أثناء الاتصال: {resp['error']}")
            return
        results.extend(resp.get("results", []))

    vulnerable_count = 0
    idx = 0
    for name, version in pkgs:
        entry = results[idx] if idx < len(results) else {"vulns": None}
        idx += 1
        vulns = entry.get("vulns")
        if vulns:
            vulnerable_count += 1
            print(f"🚨 {name}=={version}")
            for v in vulns:
                vid = v.get("id", "VULN")
                summary = v.get("summary", "لا يوجد وصف")
                print(f"  - {vid}: {summary[:100]}...")
        else:
            print(f"✅ {name}=={version} (آمن)")
        print("-" * 50)

    print(f"\n✅ الفحص انتهى. مكتبات بها ثغرات: {vulnerable_count}/{len(pkgs)}")

if __name__ == "__main__":
    scan_packages()
