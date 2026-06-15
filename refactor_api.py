import re

with open('src/api.ts', 'r', encoding='utf-8') as f:
    content = f.read()

helper = '''
const handleResponse = async (res: Response, defaultError: string) => {
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      window.dispatchEvent(new CustomEvent('auth-expired'));
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || defaultError);
  }
  return res.json();
};
'''

if 'handleResponse' not in content:
    content = content.replace('export const api = {', helper + '\nexport const api = {')

    pattern = re.compile(r'if \(!res\.ok\) \{[\s\S]*?throw new Error\([^)]*\);?\s*\}[\s\S]*?return (?:await )?res\.json\(\);')

    def replacer(match):
        m = re.search(r'throw new Error\([^\|]*\|\|\s*(.+?)\);', match.group(0))
        if m:
            defaultError = m.group(1).strip()
        else:
            m2 = re.search(r'throw new Error\((.+?)\);', match.group(0))
            defaultError = m2.group(1).strip() if m2 else "'API Error'"
        
        return f'return handleResponse(res, {defaultError});'

    content = pattern.sub(replacer, content)

    with open('src/api.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Refactored api.ts")
else:
    print("Already refactored")
