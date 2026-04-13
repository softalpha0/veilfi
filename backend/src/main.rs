mod contracts;
mod routes;

use anyhow::Result;
use axum::{Router, routing::get, routing::post};
use dotenvy::dotenv;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use contracts::VeilVaultClient;
use routes::{
    vault::{get_vault_info, get_deposit_request, get_total_assets},
    deposit::{request_deposit, fulfill_deposit},
    redeem::{request_redeem, fulfill_redeem},
    health::health,
};

#[derive(Clone)]
pub struct AppState {
    pub vault: Arc<VeilVaultClient>,
}

#[tokio::main]
async fn main() -> Result<()> {
    dotenv().ok();

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "veilfi_backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let vault_client = VeilVaultClient::from_env().await?;
    let state = AppState {
        vault: Arc::new(vault_client),
    };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        // Health
        .route("/health", get(health))
        // Vault info
        .route("/api/vault", get(get_vault_info))
        .route("/api/vault/total-assets", get(get_total_assets))
        .route("/api/vault/deposit/:id", get(get_deposit_request))
        // Deposit flow (ERC-7540 step 1 & 2)
        .route("/api/deposit/request", post(request_deposit))
        .route("/api/deposit/fulfill/:id", post(fulfill_deposit))
        // Redeem flow (ERC-7540 step 3 & 4)
        .route("/api/redeem/request", post(request_redeem))
        .route("/api/redeem/fulfill/:id", post(fulfill_redeem))
        .layer(cors)
        .with_state(state);

    let addr = "0.0.0.0:3001";
    tracing::info!("VeilFi backend listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
