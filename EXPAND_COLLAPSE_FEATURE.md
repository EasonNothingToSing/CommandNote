# Expand/Collapse Folder Feature

## Overview

CommandNote now supports expanding and collapsing folders in the tree view. This allows you to organize and navigate your command structure more efficiently.

## Features

### Visual Indicators

- **Expand/Collapse Arrow**: Folders with child nodes display an arrow indicator:
  - `▼` (Down arrow) - Folder is expanded, showing all children
  - `▶` (Right arrow) - Folder is collapsed, hiding all children
  - `•` (Dot) - Empty folder with no children (non-clickable)

### How to Use

1. **Expand Folder**: Click the down arrow (▼) next to a folder to collapse it
2. **Collapse Folder**: Click the right arrow (▶) next to a folder to expand it
3. **Navigate**: The tree automatically maintains the expanded/collapsed state during the session

### Visual States

- **Expanded**: All child nodes are visible
  ```
  ▼ 📁 Database
    📝 MySQL Query
    📝 PostgreSQL Query
  ```

- **Collapsed**: Child nodes are hidden
  ```
  ▶ 📁 Database
  ```

- **Empty Folder**: No expand/collapse button (shown as a dot placeholder)
  ```
  • 📁 Empty Folder
  ```

## Technical Implementation

### Frontend Changes

**views/static/app.js**:
- `renderTree()` - Enhanced to create children containers and toggle buttons
- `toggleNodeChildren()` - New function to handle expand/collapse functionality
- Support for `data-expanded` attribute to track state

**views/static/style.css**:
- `.toggle-btn` - Styles for the expand/collapse button
- `.children-container` - Container for child nodes
- `.children-container.collapsed` - Collapsed state styling
- Smooth animation transitions

**views/static/index.html**:
- Updated HTML comments to English

### Key Features

1. **Smooth Animations**: Collapse/expand transitions are animated for better UX
2. **State Tracking**: Each folder remembers its expanded/collapsed state
3. **Empty Folder Handling**: Folders with no children don't show a toggle button
4. **Event Handling**: Click events properly propagate to handle selection

## Code Structure

### JavaScript Toggle Function

```javascript
function toggleNodeChildren(nodeElement, node) {
    // Finds and toggles the visibility of child nodes
    // Updates the arrow indicator and state
}
```

### CSS Animations

```css
.children-container {
    transition: max-height 0.3s ease;
    max-height: 100%;
}

.children-container.collapsed {
    max-height: 0;
    overflow: hidden;
}
```

## Usage Examples

### Example 1: Organizing by Category

```
▼ 📁 Backend
  ▼ 📁 Database
    📝 MySQL Query
    📝 PostgreSQL Query
  • 📁 API Endpoints
    📝 GET /users
    📝 POST /users

▼ 📁 Frontend
  ▼ 📁 React Components
    📝 Button Component
    📝 Modal Component
```

### Example 2: Collapsing for Focus

When working on specific tasks, collapse irrelevant folders:

```
▶ 📁 Backend
▶ 📁 Database

▼ 📁 Frontend
  ▼ 📁 React Components
    📝 Button Component (currently editing)
    📝 Modal Component
```

## Performance Considerations

- Expansion/collapse operations are instant (no server round-trip)
- CSS transitions provide smooth visual feedback
- The state is maintained only in the current session
- Closing and reopening the app resets to default expanded state

## Future Enhancements

- [ ] Remember expanded/collapsed state across sessions
- [ ] Expand/collapse all button
- [ ] Double-click to toggle
- [ ] Keyboard shortcuts (arrow keys) for navigation
- [ ] Auto-expand on search results

## Browser Compatibility

The expand/collapse feature uses standard CSS and JavaScript and is compatible with all modern browsers.

## Related Features

- [Drag and Drop](DRAG_AND_DROP_GUIDE.md) - Move items between folders
- Tree navigation - Select and view items
- Search - Find commands across all folders
