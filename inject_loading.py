import os
import glob

html_files = glob.glob('*.html')

head_injection = '    <link rel="stylesheet" href="css/loading.css">\n'
scripts_injection = '''    <!-- Contextual Loading System -->
    <script src="js/loading/loading-messages.js"></script>
    <script src="js/loading/loading-manager.js"></script>
    <script src="js/loading-screen.js"></script>
'''

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    modified = False

    # 1. Inject CSS
    if 'css/loading.css' not in content:
        # Find closing </head>
        content = content.replace('</head>', head_injection + '</head>')
        modified = True

    # 2. Inject Scripts before page-transition.js
    if 'js/loading/loading-manager.js' not in content:
        # Replace <script src="js/page-transition.js">
        content = content.replace(
            '<script src="js/page-transition.js"></script>',
            scripts_injection + '    <script src="js/page-transition.js"></script>'
        )
        modified = True

    if modified:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file}")
