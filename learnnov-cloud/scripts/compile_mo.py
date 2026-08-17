import os
import struct
import re

def generate_mo(po_path, mo_path):
    with open(po_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    pattern = re.compile(r'msgid "(.*?)"\nmsgstr "(.*?)"', re.DOTALL)
    messages = {}
    for match in pattern.finditer(content):
        msgid = match.group(1).replace('"\n"', '')
        msgstr = match.group(2).replace('"\n"', '')
        messages[msgid] = msgstr

    header = (
        "Project-Id-Version: LearnNov 1.0\n"
        "MIME-Version: 1.0\n"
        "Content-Type: text/plain; charset=UTF-8\n"
        "Content-Transfer-Encoding: 8bit\n"
        "Plural-Forms: nplurals=6; plural=n==0 ? 0 : n==1 ? 1 : n==2 ? 2 : n%100>=3 && n%100<=10 ? 3 : n%100>=11 && n%100<=99 ? 4 : 5;\n"
    )
    messages[""] = header

    keys = sorted(messages.keys())
    offsets = []
    ids = b''
    strs = b''
    for key in keys:
        val = messages[key]
        offsets.append((len(ids), len(key.encode('utf-8')), len(strs), len(val.encode('utf-8'))))
        ids += key.encode('utf-8') + b'\x00'
        strs += val.encode('utf-8') + b'\x00'

    keystart = 7 * 4 + 4 * 4 * len(keys)
    valuestart = keystart + len(ids)
    koffsets = []
    voffsets = []
    for o1, l1, o2, l2 in offsets:
        koffsets += [l1, keystart + o1]
        voffsets += [l2, valuestart + o2]

    output = struct.pack('Iiiiiii', 0x950412de, 0, len(keys), 7 * 4, 7 * 4 + 2 * 4 * len(keys), 0, 0)
    output += struct.pack(str(2 * len(keys)) + 'i', *koffsets)
    output += struct.pack(str(2 * len(keys)) + 'i', *voffsets)
    output += ids
    output += strs

    os.makedirs(os.path.dirname(mo_path), exist_ok=True)
    with open(mo_path, 'wb') as f:
        f.write(output)
    print(f"Successfully compiled {len(keys)} entries into {mo_path}")

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    po = os.path.join(base_dir, 'locale', 'ar', 'LC_MESSAGES', 'django.po')
    mo = os.path.join(base_dir, 'locale', 'ar', 'LC_MESSAGES', 'django.mo')
    generate_mo(po, mo)
