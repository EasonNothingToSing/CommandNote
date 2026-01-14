# CommandNote

A command note tool built with MVC architecture using PyWebView for desktop application interface.

## ✨ Features

- 📁 **Tree Directory Structure**: Support multi-level directory nesting for clear command organization
- 📝 **Command Management**: Create, edit, and delete command notes
- 🔍 **Quick Search**: Quickly find commands by keywords
- 💾 **Data Persistence**: Automatically save to local JSON files
- 🎨 **Modern Interface**: Desktop application experience based on PyWebView

## 🏗️ Architecture Design

Classic MVC (Model-View-Controller) architecture:

```
CommandNote/
├── models/              # Model layer: data models and management
│   ├── command_node.py  # Tree-structured node model
│   └── data_manager.py  # Data persistence management
├── controllers/         # Control layer: business logic
│   └── command_controller.py  # Command controller
├── views/              # View layer: user interface
│   ├── webview_app.py  # PyWebView application
│   └── static/         # Frontend resources
│       ├── index.html  # Main interface
│       ├── style.css   # Stylesheet
│       └── app.js      # Frontend logic
├── data/               # Data storage directory
│   └── commands.json   # Command data file
└── main.py            # Application entry point
```

## 🚀 Quick Start

### Requirements

- Python >= 3.12
- UV package manager (already installed)
- PyWebView (already installed)

### Run Application

```bash
# Using UV
uv run python main.py

# Or using Python directly
python main.py
```

## 📖 Usage Guide

1. **Create Directory**: Click "+ New Directory" button on the left, enter directory name and description
2. **Create Command**: After selecting a directory, click "+ New Command" button in the top right
3. **View Command**: Click on a command in the left tree list to view details
4. **Edit/Delete**: Select a node and use the edit or delete button in the top right
5. **Search Commands**: Enter keywords in the left search box, supports searching command names, content, and descriptions

## 🔧 Technology Stack

- **Backend**: Python
- **UI Framework**: PyWebView
- **Frontend**: HTML + CSS + JavaScript
- **Data Storage**: JSON file
- **Package Manager**: UV

## 📝 Data Structure

Each node (folder or command) contains the following fields:

```python
{
    "id": "Unique identifier",
    "name": "Node name",
    "node_type": "folder or command",
    "content": "Command content (only for command type)",
    "description": "Description information",
    "parent_id": "Parent node ID",
    "children": [],  # Child node list
    "created_at": "Creation time",
    "updated_at": "Update time"
}
```

## 🎯 Future Optimization Suggestions

- [ ] Add command tagging feature
- [ ] Support one-click copy to clipboard
- [ ] Import/Export functionality
- [ ] Command execution history
- [ ] Support code highlighting
- [ ] Add keyboard shortcuts
- [ ] Support drag-and-drop sorting

## 📄 License

MIT License

