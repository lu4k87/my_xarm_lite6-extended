import os
import re

_bashrc_mtime = 0
_bashrc_cache = []

def parse_bashrc():
    global _bashrc_mtime, _bashrc_cache
    bashrc_path = os.path.expanduser('~/.bashrc')
    if not os.path.exists(bashrc_path):
        return ["Keine .bashrc gefunden"]
    try:
        current_mtime = os.path.getmtime(bashrc_path)
        if current_mtime <= _bashrc_mtime and _bashrc_cache:
            return _bashrc_cache
        _bashrc_mtime = current_mtime
        with open(bashrc_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        lines = content.split('\n')
        _bashrc_cache = lines[max(0, len(lines) - 20):]
        return _bashrc_cache
    except Exception as e:
        return [f"FEHLER: {str(e)}"]

def parse_bashrc_env_vars():
    """Liest gezielt export-Zeilen aus ~/.bashrc aus.
    Gibt ein Dict mit den gefundenen Werten zurueck.
    Dient als Fallback wenn os.environ die Variablen nicht enthaelt.
    """
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
