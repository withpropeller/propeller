# @propeller/core

Shared utilities used by every Propeller app and worker.

Lifted from `other_issuing_project/api/src/core` and trimmed: card-issuer-specific code dropped, Allawee branding swapped to Propeller, mongo repository / events / Redis service removed (TigerBeetle and Flo replace those concerns).

## Modules

| Module | Purpose |
|---|---|
| `crypto/` | AES-GCM, HMAC, RSA, scrypt, hashing, base58/base64 helpers |
| `exceptions/` | `CustomException`, `AppException`, `WorkerException` typed errors |
| `helpers/` | `Utils`, `PhoneUtils`, enums, constants |
| `interfaces/` | shared response types |

## Use

```ts
import { Utils, AppException, AppStatus, SCryptHash } from '@propeller/core';
```

Imported into apps via `"@propeller/core": "file:../../libs/core"` in their `package.json`.
