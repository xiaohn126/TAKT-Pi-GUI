# Verification

`live.cjs` is opt-in and uses the user's configured VanYo provider; normal runs incur model API usage. It verifies setup IPC (optionally from `TAKT_TEST_MAIN`, a packaged main module), local authentication, two assistant replies, and terminal input/output/resize/close. `TAKT_STYLE_ONLY=1` captures light, dark and compact real pi-web layouts and checks desktop style values without sending model requests. It leaves the client running after success. This test requires an existing local connection configuration.

`config.test.cjs` runs with Node's test runner and checks URL policy and server discovery. `smoke.cjs` runs in Electron, opens the real connection screen and captures `dist/windows/startup.png` after checking the bridge and renderer isolation. These tests require no provider credentials and do not send prompts to an agent.
