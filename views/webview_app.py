"""WebView Application - PyWebView interface application"""

import webview
from pathlib import Path
from controllers import CommandController


class WebViewApp:
    """PyWebView application class"""
    
    def __init__(self):
        """Initialize application"""
        self.controller = None
        self.window = None
    
    def initialize_controller(self):
        """Initialize controller after window is ready"""
        if self.controller is None:
            self.controller = CommandController()
    
    # ========== API Methods (called by JavaScript) ==========
    
    def get_tree(self):
        """Get tree structure"""
        self.initialize_controller()
        return self.controller.get_tree_structure()
    
    def get_node(self, node_id):
        """Get node information"""
        self.initialize_controller()
        return self.controller.get_node_by_id(node_id)
    
    def get_children(self, node_id):
        """Get child nodes list"""
        self.initialize_controller()
        return self.controller.get_children(node_id)
    
    def search(self, keyword):
        """Search commands"""
        self.initialize_controller()
        return self.controller.search_commands(keyword)
    
    def create_folder(self, parent_id, name, description=""):
        """Create folder"""
        try:
            self.initialize_controller()
            return {"success": True, "data": self.controller.create_folder(parent_id, name, description)}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def create_command(self, parent_id, name, content, description=""):
        """Create command"""
        try:
            self.initialize_controller()
            return {"success": True, "data": self.controller.create_command(parent_id, name, content, description)}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def update_node(self, node_id, name=None, content=None, description=None):
        """Update node"""
        try:
            self.initialize_controller()
            return {"success": True, "data": self.controller.update_node(node_id, name, content, description)}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def delete_node(self, node_id):
        """Delete node"""
        try:
            self.initialize_controller()
            result = self.controller.delete_node(node_id)
            return {"success": result}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def move_node(self, node_id, new_parent_id):
        """Move node"""
        try:
            self.initialize_controller()
            return {"success": True, "data": self.controller.move_node(node_id, new_parent_id)}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def duplicate_node(self, node_id):
        """Duplicate node"""
        try:
            self.initialize_controller()
            return {"success": True, "data": self.controller.duplicate_node(node_id)}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ========== Application Startup ==========
    
    def run(self):
        """Start application"""
        # Get HTML file path
        html_path = Path(__file__).parent / "static" / "index.html"
        
        # Create and start window
        self.window = webview.create_window(
            title="CommandNote - Command Note Tool",
            url=str(html_path),
            width=1200,
            height=800,
            resizable=True,
            js_api=self  # Expose Python API to JavaScript
        )
        
        # Start application with GUI settings
        webview.start(debug=False, gui='edgechromium')
