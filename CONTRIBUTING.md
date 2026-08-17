# Contributing to Gramin Connect Hub

First off, thank you for considering contributing to Gramin Connect Hub! It's people like you that make Gramin Connect Hub such a great platform for community banking.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

- Be respectful and professional
- No harassment or discrimination
- Welcome diverse perspectives
- Focus on constructive feedback

## How Can I Contribute?

### Reporting Bugs 🐛

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

**How To Submit A (Good) Bug Report**

- **Use a clear and descriptive title**
- **Describe the exact steps which reproduce the problem**
- **Provide specific examples** to demonstrate the steps
- **Describe the behavior you observed after following the steps**
- **Explain which behavior you expected to see instead and why**
- **Include screenshots and animated GIFs if possible**
- **Include your environment details**
  - OS and version
  - Application version
  - Python version (if development)
  - Node.js version (if development)

**Example Bug Report**

```
Title: Transactions not saving when network is unstable

Steps to Reproduce:
1. Open application
2. Create new customer
3. Process deposit transaction
4. Interrupt network connection mid-transaction
5. Check database - transaction not saved

Expected: Transaction should either complete or rollback
Actual: Transaction appears complete but data is inconsistent

Environment:
- Windows 10
- App v1.0.0
- Network: Mobile hotspot with unstable connection
```

### Suggesting Enhancements 💡

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description** of the suggested enhancement
- **Provide specific examples** to demonstrate the steps
- **Describe the current behavior** and **the expected improvement**
- **Explain why this enhancement would be useful**
- **List some other applications** where this enhancement exists, if applicable

### Pull Requests 🔧

- Fill in the required template
- Follow the styleguides
- Document new code
- End all files with a newline
- Avoid platform-specific code

## Styleguides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line
- Consider starting the commit message with an applicable emoji:
  - 🎨 when improving the format/structure of the code
  - 🚀 when improving performance
  - 📝 when writing docs
  - 🐛 when fixing a bug
  - ✨ when adding a feature
  - 🔒 when dealing with security
  - ⬆️ when upgrading dependencies
  - 🔧 when updating configuration files

**Example**

```
🐛 Fix transaction not saving on network disconnect

- Add transaction retry logic
- Implement exponential backoff
- Add error notifications to user
- Fixes #123
```

### JavaScript/TypeScript Styleguide

All JavaScript/TypeScript must adhere to [ESLint](./eslint.config.js) rules.

- Use **const** for all of your references; avoid using **var** or **let**
- Use arrow functions `=>` when possible
- Use template literals with backticks `` ` ``
- Use meaningful variable names
- Add comments for complex logic

**Example**

```typescript
// Good
const getUserData = async (userId: string): Promise<User> => {
  try {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    throw error;
  }
};

// Avoid
var userData = [];
function getUser(id) {
  // Complex logic here
}
```

### Python Styleguide

All Python code must adhere to [PEP 8](https://www.python.org/dev/peps/pep-0008/).

- Use 4 spaces for indentation
- Use meaningful variable names
- Add docstrings to functions and classes
- Use type hints where applicable

**Example**

```python
# Good
def calculate_balance(account_id: str) -> float:
    """
    Calculate the current balance for an account.
    
    Args:
        account_id: The unique identifier for the account
        
    Returns:
        The current account balance as a float
    """
    account = Account.objects.get(id=account_id)
    return account.calculate_balance()

# Avoid
def calc_bal(id):
    # Some complex calculation
    pass
```

### React Component Styleguide

- Use functional components with hooks
- Keep components small and focused
- Use descriptive component names
- Add PropTypes or TypeScript interfaces
- Add JSDoc comments for complex components

**Example**

```typescript
interface TransactionListProps {
  transactions: Transaction[];
  loading?: boolean;
  onSelect?: (transaction: Transaction) => void;
}

/**
 * Display a list of transactions with filtering capabilities
 */
export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  loading = false,
  onSelect,
}) => {
  return (
    <div className="transaction-list">
      {loading ? (
        <Loader />
      ) : (
        transactions.map((tx) => (
          <TransactionItem
            key={tx.id}
            transaction={tx}
            onClick={() => onSelect?.(tx)}
          />
        ))
      )}
    </div>
  );
};
```

## Development Workflow

### Setting Up Your Dev Environment

1. Fork the repo
2. Clone your fork
3. Create a new branch for your feature
4. Make your changes
5. Commit with meaningful messages
6. Push to your fork
7. Create a Pull Request

### Before Submitting

```bash
# Install dependencies
npm install
pip install -r backend/requirements.txt

# Run linting
npm run lint

# Run tests (if available)
npm run test

# Build for testing
npm run build
npm run backend:build
```

### Testing Your Changes

```bash
# Development mode
npm run desktop:dev

# Test in browser
npm run dev:frontend

# Test backend API
npm run dev:backend
```

## Additional Notes

### Issue and Pull Request Labels

This section lists the labels we use to help organize and categorize issues and pull requests.

- **bug** - Something isn't working
- **enhancement** - New feature or request
- **documentation** - Improvements or additions to documentation
- **duplicate** - This issue or pull request already exists
- **good first issue** - Good for newcomers
- **help wanted** - Extra attention is needed
- **question** - Further information is requested
- **security** - Security-related issues

### Project Structure

```
gramin-connect-hub/
├── src/              # Frontend React code
├── backend/          # Django REST API
├── electron/         # Desktop application
├── tests/            # Test files
└── docs/             # Documentation
```

### Release Process

Releases are handled by the core team. Version numbers follow [Semantic Versioning](https://semver.org/):

- **MAJOR.MINOR.PATCH**
- Major: Breaking changes
- Minor: New features (backwards compatible)
- Patch: Bug fixes

## Community

- Join our [Discord Community](.) (if available)
- Participate in [GitHub Discussions](.)
- Follow us on [Twitter](.)
- Check out the [Blog](.)

## License

By contributing to Gramin Connect Hub, you agree that your contributions will be licensed under its MIT License.

## Attribution

These contributing guidelines were adapted from the [Atom Contributing Guidelines](https://github.com/atom/atom/blob/master/CONTRIBUTING.md).

---

**Thank you for contributing to make Gramin Connect Hub better!** 🙏
