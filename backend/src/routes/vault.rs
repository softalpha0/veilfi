use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use ethers::types::U256;
use serde_json::{json, Value};

use crate::AppState;

/// GET /api/vault — returns vault metadata and live stats
pub async fn get_vault_info(State(state): State<AppState>) -> Result<Json<Value>, StatusCode> {
    let total_assets = state
        .vault
        .total_assets()
        .await
        .map_err(|e| {
            tracing::error!("total_assets error: {e}");
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let total_deposited = state
        .vault
        .total_assets_deposited()
        .await
        .map_err(|e| {
            tracing::error!("total_assets_deposited error: {e}");
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let total_shares = state
        .vault
        .total_shares()
        .await
        .map_err(|e| {
            tracing::error!("total_shares error: {e}");
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let yield_earned = if total_assets > total_deposited {
        total_assets - total_deposited
    } else {
        U256::zero()
    };

    Ok(Json(json!({
        "vaultAddress":     format!("{:?}", state.vault.vault_address),
        "totalAssets":      total_assets.to_string(),
        "totalDeposited":   total_deposited.to_string(),
        "totalShares":      total_shares.to_string(),
        "yieldEarned":      yield_earned.to_string(),
        "asset":            "USDC",
        "decimals":         6,
    })))
}

/// GET /api/vault/total-assets
pub async fn get_total_assets(State(state): State<AppState>) -> Result<Json<Value>, StatusCode> {
    let total = state
        .vault
        .total_assets()
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(json!({ "totalAssets": total.to_string() })))
}

/// GET /api/vault/deposit/:id — get deposit request info
pub async fn get_deposit_request(
    State(state): State<AppState>,
    Path(id): Path<u64>,
) -> Result<Json<Value>, StatusCode> {
    let request_id = U256::from(id);
    let (owner, controller, assets, fulfilled) = state
        .vault
        .get_deposit_request(request_id)
        .await
        .map_err(|e| {
            tracing::error!("get_deposit_request error: {e}");
            StatusCode::NOT_FOUND
        })?;

    Ok(Json(json!({
        "requestId":   id,
        "owner":       format!("{:?}", owner),
        "controller":  format!("{:?}", controller),
        "assets":      assets.to_string(),
        "fulfilled":   fulfilled,
    })))
}
