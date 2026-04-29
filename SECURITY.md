# Security

## Reporting

Please report security issues privately to the project maintainers instead of opening a public issue.

## API Keys

The GitHub Pages build is static and must not contain private API keys. Real image generation with OpenAI or other providers should run through a server-side deployment where secrets are configured in the host environment.

Never commit `.env.local`, API keys, wallet secrets, private keys, or generated credentials.
