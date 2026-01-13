"""Data Manager - Data persistence management"""

import json
import os
from typing import Optional, List
from pathlib import Path
from .command_node import CommandNode


class DataManager:
    """Data manager responsible for reading and saving data"""
    
    def __init__(self, data_file: str = None):
        """
        Initialize data manager
        
        Args:
            data_file: Data file path, defaults to data/commands.json in project directory
        """
        if data_file is None:
            # Get project root directory
            project_root = Path(__file__).parent.parent
            data_dir = project_root / "data"
            data_dir.mkdir(exist_ok=True)
            data_file = str(data_dir / "commands.json")
        
        self.data_file = data_file
        self.root: Optional[CommandNode] = None
        self._load_data()
    
    def _load_data(self) -> None:
        """Load data from file"""
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if data:
                        self.root = CommandNode.from_dict(data)
                    else:
                        self._create_default_root()
            except (json.JSONDecodeError, Exception) as e:
                print(f"Failed to load data: {e}")
                self._create_default_root()
        else:
            self._create_default_root()
    
    def _create_default_root(self) -> None:
        """Create default root node"""
        self.root = CommandNode(
            name="Root",
            node_type="folder",
            description="Root directory"
        )
        # Create example data
        example_folder = CommandNode(
            name="Example Product",
            node_type="folder",
            description="This is an example product directory"
        )
        example_cmd = CommandNode(
            name="Check Version",
            node_type="command",
            content="python --version",
            description="Check Python version"
        )
        example_folder.add_child(example_cmd)
        self.root.add_child(example_folder)
        
        self.save_data()
    
    def save_data(self) -> bool:
        """Save data to file"""
        try:
            with open(self.data_file, 'w', encoding='utf-8') as f:
                json.dump(self.root.to_dict(), f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"Failed to save data: {e}")
            return False
    
    def get_root(self) -> CommandNode:
        """Get root node"""
        return self.root
    
    def find_node_by_id(self, node_id: str, current_node: Optional[CommandNode] = None) -> Optional[CommandNode]:
        """
        Find node by ID (recursive search)
        
        Args:
            node_id: Node ID
            current_node: Current search node, defaults to root node
        
        Returns:
            Found node, or None
        """
        if current_node is None:
            current_node = self.root
        
        if current_node.id == node_id:
            return current_node
        
        for child in current_node.children:
            result = self.find_node_by_id(node_id, child)
            if result:
                return result
        
        return None
    
    def get_all_nodes(self, current_node: Optional[CommandNode] = None) -> List[CommandNode]:
        """
        Get all nodes (flattened list)
        
        Args:
            current_node: Current node, defaults to root node
        
        Returns:
            List of all nodes
        """
        if current_node is None:
            current_node = self.root
        
        nodes = [current_node]
        for child in current_node.children:
            nodes.extend(self.get_all_nodes(child))
        
        return nodes
