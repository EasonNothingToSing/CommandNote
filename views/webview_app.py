"""WebView Application - PyWebView interface application"""

import webview
from pathlib import Path
from controllers import CommandController


class WebViewApp:
    """PyWebView application class"""
    
    def __init__(self):
        """Initialize application"""
        self.controller = CommandController()
        self.window = None
    
    # ========== API Methods (called by JavaScript) ==========
    
    def get_tree(self):
        """Get tree structure"""
        return self.controller.get_tree_structure()
    
    def get_node(self, node_id):
        """Get node information"""
        return self.controller.get_node_by_id(node_id)
    
    def get_children(self, node_id):
        """Get child nodes list"""
        return self.controller.get_children(node_id)
    
    def search(self, keyword):
        """Search commands"""
        return self.controller.search_commands(keyword)
    
    def create_folder(self, parent_id, name, description=""):
        """Create folder"""
        try:
            return {"success": True, "data": self.controller.create_folder(parent_id, name, description)}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def create_command(self, parent_id, name, content, description=""):
        """Create command"""
        try:
            return {"success": True, "data": self.controller.create_command(parent_id, name, content, description)}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def update_node(self, node_id, name=None, content=None, description=None):
        """Update node"""
        try:
            return {"success": True, "data": self.controller.update_node(node_id, name, content, description)}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def delete_node(self, node_id):
        """Delete node"""
        try:
            result = self.controller.delete_node(node_id)
            return {"success": result}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def move_node(self, node_id, new_parent_id):
        """Move node"""
        try:
            return {"success": True, "data": self.controller.move_node(node_id, new_parent_id)}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ========== Application Startup ==========
    
    def run(self):
        """Start application"""
        # Get HTML file path
        html_path = Path(__file__).parent / "static" / "index.html"
        
        # Create window
        self.window = webview.create_window(
            title="CommandNote - Command Note Tool",
            url=str(html_path),
            width=1200,
            height=800,
            resizable=True,
            js_api=self  # Expose Python API to JavaScript
        )
        
        # Start application
        webview.start(debug=True)
