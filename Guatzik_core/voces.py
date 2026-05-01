import pyttsx3

motor_voz = pyttsx3.init()
voces = motor_voz.getProperty('voices')

print("\n🎤 VOCES ENCONTRADAS EN TU SISTEMA:\n")
for voz in voces:
    print(f"Nombre: {voz.name} | ID exacto: {voz.id}")
print("\n")