# @propeller/admin

Vite + React SPA for Propeller ops. Sits behind Cloudflare Access + VPN; never publicly reachable.

Talks to `apps/office` (REST). Identity comes from CF Access JWT header.

## Local dev

```sh
yarn install
yarn dev
```

Listens on `:3005`.
