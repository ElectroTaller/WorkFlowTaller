import json

def find_bind_modal_events():
    transcript_path = r'C:\Users\Personal\.gemini\antigravity-ide\brain\3bfb741f-e4b8-4940-9bf5-9eaacb3b0f20\.system_generated\logs\transcript.jsonl'
    
    with open(transcript_path, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                data = json.loads(line)
                if 'content' in data and data['content']:
                    content = data['content']
                    if 'bindModalEvents() {' in content:
                        print("FOUND IN CONTENT:")
                        # Print the 2000 characters around it
                        idx = content.find('bindModalEvents() {')
                        start = max(0, idx - 100)
                        end = min(len(content), idx + 2000)
                        print(content[start:end])
                        return
            except Exception as e:
                pass

find_bind_modal_events()
