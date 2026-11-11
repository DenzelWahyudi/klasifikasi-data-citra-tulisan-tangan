# Agent Rules

## Review Before Proceeding

- **Always present a plan or summary of proposed changes to the user before making any modifications** to the codebase (creating, editing, or deleting files).
- Wait for explicit user approval before proceeding with the changes.
- If the user requests multiple changes at once, group them into a clear list and ask for confirmation on the entire set before executing.
- Do not skip the review step, even for seemingly small or trivial changes.

## `server` and `server_render` Synchronization

- The `server_render/` folder is a *lightweight* version of `server/` intended for deployment.
- **Every change made to a file in `server/` MUST also be applied to the corresponding file in `server_render/`**, unless the change is explicitly irrelevant for deployment (e.g., large model files or heavy dependencies).
- Both folders share an identical file structure:
  - `main.py`, `models_loader.py`, `preprocessing.py`, `schemas.py`, `requirements.txt`
- After making changes in `server/`, always review whether the same changes need to be applied in `server_render/` and do so accordingly.
- Never leave the two folders out of sync without a clear and stated reason.
