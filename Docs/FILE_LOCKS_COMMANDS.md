# File Locks and Node Modules Troubleshooting Commands

This document provides useful commands for dealing with file permission issues, locked files, and node_modules cleanup on macOS.

## Check File Locks

### List Open Files in Directory

```bash
# List all processes accessing files in node_modules
lsof +D node_modules/

# List with sudo for complete visibility
sudo lsof +D node_modules/

# Grep for specific directory locks
sudo lsof | grep node_modules
```

### Check Process Status

```bash
# Check for Node.js related processes
ps aux | grep -i 'node\|npm\|jest\|next'
```

## Kill Processes

### Kill Specific Process

```bash
# Kill process by PID (replace 753 with actual PID)
sudo kill -9 753

# Kill all Node processes
killall node
```

## Permission and Removal Commands

### Basic Removal

```bash
# Simple remove
rm -rf node_modules/

# Force remove with sudo
sudo rm -rf node_modules/
```

### Fix Permissions and Remove

```bash
# Change ownership and permissions before removal
sudo chown -R $USER:$GROUP node_modules/
sudo chmod -R 755 node_modules/
sudo rm -rf node_modules/

# Alternative: chmod 777 before removal
chmod -R 777 node_modules/ && rm -rf node_modules/
```

### Using Find Command

```bash
# Remove all node_modules directories recursively
sudo find . -name "node_modules" -type d -prune -exec rm -rf {} +
```

## NPM Cache Commands

### Clean NPM Cache

```bash
# Force clean npm cache
npm cache clean --force
```

## Best Practices

1. Before attempting removal:

   - Close any IDE or text editor that might be accessing these files
   - Close any terminal processes running npm, node, or related development servers
   - If using VS Code or Cursor, close them completely as they might have file watchers active

2. After cleanup:
   - Restart your terminal
   - Run a fresh `npm install`

## Troubleshooting Steps

If encountering permission issues:

1. Check for processes locking files using `lsof` commands
2. Kill any relevant processes
3. Clean npm cache
4. Try permission fixes
5. If all else fails, use the find command to forcefully remove directories

Remember to always be careful with `sudo` and `rm -rf` commands, as they can be destructive if used incorrectly.
