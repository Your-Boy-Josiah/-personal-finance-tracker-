# Bank Integration Implementation

## Provider

The backend uses Mono for bank account linking and financial-data access.

## API Endpoints

### `POST /api/bank/link-token`

Protected endpoint. Requires a valid JWT bearer token.

The backend calls Mono to initiate the hosted bank-linking widget. The response returns:

- `monoUrl`: URL for the frontend to open
- `customerId`: Mono customer identifier when provided

The Mono secret key is never sent to the frontend.

### `POST /api/bank/exchange-token`

Protected endpoint. Requires a valid JWT bearer token.

Request body:

```json
{
  "publicToken": "token-returned-by-the-mono-widget"
}
```

The backend exchanges the public token with Mono, encrypts the returned access token using AES-256-GCM, and stores the encrypted value on the user record. The access token is never returned in the API response.

Successful response:

```json
{
  "bankConnected": true
}
```

### `POST /api/bank/webhook`

Public provider callback endpoint. It requires the `mono-webhook-secret` request header to match the server-side configured secret.

Unauthenticated or incorrectly signed requests receive `401 Unauthorized`. Deauthorization or disconnect events clear the user's stored bank token and set `bankConnected` to `false`.

## User Model Changes

The `User` model contains:

- `bankAccessToken`: encrypted and excluded from normal queries and JSON output
- `bankConnected`: connection status boolean
- `bankCustomerId`: provider customer identifier, excluded from normal queries and JSON output

User JSON serialization also removes passwords, bank credentials, and password-reset fields.

`BANK_TOKEN_ENCRYPTION_KEY` must decode to exactly 32 bytes. Generate one with Node:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Environment files are ignored by Git, including `.env.example`, so secrets and local configuration are not pushed.

## Frontend Flow

1. Send an authenticated request to `/api/bank/link-token`.
2. Open the returned `monoUrl` with the Mono frontend widget.
3. Send the widget's returned public token to `/api/bank/exchange-token`.
4. Listen for the backend's `bankConnected` response and wait for Mono webhook updates before requesting synchronized bank data.

## Validation

The implementation was checked with Node syntax validation, Git whitespace validation, a User JSON redaction smoke test, and an invalid webhook-secret rejection test.
