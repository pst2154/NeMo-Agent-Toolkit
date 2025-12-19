# Contributing to Visual Agent Builder

Thank you for your interest in contributing to the NeMo Agent Toolkit Visual Builder! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/visual-agent-builder.git`
3. Create a feature branch: `git checkout -b feature/my-new-feature`
4. Make your changes
5. Test thoroughly
6. Commit with clear messages
7. Push to your fork
8. Open a Pull Request

## Development Setup

See [README.md](README.md#development) for detailed setup instructions.

## Coding Standards

### Python (Backend)

- Follow PEP 8 style guide
- Use type hints where possible
- Add docstrings to all functions
- Keep functions small and focused
- Use meaningful variable names

```python
async def process_workflow(
    workflow_data: Dict[str, Any],
    user_id: str
) -> Dict[str, Any]:
    """Process and validate workflow data.
    
    Args:
        workflow_data: Raw workflow configuration
        user_id: ID of the user creating the workflow
        
    Returns:
        Validated workflow configuration
        
    Raises:
        HTTPException: If validation fails
    """
    # Implementation here
    pass
```

### TypeScript/React (Frontend)

- Use functional components with hooks
- Follow React best practices
- Use TypeScript strict mode
- Keep components small and reusable
- Use meaningful prop names

```typescript
interface ComponentProps {
  workflowId: string;
  onUpdate: (workflow: Workflow) => void;
}

const MyComponent: React.FC<ComponentProps> = ({ workflowId, onUpdate }) => {
  // Implementation here
};
```

## Testing

### Backend Tests

```bash
cd backend
pytest tests/ -v
```

### Frontend Tests

```bash
cd frontend
npm test
```

## Pull Request Guidelines

### PR Title Format

Use conventional commits:
- `feat: Add new component type`
- `fix: Resolve canvas rendering issue`
- `docs: Update API documentation`
- `refactor: Simplify workflow export logic`
- `test: Add tests for agent configuration`

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Screenshots
If applicable, add screenshots

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added where needed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
```

## Adding New Features

### Adding a New Component Type

1. **Define in backend** (`backend/app/api/routes/components.py`):
```python
{
    "name": "my_component",
    "component_type": "function",
    "description": "Description of my component",
    "category": "utilities",
    "configuration_schema": {
        "type": "object",
        "properties": {
            "param1": {
                "type": "string",
                "default": "default_value",
                "description": "Parameter description"
            }
        },
        "required": ["param1"]
    }
}
```

2. **Test the component**:
   - Add to the canvas
   - Configure parameters
   - Export to YAML
   - Test with NAT CLI

3. **Document in README.md**

### Adding a New Agent Type

1. Update `components.py` with agent definition
2. Add corresponding prompt template in `export.py`
3. Test agent behavior thoroughly
4. Document agent capabilities and use cases

## Reporting Bugs

### Bug Report Template

```markdown
**Describe the bug**
A clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen

**Screenshots**
If applicable

**Environment:**
- OS: [e.g., macOS 14.0]
- Browser: [e.g., Chrome 120]
- Python version: [e.g., 3.10]
- NAT version: [e.g., 0.8.0]

**Additional context**
Any other relevant information
```

## Feature Requests

We welcome feature requests! Please:
1. Check if the feature already exists
2. Search existing issues
3. Describe the use case
4. Explain expected behavior
5. Provide examples if possible

## Documentation

- Update README.md for user-facing changes
- Add inline comments for complex logic
- Update API documentation in docstrings
- Include examples for new features

## Release Process

1. Version bump in `package.json` and `__init__.py`
2. Update CHANGELOG.md
3. Create release PR
4. Tag release after merge
5. Publish release notes

## Questions?

Feel free to:
- Open a discussion on GitHub
- Reach out on NVIDIA Developer Forums
- Check existing documentation

Thank you for contributing! 🎉

