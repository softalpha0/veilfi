use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use ethers::types::{Address, U256};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

use crate::AppState;

/// POST /api/deposit/request — operator-relayed deposit request
/// In production the user signs and submits on-chain directly from the frontend.
/// This endpoint is used by the operator to relay or to monitor pending requests.
#[derive(Deserialize)]
pub struct DepositRequestBody {
    /// USDC amount in 6-decimal units (e.g. 1_000_000 = 1 USDC)
    pub assets: String,
    /// Address that will control the request
    pub controller: String,
    /// Address that will receive the shares
    pub owner: String,
}

#[derive(Serialize)]
pub struct DepositRequestResponse {
    pub tx_hash:    String,
    pub message:    String,
}

/// POST /api/deposit/request
pub async fn request_deposit(
    State(state): State<AppState>,
    Json(body): Json<DepositRequestBody>,
) -> Result<Json<Value>, StatusCode> {
    let assets: U256 = body.assets.parse().map_err(|_| StatusCode::BAD_REQUEST)?;
    let controller: Address = body.controller.parse().map_err(|_| StatusCode::BAD_REQUEST)?;
    let owner: Address = body.owner.parse().map_err(|_| StatusCode::BAD_REQUEST)?;

    let tx = state
        .vault
        .vault
        .request_deposit(assets, controller, owner)
        .send()
        .await
        .map_err(|e| {
            tracing::error!("requestDeposit tx error: {e}");
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .await
        .map_err(|e| {
            tracing::error!("requestDeposit receipt error: {e}");
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let hash = tx.map(|r| format!("{:?}", r.transaction_hash))
        .unwrap_or_else(|| "pending".into());

    Ok(Json(json!({
        "txHash":  hash,
        "message": "Deposit request submitted — awaiting operator fulfillment",
    })))
}

/// POST /api/deposit/fulfill/:id — operator fulfills a pending deposit
#[derive(Deserialize)]
pub struct FulfillDepositBody {
    /// Address to receive the confidential vault shares
    pub receiver: String,
}

pub async fn fulfill_deposit(
    State(state): State<AppState>,
    Path(id): Path<u64>,
    Json(body): Json<FulfillDepositBody>,
) -> Result<Json<Value>, StatusCode> {
    let request_id = U256::from(id);
    let receiver: Address = body.receiver.parse().map_err(|_| StatusCode::BAD_REQUEST)?;

    let tx_hash = state
        .vault
        .fulfill_deposit(request_id, receiver)
        .await
        .map_err(|e| {
            tracing::error!("fulfill_deposit error: {e}");
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(json!({
        "txHash":  tx_hash,
        "message": format!("Deposit request {} fulfilled — confidential shares minted", id),
    })))
}
