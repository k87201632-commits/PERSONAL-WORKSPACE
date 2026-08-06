import os
import re

target_dir = r"C:\Users\ridho\.gemini\antigravity\scratch\personal-portfolio\PERSONAL-WORKSPACE"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Remove the Tambah Tugas button
    # <button class="btn btn-primary" onclick="window.subjectPage.openCreateModal()" style="flex-shrink:0; margin-top:0.5rem;">
    #     + Tambah Tugas
    # </button>
    content = re.sub(
        r'<button[^>]*onclick="window\.subjectPage\.openCreateModal\(\)"[^>]*>.*?Tambahs*Tugas.*?</button>',
        '', content, flags=re.IGNORECASE | re.DOTALL)
    
    # Also <a href="tugas.html" style="font-size: 0.75rem; font-weight: 700; color: var(--accent-primary);">+ Tambah Tugas</a>
    content = re.sub(
        r'<a[^>]*href="tugas\.html"[^>]*>.*?Tambahs*Tugas.*?</a>',
        '', content, flags=re.IGNORECASE | re.DOTALL)

    # In tugas.html:
    # <button class="btn btn-primary" onclick="window.tasksManager.openCreateModal()">
    #    + Tambah Tugas
    # </button>
    content = re.sub(
        r'<button[^>]*onclick="window\.tasksManager\.openCreateModal\(\)"[^>]*>.*?Tambahs*Tugas.*?</button>',
        '', content, flags=re.IGNORECASE | re.DOTALL)

    # Remove edit and delete buttons in the JS templates
    # onclick="window.subjectPage.openEditModal(${task.id})"
    # onclick="window.subjectPage.deleteTask(${task.id})"
    # In JS:
    content = re.sub(
        r'<button[^>]*onclick="window\.subjectPage\.openEditModal[^>]*>.*?</button>',
        '', content, flags=re.IGNORECASE | re.DOTALL)
    content = re.sub(
        r'<button[^>]*onclick="window\.subjectPage\.deleteTask[^>]*>.*?</button>',
        '', content, flags=re.IGNORECASE | re.DOTALL)
    
    content = re.sub(
        r'<button[^>]*onclick="window\.tasksManager\.openEditModal[^>]*>.*?</button>',
        '', content, flags=re.IGNORECASE | re.DOTALL)
    content = re.sub(
        r'<button[^>]*onclick="window\.tasksManager\.deleteTask[^>]*>.*?</button>',
        '', content, flags=re.IGNORECASE | re.DOTALL)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filepath}")

for root, _, files in os.walk(target_dir):
    for file in files:
        if file.endswith('.html') or file.endswith('.js'):
            process_file(os.path.join(root, file))
