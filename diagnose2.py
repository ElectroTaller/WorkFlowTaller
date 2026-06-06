import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Show chars around the premature firebaseModule insertion (char 1691)
print("=== CONTEXT BEFORE PREMATURE BLOCK ===")
print(repr(content[1550:1695]))

print("\n=== END OF PREMATURE BLOCK ===")
# Find where the premature block ends - look for where it's cut off
# The premature block is incomplete - it ends where the real ordersModule code starts
pm_start = 1691
# Find the next "const " after the premature block
next_const = content.find('\nconst ', pm_start + 100)
print(f"Next const at char: {next_const}")
print(repr(content[pm_start:next_const + 50]))
