# BTC PULSE

Arabic RTL Bitcoin dashboard in one standalone `index.html`. Uses Cairo, a centered 420px mobile layout, background `#050505`, cards `#101010`, and accent `#ff8c00`.

Open `index.html` in a modern browser. No build, packages, API key, or backend is required. Cairo loads from Google Fonts; a sans-serif fallback is available offline.

## Data and interactions

- The Bitcoin USD price loads immediately from `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd` and refreshes every 30 seconds.
- Price requests time out after 10 seconds. Invalid responses, network errors, and rate limits preserve the last valid price and show its status. Before the first successful response, `$67,245.24` is an explicitly labeled illustrative fallback.
- The chart, 24-hour change, four market figures, three wallet balances/shortened addresses, and network figures are the supplied **static design examples**, not live data or a verified rich list.
- Search filters the three displayed wallets. Submit a complete Bitcoin address or transaction ID to get a link to mempool.space. Shortened sample addresses cannot be opened as real wallets.
- Five navigation items lead to the homepage, wallets, search, network, and information dialog. The header provides refresh and menu controls.

## GitHub Pages

`.github/workflows/deploy.yml` deploys on pushes to `main` or manual runs. It stages only `index.html`, uploads the Pages artifact, and publishes with `actions/deploy-pages@v4`.

Repository **Settings → Pages → Source** must be **GitHub Actions**. The workflow grants `contents: read`, `pages: write`, and `id-token: write`, with the `github-pages` deployment environment.

Older versioned CSS/JS files are retained in the repository but are not referenced or deployed by this standalone version.
