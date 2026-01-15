// CommandNote JavaScript

// Global state
let currentNode = null;
let currentParentId = null;
let isEditing = false;
let editingNodeId = null;
let expandedNodeIds = new Set(); // Track which folders are expanded

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
        // Create top-level folder if no folder is selected
        currentParentId = null;
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

    // Get button
    document.getElementById('getBtn').addEventListener('click', async () => {
        if (!currentNode || currentNode.node_type !== 'command') return;
        await copyCommandToClipboard(currentNode.content);
    });

    // Duplicate button
    document.getElementById('duplicateBtn').addEventListener('click', async () => {
        if (!currentNode || currentNode.node_type !== 'command') return;
        await duplicateCommand(currentNode.id);
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

    // Folder form submission
    document.getElementById('folderForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveFolderForm();
    });

    // Command form submission
    document.getElementById('commandForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveCommandForm();
    });

    // Tree view drop area for top-level folders
    const treeView = document.getElementById('treeView');
    treeView.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        treeView.classList.add('drag-over-empty');
    });

    treeView.addEventListener('dragleave', (e) => {
        if (e.target === treeView) {
            treeView.classList.remove('drag-over-empty');
        }
    });

    treeView.addEventListener('drop', handleTreeViewDrop);
}

// Load tree structure
async function loadTree(expandNodeId = null) {
    try {
        // Save current expanded state before reloading
        saveExpandedState();
        // If a node should be expanded, add it to the set
        if (expandNodeId) {
            expandedNodeIds.add(expandNodeId);
        }
        const tree = await pywebview.api.get_tree();
        renderTree(tree);
        // Restore expanded state after rendering
        restoreExpandedState();
    } catch (error) {
        console.error('Failed to load tree:', error);
        showError('Failed to load data');
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
    nodeDiv.setAttribute('draggable', 'true');
    nodeDiv.setAttribute('data-node-id', node.id);
    nodeDiv.setAttribute('data-node-type', node.node_type);
    
    // Add collapse/expand button for folders with children
    let toggleButton = '';
    const isExpanded = expandedNodeIds.has(node.id);
    if (node.node_type === 'folder' && node.children && node.children.length > 0) {
        const arrowIcon = isExpanded ? '▼' : '▶';
        toggleButton = `<span class="toggle-btn" data-expanded="${isExpanded}">${arrowIcon}</span>`;
    } else if (node.node_type === 'folder') {
        toggleButton = `<span class="toggle-btn empty">•</span>`;
    }
    
    const icon = node.node_type === 'folder' ? '📁' : '📝';
    nodeDiv.innerHTML = `${toggleButton}<span class="icon">${icon}</span>${node.name}`;
    
    // Click event for toggle button
    const toggleBtn = nodeDiv.querySelector('.toggle-btn');
    if (toggleBtn && !toggleBtn.classList.contains('empty')) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleNodeChildren(nodeDiv, node);
        });
    }
    
    // Click event for node selection
    nodeDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        selectNode(node);
    });
    
    // Drag events
    nodeDiv.addEventListener('dragstart', handleDragStart);
    nodeDiv.addEventListener('dragend', handleDragEnd);
    nodeDiv.addEventListener('dragover', handleDragOver);
    nodeDiv.addEventListener('dragleave', handleDragLeave);
    nodeDiv.addEventListener('drop', handleDrop);

    parentElement.appendChild(nodeDiv);

    // Recursively render child nodes only if folder is expanded
    if (node.node_type === 'folder' && node.children.length > 0) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'children-container';
        childrenContainer.setAttribute('data-parent-id', node.id);
        
        // Apply collapsed state if not expanded
        if (!isExpanded) {
            childrenContainer.classList.add('collapsed');
        }
        
        node.children.forEach(child => {
            renderTree(child, childrenContainer, level + 1);
        });
        
        parentElement.appendChild(childrenContainer);
    }
}

// Toggle children visibility
function toggleNodeChildren(nodeElement, node) {
    const toggleBtn = nodeElement.querySelector('.toggle-btn');
    if (!toggleBtn) return;
    
    // Find the children container
    let childrenContainer = nodeElement.nextElementSibling;
    while (childrenContainer && !childrenContainer.classList.contains('children-container')) {
        childrenContainer = childrenContainer.nextElementSibling;
    }
    
    if (!childrenContainer) return;
    
    const isExpanded = toggleBtn.getAttribute('data-expanded') === 'true';
    
    if (isExpanded) {
        // Collapse
        childrenContainer.classList.add('collapsed');
        toggleBtn.textContent = '▶';
        toggleBtn.setAttribute('data-expanded', 'false');
        expandedNodeIds.delete(node.id);
    } else {
        // Expand
        childrenContainer.classList.remove('collapsed');
        toggleBtn.textContent = '▼';
        toggleBtn.setAttribute('data-expanded', 'true');
        expandedNodeIds.add(node.id);
    }
}

// Save current expanded state
function saveExpandedState() {
    expandedNodeIds.clear();
    document.querySelectorAll('.toggle-btn[data-expanded="true"]').forEach(toggleBtn => {
        const nodeElement = toggleBtn.closest('.tree-node');
        if (nodeElement) {
            const nodeId = nodeElement.getAttribute('data-node-id');
            if (nodeId) {
                expandedNodeIds.add(nodeId);
            }
        }
    });
}

// Restore expanded state after rendering
function restoreExpandedState() {
    // The state is automatically restored during renderTree() by checking expandedNodeIds
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
                        <div class="info-label">Description</div>
                        <div class="info-content">${node.description}</div>
                    </div>
                ` : ''}
                <div class="info-group">
                    <div class="info-label">Command Content</div>
                    <div class="info-content command-code">${node.content}</div>
                </div>
                <div class="info-group">
                    <div class="info-label">Created At</div>
                    <div class="info-content">${formatDate(node.created_at)}</div>
                </div>
                <div class="info-group">
                    <div class="info-label">Updated At</div>
                    <div class="info-content">${formatDate(node.updated_at)}</div>
                </div>
            </div>
        `;
        contentArea.innerHTML = html;
    }
}

// Update action buttons state
function updateActionButtons() {
    const editBtn = document.getElementById('editBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const addCommandBtn = document.getElementById('addCommandBtn');
    const getBtn = document.getElementById('getBtn');
    const duplicateBtn = document.getElementById('duplicateBtn');

    if (currentNode) {
        editBtn.style.display = 'inline-block';
        deleteBtn.style.display = 'inline-block';
        
        if (currentNode.node_type === 'folder') {
            addCommandBtn.style.display = 'inline-block';
            getBtn.style.display = 'none';
            duplicateBtn.style.display = 'none';
        } else {
            addCommandBtn.style.display = 'none';
            getBtn.style.display = 'inline-block';
            duplicateBtn.style.display = 'inline-block';
        }
    } else {
        editBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
        addCommandBtn.style.display = 'none';
        getBtn.style.display = 'none';
        duplicateBtn.style.display = 'none';
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
            let parentId;
            if (currentParentId) {
                // Explicitly set parent (top-level)
                parentId = currentParentId;
            } else if (currentNode && currentNode.node_type === 'folder') {
                // Use selected folder as parent
                parentId = currentNode.id;
            } else {
                // Use root as parent (top-level)
                const tree = await pywebview.api.get_tree();
                parentId = tree.id;
            }
            
            const result = await pywebview.api.create_folder(parentId, name, description);
            if (result.success) {
                closeModal('folderModal');
                // Reload tree and expand parent folder
                await loadTree(parentId);
                currentParentId = null; // Reset parent flag
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
                // Reload tree and expand parent folder
                await loadTree(currentNode.id);
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
                    <h2>Item Deleted</h2>
                    <p>Please select another item to view</p>
                </div>
            `;
            updateActionButtons();
            showSuccess('Item deleted successfully');
        } else {
            showError(result.error || 'Failed to delete item');
        }
    } catch (error) {
        console.error('Delete failed:', error);
        showError('Failed to delete item');
    }
}

// Perform search
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
        console.error('Search failed:', error);
        showError('Search failed');
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

// Copy command to clipboard
async function copyCommandToClipboard(content) {
    try {
        await navigator.clipboard.writeText(content);
        showSuccess('Command copied to clipboard!');
    } catch (error) {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = content;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showSuccess('Command copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy:', err);
            showError('Failed to copy command');
        }
        document.body.removeChild(textArea);
    }
}

// Duplicate command
async function duplicateCommand(nodeId) {
    try {
        const result = await pywebview.api.duplicate_node(nodeId);
        if (result.success) {
            await loadTree();
            showSuccess('Command duplicated successfully');
        } else {
            showError(result.error || 'Duplication failed');
        }
    } catch (error) {
        console.error('Duplication failed:', error);
        showError('Duplication failed');
    }
}

// Utility functions
let draggedNode = null;

function handleDragStart(e) {
    draggedNode = e.currentTarget;
    draggedNode.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedNode.getAttribute('data-node-id'));
}

function handleDragEnd(e) {
    draggedNode.classList.remove('dragging');
    document.querySelectorAll('.tree-node.drag-over').forEach(node => {
        node.classList.remove('drag-over');
    });
    draggedNode = null;
}

function handleDragOver(e) {
    if (draggedNode === e.currentTarget) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const targetNode = e.currentTarget;
    const targetType = targetNode.getAttribute('data-node-type');
    
    // Only folders can accept dropped items
    if (targetType === 'folder') {
        targetNode.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    if (e.currentTarget === e.target) {
        e.currentTarget.classList.remove('drag-over');
    }
}

async function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const targetNode = e.currentTarget;
    const targetType = targetNode.getAttribute('data-node-type');
    const targetNodeId = targetNode.getAttribute('data-node-id');
    
    // Only folders can accept dropped items
    if (targetType !== 'folder') {
        targetNode.classList.remove('drag-over');
        showError('Can only move items to folders');
        return;
    }
    
    if (!draggedNode) return;
    
    const draggedNodeId = draggedNode.getAttribute('data-node-id');
    
    // Prevent dragging a node onto itself
    if (draggedNodeId === targetNodeId) {
        targetNode.classList.remove('drag-over');
        return;
    }
    
    try {
        const result = await pywebview.api.move_node(draggedNodeId, targetNodeId);
        if (result.success) {
            await loadTree();
            showSuccess('Item moved successfully');
        } else {
            showError(result.error || 'Failed to move item');
        }
    } catch (error) {
        console.error('Move failed:', error);
        showError('Failed to move item');
    }
    
    targetNode.classList.remove('drag-over');
}

// Handle drop on tree view empty area to create top-level folder
async function handleTreeViewDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const treeView = document.getElementById('treeView');
    treeView.classList.remove('drag-over-empty');
    
    if (!draggedNode) return;
    
    const draggedNodeId = draggedNode.getAttribute('data-node-id');
    const draggedNodeType = draggedNode.getAttribute('data-node-type');
    
    // Only allow moving folders to top level, not commands
    if (draggedNodeType === 'command') {
        showError('Can only move folders to top level');
        draggedNode = null;
        return;
    }
    
    try {
        // Get root node ID
        const tree = await pywebview.api.get_tree();
        const rootId = tree.id;
        
        // Check if already at top level
        const draggedNodeData = await pywebview.api.get_node(draggedNodeId);
        if (draggedNodeData && draggedNodeData.parent_id === rootId) {
            showInfo('Folder is already at top level');
            draggedNode = null;
            return;
        }
        
        // Move to root (top level)
        const result = await pywebview.api.move_node(draggedNodeId, rootId);
        if (result.success) {
            await loadTree();
            showSuccess('Folder moved to top level');
        } else {
            showError(result.error || 'Failed to move folder');
        }
    } catch (error) {
        console.error('Move to top level failed:', error);
        showError('Failed to move folder to top level');
    }
    
    draggedNode = null;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US');
}

function showError(message) {
    showNotification(message, 'error', '❌');
}

function showSuccess(message) {
    showNotification(message, 'success', '✅');
}

function showInfo(message) {
    showNotification(message, 'info', 'ℹ️');
}

function showNotification(message, type = 'info', icon = 'ℹ️') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    notification.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-message">${message}</div>
    `;
    
    container.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('fadeOut');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}
