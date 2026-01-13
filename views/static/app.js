// CommandNote JavaScript

// Global state
let currentNode = null;
let currentParentId = null;
let isEditing = false;
let editingNodeId = null;

// Initialize after page load
document.addEventListener('DOMContentLoaded', () => {
    // Wait for pywebview API to be ready
    window.addEventListener('pywebviewready', () => {
        initApp();
        bindEvents();
    });
});

// Initialize application
async function initApp() {
    try {
        await loadTree();
    } catch (error) {
        console.error('Initialization failed:', error);
        showError('Application initialization failed');
    }
}

// Bind events
function bindEvents() {
    // New folder button
    document.getElementById('addFolderBtn').addEventListener('click', () => {
        openFolderModal();
    });

    // New command button
    document.getElementById('addCommandBtn').addEventListener('click', () => {
        if (!currentNode || currentNode.node_type !== 'folder') {
            showError('Please select a folder first');
            return;
        }
        openCommandModal();
    });

    // Edit button
    document.getElementById('editBtn').addEventListener('click', () => {
        if (!currentNode) return;
        if (currentNode.node_type === 'folder') {
            openFolderModal(true);
        } else {
            openCommandModal(true);
        }
    });

    // Delete button
    document.getElementById('deleteBtn').addEventListener('click', async () => {
        if (!currentNode) return;
        if (confirm(`Are you sure you want to delete "${currentNode.name}"?`)) {
            await deleteNode(currentNode.id);
        }
    });

    // Search button
    document.getElementById('searchBtn').addEventListener('click', () => {
        performSearch();
    });

    // Search input enter key
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Modal close button
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.classList.remove('show');
            }
        });
    });

    // 目录表单提交
    document.getElementById('folderForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveFolderForm();
    });

    // 命令表单提交
    document.getElementById('commandForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveCommandForm();
    });
}

// 加载树状结构
async function loadTree() {
    try {
        const tree = await pywebview.api.get_tree();
        renderTree(tree);
    } catch (error) {
        console.error('加载树失败:', error);
        showError('加载数据失败');
    }
}

// Render tree structure
function renderTree(node, parentElement = null, level = 0) {
    if (!parentElement) {
        parentElement = document.getElementById('treeView');
        parentElement.innerHTML = '';
    }

    // Don't render root node itself, only its children
    if (level === 0) {
        node.children.forEach(child => {
            renderTree(child, parentElement, level + 1);
        });
        return;
    }

    const nodeDiv = document.createElement('div');
    nodeDiv.className = `tree-node ${node.node_type}`;
    nodeDiv.style.paddingLeft = `${level * 16}px`;
    
    const icon = node.node_type === 'folder' ? '📁' : '📝';
    nodeDiv.innerHTML = `<span class="icon">${icon}</span>${node.name}`;
    
    nodeDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        selectNode(node);
    });

    parentElement.appendChild(nodeDiv);

    // Recursively render child nodes
    if (node.node_type === 'folder' && node.children.length > 0) {
        node.children.forEach(child => {
            renderTree(child, parentElement, level + 1);
        });
    }
}

// Select node
async function selectNode(node) {
    currentNode = node;
    
    // Update selected state
    document.querySelectorAll('.tree-node').forEach(el => {
        el.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    // Display node content
    await displayNodeContent(node);

    // Update button state
    updateActionButtons();
}

// Display node content
async function displayNodeContent(node) {
    const contentArea = document.getElementById('contentArea');
    const contentTitle = document.getElementById('contentTitle');

    contentTitle.textContent = node.name;

    if (node.node_type === 'folder') {
        // Display folder content (child nodes list)
        const children = node.children || [];
        let html = `
            <div class="command-detail">
                <h2>📁 ${node.name}</h2>
                ${node.description ? `<p>${node.description}</p>` : ''}
                <div class="info-group">
                    <div class="info-label">Contains:</div>
                    <ul>
                        ${children.map(child => {
                            const icon = child.node_type === 'folder' ? '📁' : '📝';
                            return `<li>${icon} ${child.name}</li>`;
                        }).join('') || '<li>No content</li>'}
                    </ul>
                </div>
            </div>
        `;
        contentArea.innerHTML = html;
    } else {
        // Display command details
        let html = `
            <div class="command-detail">
                <h2>📝 ${node.name}</h2>
                ${node.description ? `
                    <div class="info-group">
                        <div class="info-label">描述</div>
                        <div class="info-content">${node.description}</div>
                    </div>
                ` : ''}
                <div class="info-group">
                    <div class="info-label">命令内容</div>
                    <div class="info-content command-code">${node.content}</div>
                </div>
                <div class="info-group">
                    <div class="info-label">创建时间</div>
                    <div class="info-content">${formatDate(node.created_at)}</div>
                </div>
                <div class="info-group">
                    <div class="info-label">更新时间</div>
                    <div class="info-content">${formatDate(node.updated_at)}</div>
                </div>
            </div>
        `;
        contentArea.innerHTML = html;
    }
}

// 更新操作按钮状态
function updateActionButtons() {
    const editBtn = document.getElementById('editBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const addCommandBtn = document.getElementById('addCommandBtn');

    if (currentNode) {
        editBtn.style.display = 'inline-block';
        deleteBtn.style.display = 'inline-block';
        
        if (currentNode.node_type === 'folder') {
            addCommandBtn.style.display = 'inline-block';
        } else {
            addCommandBtn.style.display = 'none';
        }
    } else {
        editBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
        addCommandBtn.style.display = 'none';
    }
}

// Open folder modal
function openFolderModal(editing = false) {
    const modal = document.getElementById('folderModal');
    const title = document.getElementById('folderModalTitle');
    const nameInput = document.getElementById('folderName');
    const descInput = document.getElementById('folderDescription');

    isEditing = editing;

    if (editing && currentNode) {
        title.textContent = 'Edit Folder';
        nameInput.value = currentNode.name;
        descInput.value = currentNode.description || '';
        editingNodeId = currentNode.id;
    } else {
        title.textContent = 'New Folder';
        nameInput.value = '';
        descInput.value = '';
        editingNodeId = null;
    }

    modal.classList.add('show');
}

// Open command modal
function openCommandModal(editing = false) {
    const modal = document.getElementById('commandModal');
    const title = document.getElementById('commandModalTitle');
    const nameInput = document.getElementById('commandName');
    const contentInput = document.getElementById('commandContent');
    const descInput = document.getElementById('commandDescription');

    isEditing = editing;

    if (editing && currentNode) {
        title.textContent = 'Edit Command';
        nameInput.value = currentNode.name;
        contentInput.value = currentNode.content || '';
        descInput.value = currentNode.description || '';
        editingNodeId = currentNode.id;
    } else {
        title.textContent = 'New Command';
        nameInput.value = '';
        contentInput.value = '';
        descInput.value = '';
        editingNodeId = null;
    }

    modal.classList.add('show');
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
}

// Save folder form
async function saveFolderForm() {
    const name = document.getElementById('folderName').value.trim();
    const description = document.getElementById('folderDescription').value.trim();

    if (!name) {
        showError('Please enter folder name');
        return;
    }

    try {
        if (isEditing && editingNodeId) {
            // Update
            const result = await pywebview.api.update_node(editingNodeId, name, null, description);
            if (result.success) {
                closeModal('folderModal');
                await loadTree();
                showSuccess('Folder updated successfully');
            } else {
                showError(result.error || 'Update failed');
            }
        } else {
            // Create
            const parentId = currentNode ? currentNode.id : (await pywebview.api.get_tree()).id;
            const result = await pywebview.api.create_folder(parentId, name, description);
            if (result.success) {
                closeModal('folderModal');
                await loadTree();
                showSuccess('Folder created successfully');
            } else {
                showError(result.error || 'Creation failed');
            }
        }
    } catch (error) {
        console.error('Save failed:', error);
        showError('Operation failed');
    }
}

// Save command form
async function saveCommandForm() {
    const name = document.getElementById('commandName').value.trim();
    const content = document.getElementById('commandContent').value.trim();
    const description = document.getElementById('commandDescription').value.trim();

    if (!name || !content) {
        showError('Please enter command name and content');
        return;
    }

    try {
        if (isEditing && editingNodeId) {
            // Update
            const result = await pywebview.api.update_node(editingNodeId, name, content, description);
            if (result.success) {
                closeModal('commandModal');
                await loadTree();
                showSuccess('Command updated successfully');
            } else {
                showError(result.error || 'Update failed');
            }
        } else {
            // Create
            if (!currentNode || currentNode.node_type !== 'folder') {
                showError('Please select a folder first');
                return;
            }
            const result = await pywebview.api.create_command(currentNode.id, name, content, description);
            if (result.success) {
                closeModal('commandModal');
                await loadTree();
                showSuccess('Command created successfully');
            } else {
                showError(result.error || 'Creation failed');
            }
        }
    } catch (error) {
        console.error('Save failed:', error);
        showError('Operation failed');
    }
}

// Delete node
async function deleteNode(nodeId) {
    try {
        const result = await pywebview.api.delete_node(nodeId);
        if (result.success) {
            currentNode = null;
            await loadTree();
            document.getElementById('contentArea').innerHTML = `
                <div class="welcome-message">
                    <h2>已删除</h2>
                    <p>请选择其他项目查看</p>
                </div>
            `;
            updateActionButtons();
            showSuccess('删除成功');
        } else {
            showError(result.error || '删除失败');
        }
    } catch (error) {
        console.error('删除失败:', error);
        showError('删除失败');
    }
}

// 执行搜索
async function performSearch() {
    const keyword = document.getElementById('searchInput').value.trim();
    if (!keyword) {
        await loadTree();
        return;
    }

    try {
        const results = await pywebview.api.search(keyword);
        displaySearchResults(results, keyword);
    } catch (error) {
        console.error('搜索失败:', error);
        showError('搜索失败');
    }
}

// Display search results
function displaySearchResults(results, keyword) {
    const contentArea = document.getElementById('contentArea');
    const contentTitle = document.getElementById('contentTitle');

    contentTitle.textContent = `Search Results: "${keyword}"`;

    if (results.length === 0) {
        contentArea.innerHTML = `
            <div class="welcome-message">
                <h2>😔 No Results Found</h2>
                <p>No commands found containing "${keyword}"</p>
            </div>
        `;
        return;
    }

    let html = `
        <div class="command-detail">
            <h2>Found ${results.length} result(s)</h2>
            <div class="info-group">
    `;

    results.forEach(cmd => {
        html += `
            <div style="margin-bottom: 20px; padding: 16px; border: 1px solid #e0e0e0; border-radius: 4px;">
                <h3>📝 ${cmd.name}</h3>
                ${cmd.description ? `<p style="color: #666; margin: 8px 0;">${cmd.description}</p>` : ''}
                <div style="background-color: #2d2d2d; color: #f8f8f2; padding: 12px; border-radius: 4px; margin-top: 8px;">
                    <code>${cmd.content}</code>
                </div>
            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;

    contentArea.innerHTML = html;
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US');
}

function showError(message) {
    alert('❌ ' + message);
}

function showSuccess(message) {
    alert('✅ ' + message);
}
