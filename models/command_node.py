"""Command Node Model - Tree structure node model"""

from typing import List, Optional, Dict, Any
from dataclasses import dataclass, field
from datetime import datetime
import uuid


@dataclass
class CommandNode:
    """
    Command node class supporting tree structure.
    Can be either a folder or a command.
    """
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    node_type: str = "folder"  # "folder" or "command"
    content: str = ""  # Command content (only used by command type)
    description: str = ""  # Description
    parent_id: Optional[str] = None
    children: List['CommandNode'] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now().isoformat())
    
    def is_folder(self) -> bool:
        """Check if node is a folder"""
        return self.node_type == "folder"
    
    def is_command(self) -> bool:
        """Check if node is a command"""
        return self.node_type == "command"
    
    def add_child(self, child: 'CommandNode') -> None:
        """Add child node"""
        child.parent_id = self.id
        self.children.append(child)
        self.updated_at = datetime.now().isoformat()
    
    def remove_child(self, child_id: str) -> bool:
        """Remove child node"""
        for i, child in enumerate(self.children):
            if child.id == child_id:
                self.children.pop(i)
                self.updated_at = datetime.now().isoformat()
                return True
        return False
    
    def find_child_by_id(self, child_id: str) -> Optional['CommandNode']:
        """Find child node by ID"""
        for child in self.children:
            if child.id == child_id:
                return child
        return None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format"""
        return {
            'id': self.id,
            'name': self.name,
            'node_type': self.node_type,
            'content': self.content,
            'description': self.description,
            'parent_id': self.parent_id,
            'children': [child.to_dict() for child in self.children],
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'CommandNode':
        """Create node from dictionary"""
        children_data = data.pop('children', [])
        node = cls(**data)
        node.children = [cls.from_dict(child_data) for child_data in children_data]
        return node
    
    def get_path(self) -> str:
        """Get node path (for display)"""
        # This method needs to traverse to root node, temporarily returning name
        return self.name
