import os

os.system("tsc")

with open("ccm.js.part", "r") as ccmpart, open("ccm.part2.js", "w+") as ccmfile, open("loader.js", "r") as loader:
    cpr = ccmpart.read()
    ccmfile.write(loader.read().replace("/* REPLACE */", cpr.replace("\n", "\n\t").strip() + ("\n\trequire([\"index\"]);" if "define(\"index" in cpr else "")))

os.system("javascript-obfuscator.cmd ccm.part2.js --output ccm.js")

os.remove("ccm.js.part")
os.remove("ccm.part2.js")