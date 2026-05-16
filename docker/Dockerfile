# Multi-stage build for the Rust CLI
FROM rust:1.75-slim-bookworm AS builder
WORKDIR /build
COPY cli/Cargo.toml cli/Cargo.lock ./
COPY cli/src ./src
RUN cargo build --release

FROM debian:bookworm-slim
COPY --from=builder /build/target/release/proofbundle /usr/local/bin/proofbundle
ENTRYPOINT ["proofbundle"]
