.PHONY: build contracts backend frontend deploy

# Build everything
build: contracts backend frontend

# Compile smart contracts
contracts:
	cd contracts && forge build

# Build Rust backend
backend:
	cd backend && cargo build --release

# Build Next.js frontend
frontend:
	cd frontend && npm run build

# Run backend dev server (port 3001)
backend-dev:
	cd backend && cargo run

# Run frontend dev server (port 3000)
frontend-dev:
	cd frontend && npm run dev

# Run tests
test:
	cd contracts && forge test -vvv

# Deploy contracts to Arbitrum Sepolia
# Usage: make deploy OPERATOR=0x...
deploy:
	cd contracts && forge script script/Deploy.s.sol \
		--rpc-url $${RPC_URL} \
		--broadcast \
		--verify \
		-vvvv
