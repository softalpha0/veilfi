use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use ethers::types::{Address, U256};
use serde::Deserialize;
use serde_json::{json, Value};

use crate::AppState;

/// POST /api/redeem/request — user submits a confidential redemption request
/// NOTE: The encrypted share amount and FHE proof are generated client-side
///       using the fhevmjs SDK and submitted directly on-chain from the frontend.
///       This endpoint is available for operator-relayed flows.
#[derive(Deserialize)]
pub struct RedeemRequestBody {
    /// Controller address
    pub controller: String,
    /// Owner of the shares to redeem
    pub owner: String,
    /// Encrypted share amount as hex string (from fhevmjs)
    pub enc_shares: String,
    /// FHE input proof as hex string (from fhevmjs)
    pub input_proof: String,
}

pub async fn request_redeem(
    State(_state): State<AppState>,
    Json(_body): Json<RedeemRequestBody>,
) -> Result<Json<Value>, StatusCode> {
    // Redemption requests with encrypted amounts must be submitted on-chain
    // directly from the user's wallet (frontend) using the fhevmjs SDK.
    // This backend endpoint exists for monitoring and operator orchestration.
    Ok(Json(json!({
        "message": "Submit redeem requests directly on-chain via the frontend using fhevmjs. \
                    The operator will fulfill once the FHEVM gateway decrypts your share amount.",
        "docsUrl": "https://docs.zama.ai/fhevm/guides/frontend",
    })))
}

/// POST /api/redeem/fulfill/:id — operator fulfills a redemption after FHEVM decryption
#[derive(Deserialize)]
pub struct FulfillRedeemBody {
    /// Decrypted share count — obtained by operator via FHEVM gateway
    pub plain_shares: u64,
    /// Address to receive USDC + yield
    pub receiver: String,
}

pub async fn fulfill_redeem(
    State(state): State<AppState>,
    Path(id): Path<u64>,
    Json(body): Json<FulfillRedeemBody>,
) -> Result<Json<Value>, StatusCode> {
    let request_id = U256::from(id);
    let receiver: Address = body.receiver.parse().map_err(|_| StatusCode::BAD_REQUEST)?;

    let tx_hash = state
        .vault
        .fulfill_redeem(request_id, body.plain_shares, receiver)
        .await
        .map_err(|e| {
            tracing::error!("fulfill_redeem error: {e}");
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(json!({
        "txHash":  tx_hash,
        "message": format!(
            "Redeem request {} fulfilled — {} shares burned, USDC + yield sent to {}",
            id, body.plain_shares, body.receiver
        ),
    })))
}
