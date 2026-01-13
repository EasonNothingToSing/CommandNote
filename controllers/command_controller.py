"""Command Controller - Business logic controller"""

from typing import List, Dict, Any, Optional
from models import CommandNode, DataManager
from datetime import datetime


class CommandController:
    """Command controller that handles all business logic"""
    
    def __init__(self):
        """Initialize controller"""
        self.data_manager = DataManager()
    
    # ========== Query Operations ==========
    
    def get_tree_structure(self) -> Dict[str, Any]:
        """
        获取完整树状结构
        
        Returns:
            树状结构的字典表示
        """
        root = self.data_manager.get_root()
        return root.to_dict()
    
    def get_node_by_id(self, node_id: str) -> Optional[Dict[str, Any]]:
        """
        根据ID获取节点信息
        
        Args:
            node_id: 节点ID
        
        Returns:
            节点信息字典，或None
        """
        node = self.data_manager.find_node_by_id(node_id)
        if node:
            return node.to_dict()
        return None
    
    def get_children(self, node_id: str) -> List[Dict[str, Any]]:
        """
        获取指定节点的所有子节点
        
        Args:
            node_id: 父节点ID
        
        Returns:
            子节点列表
        """
        node = self.data_manager.find_node_by_id(node_id)
        if node:
            return [child.to_dict() for child in node.children]
        return []
    
    def search_commands(self, keyword: str) -> List[Dict[str, Any]]:
        """
        Search commands
        
        Args:
            keyword: Search keyword
        
        Returns:
            List of matching commands
        """
        all_nodes = self.data_manager.get_all_nodes()
        results = []
        
        keyword_lower = keyword.lower()
        for node in all_nodes:
            if node.is_command():
                if (keyword_lower in node.name.lower() or 
                    keyword_lower in node.content.lower() or 
                    keyword_lower in node.description.lower()):
                    results.append(node.to_dict())
        
        return results
    
    # ========== Create Operations ==========
    
    def create_folder(self, parent_id: str, name: str, description: str = "") -> Dict[str, Any]:
        """
        Create folder
        
        Args:
            parent_id: Parent node ID
            name: Folder name
            description: Description
        
        Returns:
            Created folder information
        """
        parent = self.data_manager.find_node_by_id(parent_id)
        if not parent:
            raise ValueError(f"Parent node does not exist: {parent_id}")
        
        if not parent.is_folder():
            raise ValueError("Can only create child nodes under folders")
        
        new_folder = CommandNode(
            name=name,
            node_type="folder",
            description=description
        )
        
        parent.add_child(new_folder)
        self.data_manager.save_data()
        
        return new_folder.to_dict()
    
    def create_command(self, parent_id: str, name: str, content: str, description: str = "") -> Dict[str, Any]:
        """
        Create command
        
        Args:
            parent_id: Parent node ID
            name: Command name
            content: Command content
            description: Description
        
        Returns:
            Created command information
        """
        parent = self.data_manager.find_node_by_id(parent_id)
        if not parent:
            raise ValueError(f"Parent node does not exist: {parent_id}")
        
        if not parent.is_folder():
            raise ValueError("Can only create commands under folders")
        
        new_command = CommandNode(
            name=name,
            node_type="command",
            content=content,
            description=description
        )
        
        parent.add_child(new_command)
        self.data_manager.save_data()
        
        return new_command.to_dict()
    
    # ========== Update Operations ==========
    
    def update_node(self, node_id: str, name: str = None, content: str = None, description: str = None) -> Dict[str, Any]:
        """
        更新节点信息
        
        Args:
            node_id: 节点ID
            name: 新名称（可选）
            content: 新内容（可选，仅命令节点）
            description: 新描述（可选）
        
        Returns:
            更新后的节点信息
        """
        node = self.data_manager.find_node_by_id(node_id)
        if not node:
            raise ValueError(f"节点不存在: {node_id}")
        
        if name is not None:
            node.name = name
        
        if content is not None and node.is_command():
            node.content = content
        
        if description is not None:
            node.description = description
        
        node.updated_at = datetime.now().isoformat()
        self.data_manager.save_data()
        
        return node.to_dict()
    
    # ========== 删除操作 ==========
    
    def delete_node(self, node_id: str) -> bool:
        """
        删除节点
        
        Args:
            node_id: 要删除的节点ID
        
        Returns:
            是否删除成功
        """
        # 不能删除根节点
        root = self.data_manager.get_root()
        if root.id == node_id:
            raise ValueError("不能删除根节点")
        
        # 找到节点的父节点并删除
        all_nodes = self.data_manager.get_all_nodes()
        for node in all_nodes:
            if node.is_folder():
                if node.remove_child(node_id):
                    self.data_manager.save_data()
                    return True
        
        return False
    
    # ========== Move Operations ==========
    
    def move_node(self, node_id: str, new_parent_id: str) -> Dict[str, Any]:
        """
        Move node to new parent node
        
        Args:
            node_id: ID of node to move
            new_parent_id: New parent node ID
        
        Returns:
            Moved node information
        """
        node = self.data_manager.find_node_by_id(node_id)
        new_parent = self.data_manager.find_node_by_id(new_parent_id)
        
        if not node:
            raise ValueError(f"Node does not exist: {node_id}")
        if not new_parent:
            raise ValueError(f"New parent node does not exist: {new_parent_id}")
        if not new_parent.is_folder():
            raise ValueError("Target node must be a folder")
        if node.id == new_parent.id:
            raise ValueError("Cannot move to itself")
        
        # Delete from original parent node
        if not self.delete_node(node_id):
            raise ValueError("Unable to delete node from original location")
        
        # Add to new parent node
        new_parent.add_child(node)
        self.data_manager.save_data()
        
        return node.to_dict()
    
    # ========== Duplicate Operations ==========
    
    def duplicate_node(self, node_id: str) -> Dict[str, Any]:
        """
        Duplicate a node (creates a copy in the same parent)
        
        Args:
            node_id: ID of node to duplicate
        
        Returns:
            Duplicated node information
        """
        node = self.data_manager.find_node_by_id(node_id)
        if not node:
            raise ValueError(f"Node does not exist: {node_id}")
        
        # Find parent node
        parent = None
        all_nodes = self.data_manager.get_all_nodes()
        for n in all_nodes:
            if n.is_folder() and any(child.id == node_id for child in n.children):
                parent = n
                break
        
        if not parent:
            raise ValueError("Cannot find parent node")
        
        # Create duplicate with modified name
        duplicate_name = f"{node.name} (Copy)"
        
        if node.is_folder():
            new_node = CommandNode(
                name=duplicate_name,
                node_type="folder",
                description=node.description
            )
            # Recursively copy children
            for child in node.children:
                self._duplicate_child(child, new_node)
        else:
            new_node = CommandNode(
                name=duplicate_name,
                node_type="command",
                content=node.content,
                description=node.description
            )
        
        parent.add_child(new_node)
        self.data_manager.save_data()
        
        return new_node.to_dict()
    
    def _duplicate_child(self, child: CommandNode, parent: CommandNode) -> None:
        """
        Helper method to recursively duplicate child nodes
        
        Args:
            child: Child node to duplicate
            parent: Parent node to add to
        """
        if child.is_folder():
            new_child = CommandNode(
                name=child.name,
                node_type="folder",
                description=child.description
            )
            for grandchild in child.children:
                self._duplicate_child(grandchild, new_child)
        else:
            new_child = CommandNode(
                name=child.name,
                node_type="command",
                content=child.content,
                description=child.description
            )
        
        parent.add_child(new_child)
