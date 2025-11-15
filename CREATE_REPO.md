# Create GitHub Repository - Quick Steps

## Option 1: Via GitHub Website (30 seconds)

1. **Open:** https://github.com/new
2. **Fill in:**
   - Repository name: `Reclaim-AI`
   - Description: `Reclaim AI Agent - An autonomous anti-consumerism agent`
   - Visibility: **Public** ✅
   - ⚠️ **DO NOT** check README, .gitignore, or license
3. **Click:** "Create repository"
4. **Done!** Then run:
   ```bash
   cd "/Users/srirammuralidharan/AI Projects/reclaim-ai"
   git push -u origin main
   ```

## Option 2: Via GitHub CLI (if installed)

```bash
gh repo create Reclaim-AI --public --source=. --remote=origin --description "Reclaim AI Agent"
git push -u origin main
```

## Already Created?

If you've already created the repo, just run:
```bash
cd "/Users/srirammuralidharan/AI Projects/reclaim-ai"
git push -u origin main
```

