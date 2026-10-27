# Points apt at Ubuntu's canonical archive over HTTPS. Downloads from the
# runner's Azure mirror stalled the browser dependency installs (0.10.5).
from pathlib import Path

directory = Path('/etc/apt/sources.list.d')
sources = [Path('/etc/apt/sources.list'), *directory.glob('*.list'), *directory.glob('*.sources'), *Path('/etc/apt').glob('apt-mirrors*.txt')]
changed = 0
for source in sources:
    if not source.is_file():
        continue
    before = source.read_text()
    after = before.replace('azure.archive.ubuntu.com', 'archive.ubuntu.com').replace('http://archive.ubuntu.com/ubuntu', 'https://archive.ubuntu.com/ubuntu').replace('http://security.ubuntu.com/ubuntu', 'https://security.ubuntu.com/ubuntu')
    if after != before:
        source.write_text(after)
        changed += 1
assert all('azure.archive.ubuntu.com' not in source.read_text() for source in sources if source.is_file()), 'Azure mirror remains in an apt source'
print(f'Updated Ubuntu archive mirror in {changed} source file(s).')
