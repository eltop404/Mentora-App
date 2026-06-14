import base64
import os

path = r"C:\Users\AMR\.gemini\antigravity\brain\10f2e895-43d3-4598-bc1c-0834d626ecc7\egyptian_tomb_cinematic_bg_1776210515119.png"
if os.path.exists(path):
    with open(path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        print(encoded_string[:1000000]) # Print first 1MB to avoid overflow in logs but I need it all
else:
    print("File not found")
