use anyhow::{Context, Result};
use ethers::{
    contract::abigen,
    middleware::SignerMiddleware,
    providers::{Http, Middleware, Provider},
    signers::{LocalWallet, Signer},
    types::{Address, U256},
};
use std::{env, sync::Arc};

// Generate type-safe bindings from the compiled ABI.
// The ABI JSON is read from the Foundry out/ directory at compile time.
abigen!(
    VeilVault,
    "../contracts/out/VeilVault.sol/VeilVault.json",
    event_derives(serde::Deserialize, serde::Serialize)
);

abigen!(
    ConfidentialVaultShares,
    "../contracts/out/ConfidentialVaultShares.sol/ConfidentialVaultShares.json",
    event_derives(serde::Deserialize, serde::Serialize)
);

pub type SignedProvider = SignerMiddleware<Provider<Http>, LocalWallet>;

/// Holds live contract handles and the signing middleware.
pub struct VeilVaultClient {
    pub vault:        VeilVault<SignedProvider>,
    pub shares:       ConfidentialVaultShares<SignedProvider>,
    pub vault_address: Address,
    pub provider:     Arc<SignedProvider>,
}

impl VeilVaultClient {
    /// Build a client from environment variables:
    ///   RPC_URL        — Arbitrum Sepolia RPC endpoint
    ///   PRIVATE_KEY    — operator / signer private key (hex, no 0x prefix)
    ///   VAULT_ADDRESS  — deployed VeilVault address
    ///   SHARES_ADDRESS — deployed ConfidentialVaultShares address
    pub async fn from_env() -> Result<Self> {
        let rpc_url        = env::var("RPC_URL").context("RPC_URL not set")?;
        let private_key    = env::var("PRIVATE_KEY").context("PRIVATE_KEY not set")?;
        let vault_addr_str = env::var("VAULT_ADDRESS").context("VAULT_ADDRESS not set")?;
        let shares_addr_str = env::var("SHARES_ADDRESS").context("SHARES_ADDRESS not set")?;

        let provider = Provider::<Http>::try_from(rpc_url.as_str())
            .context("Failed to create provider")?;

        let chain_id = provider.get_chainid().await?.as_u64();

        let wallet: LocalWallet = private_key
            .parse::<LocalWallet>()
            .context("Invalid PRIVATE_KEY")?
            .with_chain_id(chain_id);

        let signer = Arc::new(SignerMiddleware::new(provider, wallet));

        let vault_address:  Address = vault_addr_str.parse().context("Invalid VAULT_ADDRESS")?;
        let shares_address: Address = shares_addr_str.parse().context("Invalid SHARES_ADDRESS")?;

        let vault  = VeilVault::new(vault_address, signer.clone());
        let shares = ConfidentialVaultShares::new(shares_address, signer.clone());

        Ok(Self {
            vault,
            shares,
            vault_address,
            provider: signer,
        })
    }

    // ── Vault read helpers ────────────────────────────────────────────────────

    pub async fn total_assets(&self) -> Result<U256> {
        Ok(self.vault.total_assets().call().await?)
    }

    pub async fn total_assets_deposited(&self) -> Result<U256> {
        Ok(self.vault.total_assets_deposited().call().await?)
    }

    pub async fn total_shares(&self) -> Result<u64> {
        Ok(self.shares.total_shares().call().await?)
    }

    pub async fn get_deposit_request(&self, request_id: U256) -> Result<(Address, Address, U256, bool)> {
        Ok(self.vault.get_deposit_request(request_id).call().await?)
    }

    pub async fn is_redeem_fulfilled(&self, request_id: U256) -> Result<bool> {
        Ok(self.vault.is_redeem_fulfilled(request_id).call().await?)
    }

    // ── Operator write helpers ────────────────────────────────────────────────

    /// Operator fulfills a pending deposit request (ERC-7540 step 2).
    pub async fn fulfill_deposit(&self, request_id: U256, receiver: Address) -> Result<String> {
        let tx = self
            .vault
            .deposit(request_id, receiver)
            .send()
            .await?
            .await?;
        Ok(format!("{:?}", tx.map(|r| r.transaction_hash)))
    }

    /// Operator fulfills a pending redeem request (ERC-7540 step 4).
    /// `plain_shares` is the decrypted share count from the FHEVM gateway.
    pub async fn fulfill_redeem(
        &self,
        request_id: U256,
        plain_shares: u64,
        receiver: Address,
    ) -> Result<String> {
        let tx = self
            .vault
            .redeem(request_id, plain_shares, receiver)
            .send()
            .await?
            .await?;
        Ok(format!("{:?}", tx.map(|r| r.transaction_hash)))
    }
}
