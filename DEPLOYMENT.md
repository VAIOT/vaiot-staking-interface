# Deployment process

1. First, you need to install the wrangler CLI tool if you haven't done so already. You can do this by running `npm install -g @cloudflare/wrangler` in your terminal.

2. Run `npx wrangler init --site` in your terminal. This will create a wrangler.toml file in your project directory.

3. Open the `wrangler.toml` file and modify it to look like this:

```toml
name = "vaiot-staking-interface-mainnet"
type = "webpack"
route = ''
account_id = "" # This is the account ID for the VAIOT Cloudflare account
zone_id = "" # This is the zone ID for the VAIOT Cloudflare account
workers_dev = true
compatibility_date = "2024-01-04"

[site]
bucket = "./build"
entry-point = "workers-site"
```

4. Run `yarn build` in your terminal. This will create a `build` folder in your project directory.

5. Run `npx wrangler login` in your terminal. This will open a browser window where you can log in to your Cloudflare account.

6. Finally, run `npx wrangler publish` in your terminal to deploy your create-react-app project to a Cloudflare worker.
