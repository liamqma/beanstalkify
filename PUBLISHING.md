# Publishing Guide

Steps to publish a new version of `beanstalkify` to npm and GitHub.

## Prerequisites

- Run `npm login` and ensure `~/.npmrc` is configured
- All changes committed and tests passing (`npm test`, `npm run lint`, `npm run formatting:check`)
- Local `master` branch up to date with remote

## Steps

### 1. Update Package Version

```bash
npm version patch|minor|major
```

This updates `package.json`, creates a commit, and creates a git tag.

### 2. Push to GitHub

```bash
git push --follow-tags
```

### 3. Draft GitHub Release

1. Go to [Releases](https://github.com/liamqma/beanstalkify/releases) → **Draft a new release**
2. Select the new tag (e.g., `v3.2.1`)
3. Add release notes (features, fixes, breaking changes)
4. **Save as draft**

### 4. Publish to NPM

```bash
npm publish
```

The `prepublishOnly` script automatically builds the package before publishing.

### 5. Publish GitHub Release

Return to your draft release and click **Publish release**.

## Verification

- Check npm: https://www.npmjs.com/package/beanstalkify
- Test: `npm install beanstalkify@latest`

## Troubleshooting

**Authentication errors:** Run `npm whoami` or `npm login`

**Build failures:** Run `npm run build` locally to diagnose

**Version conflicts:** Check published versions with `npm view beanstalkify versions`

**Rollback:** Deprecate instead of unpublishing
```bash
npm deprecate beanstalkify@<version> "Reason for deprecation"
```
