# D03/D04 Tek Owner V4.2.1 · DoneCheck review branch

This is a **versioned candidate route**, isolated from `recordVerifiedFinish()` and historical v1.2 audit data. The approved policy is governed by SHA `5f5ec92ed1a3ba7078c6e24873eda309453f22275b6285047c738a069db2075d`. The source baseline stays unchanged until separate merge authorization.

After `npm run build`, execute `node --test engineering/enguru-v421/test_single_owner_integration.mjs`. The test uses ephemeral owner + machine oracle Ed25519 keys and an isolated test ledger; it is NOT official Mac or production authority evidence.

`verifyOwnerGrant` may only be reached through an independently secured `TrustedActivationRoot` supplied by the authorized CAS runtime, never by a producer/client. No protected root or signed current registry is configured by this branch, so D03 remains HOLD_AUTH and M02 remains 0/32. All real source/log/oracle signatures and runtime scope are prerequisites before candidate evidence recording.