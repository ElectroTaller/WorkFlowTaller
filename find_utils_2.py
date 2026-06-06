import json
import re

transcript_path = r"C:\Users\Personal\.gemini\antigravity-ide\brain\3bfb741f-e4b8-4940-9bf5-9eaacb3b0f20\.system_generated\logs\transcript.jsonl"

for line in open(transcript_path, 'r', encoding='utf-8'):
    if 'columnAccentColor' in line:
        try:
            obj = json.loads(line)
            if 'content' in obj:
                idx = obj['content'].find('columnAccentColor')
                # only print if it's a function definition
                content = obj['content']
                if 'columnAccentColor(' in content or 'columnAccentColor:' in content:
                    print("--- CONTENT ---")
                    print(content[max(0, idx-500):idx+1000])
            if 'tool_calls' in obj:
                for tc in obj['tool_calls']:
                    if 'args' in tc and 'ReplacementContent' in tc['args']:
                        content = tc['args']['ReplacementContent']
                        if 'columnAccentColor(' in content:
                            idx = content.find('columnAccentColor')
                            print("--- REPLACEMENT CONTENT ---")
                            print(content[max(0, idx-500):idx+1000])
        except:
            pass
