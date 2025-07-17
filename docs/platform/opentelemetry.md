# OpenTelemetry Support

Steel browser now includes built-in support for OpenTelemetry, enabling you to monitor your browser sessions with your preferred observability platforms.

## Overview

OpenTelemetry is an open-source observability framework that helps you collect, process, and export telemetry data from your applications. Steel's OpenTelemetry integration provides automatic monitoring of:

- Logs from Steel browser sessions
- Events occurring within browser sessions
- Metrics for session performance and resource usage

## Benefits

By connecting Steel to your existing observability platforms through OpenTelemetry, you can:

1. **Monitor application health**: Track the performance and stability of your Steel browser sessions
2. **Troubleshoot issues**: Quickly identify and diagnose problems in your browser automation
3. **Optimize resource usage**: Understand resource consumption patterns and optimize accordingly
4. **Centralize monitoring**: Bring Steel monitoring data into your existing observability dashboards

## Supported Providers

You can hook Steel's OpenTelemetry integration with popular observability platforms, including:

- Sentry
- Axiom
- New Relic
- Datadog
- Honeycomb
- Grafana Cloud
- And any other platform that supports OpenTelemetry

## Configuration

To configure OpenTelemetry with Steel browser, you'll need to set the appropriate environment variables when launching your Steel browser instance.

### Basic Configuration

```bash
# Enable OpenTelemetry
export OTEL_ENABLED=true

# Set your OpenTelemetry endpoint
export OTEL_EXPORTER_OTLP_ENDPOINT="https://your-otel-collector-endpoint"

# Set your API key or token if required by your provider
export OTEL_EXPORTER_OTLP_HEADERS="api-key=your-api-key"

# Set service name for better organization
export OTEL_SERVICE_NAME="steel-browser"
```

### Advanced Configuration

For more advanced configuration, you can set additional OpenTelemetry environment variables:

```bash
# Configure sampling rate (1.0 = 100% of traces)
export OTEL_TRACES_SAMPLER_ARG="1.0"

# Configure exporters
export OTEL_TRACES_EXPORTER="otlp"
export OTEL_METRICS_EXPORTER="otlp"
export OTEL_LOGS_EXPORTER="otlp"

# Set resource attributes for better filtering
export OTEL_RESOURCE_ATTRIBUTES="environment=production,deployment.id=steel-prod-1"
```

## Integration Examples

### Sentry Integration

```bash
export OTEL_ENABLED=true
export OTEL_EXPORTER_OTLP_ENDPOINT="https://ingest.sentry.io/api/YOUR_PROJECT_ID/otel/v1/traces"
export OTEL_EXPORTER_OTLP_HEADERS="sentry-trace=true,sentry-key=YOUR_SENTRY_KEY"
export OTEL_SERVICE_NAME="steel-browser"
```

### Axiom Integration

```bash
export OTEL_ENABLED=true
export OTEL_EXPORTER_OTLP_ENDPOINT="https://cloud.axiom.co/v1/traces"
export OTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer YOUR_AXIOM_TOKEN"
export OTEL_SERVICE_NAME="steel-browser"
```

## Viewing Telemetry Data

Once configured, you can view your Steel browser telemetry data in your chosen observability platform's dashboard. Look for:

- Traces showing browser session operations
- Metrics displaying resource usage and performance
- Logs containing detailed session information

## Troubleshooting

If you're not seeing telemetry data in your platform:

1. Verify your endpoint and credentials are correct
2. Check that the OpenTelemetry environment variables are properly set
3. Ensure your observability platform is configured to accept OpenTelemetry data
4. Check network connectivity between Steel browser and your OpenTelemetry collector

## Additional Resources

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Sentry OpenTelemetry Documentation](https://docs.sentry.io/platforms/javascript/guides/opentelemetry/)
- [Axiom OpenTelemetry Documentation](https://axiom.co/docs/send-data/opentelemetry)