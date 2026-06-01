import os
import re

def parse_bashrc():
    bashrc_path = os.path.expanduser('~/.bashrc')
    if not os.path.exists(bashrc_path):
        return ["Keine .bashrc gefunden"]
    try:
        with open(bashrc_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        lines = content.split('\n')
        return lines[max(0, len(lines) - 20):]
    except Exception as e:
        return [f"FEHLER: {str(e)}"]

def parse_bashrc_env_vars():
    result = {}
    bashrc_path = os.path.expanduser('~/.bashrc')
    if not os.path.exists(bashrc_path):
        return result
    try:
        with open(bashrc_path, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                line = line.strip()
                if line.startswith('#'):
                    continue
                m = re.match(r'^(?:export\s+)?(\w+)=(.+)$', line)
                if m:
                    key = m.group(1)
                    val = m.group(2).strip().strip('"').strip("'")
                    result[key] = val
    except Exception:
        pass
    return result
