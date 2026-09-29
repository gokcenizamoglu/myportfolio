FROM golang:1.23-alpine AS build
WORKDIR /src
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /portfolio-api ./cmd/server
FROM alpine:3.21
RUN adduser -D -H app && mkdir /data && chown app:app /data
USER app
COPY --from=build /portfolio-api /portfolio-api
EXPOSE 8080
ENTRYPOINT ["/portfolio-api"]
