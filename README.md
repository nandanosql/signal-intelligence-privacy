# Signal Intelligence - Privacy Policy

Public privacy policy for the Signal Intelligence Chrome extension.

Policy page: https://nandanosql.github.io/signal-intelligence-privacy/

Questions or requests: email nandanpriyadarshi298@gmail.com or open an issue in this repository.

## Updating the policy

1. Edit `index.html`. Each section has a stable anchor (`#permissions`, `#retention`, and so on) that the extension and the Web Store listing can link to.
2. Bump the "Effective" date at the top and add an entry to section 10 and to `CHANGELOG.md`, naming the extension version the change belongs to.
3. Run the sync check against the extension's manifest before releasing:

   ```sh
   node scripts/check-policy-sync.mjs /path/to/extension/manifest.json
   ```

   It fails if any permission or host in the manifest is not mentioned in the policy. If a copy of `manifest.json` is committed to this repo, the GitHub Actions workflow runs the same check on every push.

## Checks

`.github/workflows/check.yml` runs on every push and pull request, and weekly:

- HTML validation of `index.html` (html-validate)
- Link check of all external links (lychee)
- Policy-versus-manifest sync check, when `manifest.json` is present

## License

Policy text: CC BY 4.0. Scripts and workflows: MIT. See `LICENSE`.
