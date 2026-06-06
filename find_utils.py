import json
import re

transcript_path = r"C:\Users\Personal\.gemini\antigravity-ide\brain\3bfb741f-e4b8-4940-9bf5-9eaacb3b0f20\.system_generated\logs\transcript.jsonl"

full_text = ""
with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            obj = json.loads(line)
            if 'content' in obj:
                full_text += obj['content'] + "\n"
            if 'tool_calls' in obj:
                for tc in obj['tool_calls']:
                    if 'args' in tc and 'ReplacementContent' in tc['args']:
                        full_text += tc['args']['ReplacementContent'] + "\n"
        except:
            pass

idx = full_text.rfind('const utils = {')
if idx != -1:
    print(full_text[idx:idx+2000])
else:
    print("Not found")
