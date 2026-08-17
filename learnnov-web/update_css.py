import re

def update_css():
    file_path = r'b:\LEARNNOV PLATFORM\learnnov-web\src\app\globals.css'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update variables in :root
    content = content.replace('--bg-color: #f8fafc;', '--bg-color: #ffffff;')
    content = content.replace('--accent: #0ea5e9;', '--accent: #2563eb;')
    
    # Update glass styles for white background readability
    content = content.replace('--glass-bg: rgba(255, 255, 255, 0.7);', '--glass-bg: rgba(255, 255, 255, 0.95);')
    content = content.replace('--glass-border: rgba(14, 165, 233, 0.12);', '--glass-border: rgba(37, 99, 235, 0.15);')
    
    # 2. Replace all other occurrences of the old blue rgb with the new one
    content = content.replace('rgba(14, 165, 233', 'rgba(37, 99, 235')
    
    # 3. Add responsive media queries at the end
    media_queries = """
/* Responsive Media Queries */
@media (max-width: 1024px) {
  .dashboard-container {
    padding: 3rem 1.5rem;
  }
  .drawer-content-split {
    flex-direction: column;
    overflow-y: auto;
  }
  .syllabus-tree-sidebar, .active-lesson-viewer {
    margin: 0.5rem;
    padding: 1.5rem;
    flex: none;
  }
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
    padding: 1.5rem;
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .courses-grid {
    grid-template-columns: 1fr;
  }
  .dashboard-container {
    padding: 2rem 1rem;
  }
  .stat-card {
    padding: 1.5rem;
  }
  .stat-value {
    font-size: 2.5rem;
  }
  .modal-backdrop {
    padding: 1rem;
  }
  .form-row {
    flex-direction: column;
    gap: 1rem;
  }
  .video-controls-bar {
    flex-wrap: wrap;
    gap: 1rem;
  }
  .video-progress-slider-container {
    width: 100%;
    order: 3;
    flex: none;
  }
  .pdf-lesson-viewer, .interactive-quiz-workspace, .text-lesson-article {
    padding: 1.5rem;
  }
  .syllabus-drawer {
    max-height: 100%;
    border-radius: 0;
  }
}
"""
    if "/* Responsive Media Queries */" not in content:
        content += media_queries

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("CSS updated successfully.")

if __name__ == "__main__":
    update_css()
