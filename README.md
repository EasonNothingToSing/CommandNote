# CommandNote

一个基于 MVC 架构的命令笔记工具，使用 PyWebView 构建桌面应用界面。

## ✨ 功能特性

- 📁 **树状目录结构**：支持多级目录嵌套，清晰组织命令
- 📝 **命令管理**：创建、编辑、删除命令笔记
- 🔍 **快速搜索**：根据关键词快速查找命令
- 💾 **数据持久化**：自动保存到本地 JSON 文件
- 🎨 **现代化界面**：基于 PyWebView 的桌面应用体验

## 🏗️ 架构设计

采用经典的 MVC（Model-View-Controller）架构：

```
CommandNote/
├── models/              # 模型层：数据模型和数据管理
│   ├── command_node.py  # 树状节点模型
│   └── data_manager.py  # 数据持久化管理
├── controllers/         # 控制层：业务逻辑处理
│   └── command_controller.py  # 命令控制器
├── views/              # 视图层：用户界面
│   ├── webview_app.py  # PyWebView 应用
│   └── static/         # 前端资源
│       ├── index.html  # 主界面
│       ├── style.css   # 样式表
│       └── app.js      # 前端逻辑
├── data/               # 数据存储目录
│   └── commands.json   # 命令数据文件
└── main.py            # 应用入口
```

## 🚀 快速开始

### 环境要求

- Python >= 3.12
- UV 包管理器（已安装）
- PyWebView（已安装）

### 运行应用

```bash
# 使用 UV 运行
uv run python main.py

# 或者使用 Python 直接运行
python main.py
```

## 📖 使用说明

1. **创建目录**：点击左侧 "+ 新建目录" 按钮，输入目录名称和描述
2. **创建命令**：选中一个目录后，点击右上角 "+ 新建命令" 按钮
3. **查看命令**：点击左侧树形列表中的命令即可查看详情
4. **编辑/删除**：选中节点后，使用右上角的编辑或删除按钮
5. **搜索命令**：在左侧搜索框输入关键词，支持搜索命令名称、内容和描述

## 🔧 技术栈

- **后端**：Python
- **UI 框架**：PyWebView
- **前端**：HTML + CSS + JavaScript
- **数据存储**：JSON 文件
- **包管理**：UV

## 📝 数据结构

每个节点（目录或命令）包含以下字段：

```python
{
    "id": "唯一标识符",
    "name": "节点名称",
    "node_type": "folder 或 command",
    "content": "命令内容（仅命令类型）",
    "description": "描述信息",
    "parent_id": "父节点ID",
    "children": [],  # 子节点列表
    "created_at": "创建时间",
    "updated_at": "更新时间"
}
```

## 🎯 后续优化建议

- [ ] 添加命令标签功能
- [ ] 支持命令一键复制到剪贴板
- [ ] 导入/导出功能
- [ ] 命令执行历史记录
- [ ] 支持代码高亮
- [ ] 添加快捷键支持
- [ ] 支持拖拽排序

## 📄 许可证

MIT License

