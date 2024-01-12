# Builder stage
FROM rust:latest as builder
WORKDIR /usr/src/wildflow-graphql
COPY . .
RUN cargo install --path .

# Runtime stage
FROM rust:latest
COPY --from=builder /usr/local/cargo/bin/wildflow-graphql-backend /usr/local/bin/wildflow-graphql
EXPOSE 8080
CMD ["wildflow-graphql"]
