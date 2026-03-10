from bs4 import BeautifulSoup
import os

html_path = 'dashboard_index.html'

with open(html_path, 'r', encoding='utf-8') as f:
    html_content = f.read()

soup = BeautifulSoup(html_content, 'html.parser')

sections = soup.find_all('section', class_='view-section')
os.makedirs('views', exist_ok=True)

for section in sections:
    section_id = section.get('id')
    if not section_id: continue
    
    # Save inner content
    inner_html = "\n".join([str(tag) for tag in section.contents])
    with open(f'views/{section_id}.html', 'w', encoding='utf-8') as sf:
        sf.write(inner_html)
    
    # Clear section and add data-view attribute
    section.clear()
    section['data-view'] = f'views/{section_id}.html'

# Overwrite index html
with open(html_path, 'w', encoding='utf-8') as f:
    f.write(str(soup))

print(f"Extracted {len(sections)} sections into 'views/' directory.")
