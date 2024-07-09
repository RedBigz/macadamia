import os, shutil

if os.path.exists("out"):
    shutil.rmtree("out")

os.makedirs("out", exist_ok=True)

os.system("npx tsc")

with open("./out/macadamia.js.part", "r", encoding="utf8") as macadamiapart, open("./out/macadamia.js", "w+", encoding="utf8") as macadamiafile, open("loader.js", "r", encoding="utf8") as loader:
    cpr = macadamiapart.read()
    macadamiafile.write(loader.read().replace("/* REPLACE */", cpr.replace("\n", "\n\t").strip() + ("\n\trequire([\"index\"]);" if "define(\"index" in cpr else "")))

# os.system("javascript-obfuscator.cmd macadamia.part2.js --output macadamia.js")

os.remove("./out/macadamia.js.part")
# os.rename("./out/macadamia.js.part.map", "./out/macadamia.js.map")