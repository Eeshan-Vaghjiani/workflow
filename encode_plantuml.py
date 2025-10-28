import zlib
import base64
import sys

def encode(text):
    """
    Encode PlantUML text for use with the PlantUML server
    """
    compressed = zlib.compress(text.encode('utf-8'))
    b64_str = base64.b64encode(compressed)
    return b64_str.decode('utf-8')

# Read the PlantUML file
with open('workflow_activity_diagram_complete.puml', 'r') as f:
    puml_text = f.read()

# Remove @startuml and @enduml lines if present
puml_text = puml_text.replace('@startuml AI-Assisted Task Management System - Complete', '')
puml_text = puml_text.replace('@enduml', '')

# Encode the text
encoded = encode(puml_text)

# Print the encoded text and full URL
print(f"Encoded text: {encoded}")
print(f"PlantUML URL: https://www.plantuml.com/plantuml/png/{encoded}")
print(f"SVG URL: https://www.plantuml.com/plantuml/svg/{encoded}") 