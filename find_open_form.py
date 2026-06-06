import json

def find_open_form():
    transcript_path = r'C:\Users\Personal\.gemini\antigravity-ide\brain\3bfb741f-e4b8-4940-9bf5-9eaacb3b0f20\.system_generated\logs\transcript.jsonl'
    
    with open(transcript_path, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                data = json.loads(line)
                if 'content' in data and data['content']:
                    content = data['content']
                    if 'openForm(apt' in content and 'function' not in content.lower():
                        idx = content.find('openForm(apt')
                        if 'this.openForm(apt)' not in content[max(0, idx-50):min(len(content), idx+50)]:
                            print("FOUND IN CONTENT:")
                            print(content[max(0, idx - 100):min(len(content), idx + 2000)])
                            return
            except Exception as e:
                pass

find_open_form()
