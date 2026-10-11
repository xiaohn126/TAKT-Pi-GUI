# Verification

`config.test.cjs` runs with Node's test runner and checks URL policy and server discovery. `smoke.cjs` runs in Electron, opens the real connection screen and captures `dist/windows/startup.png` after checking the bridge and renderer isolation. These tests require no provider credentials and do not send prompts to an agent.
