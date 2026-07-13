// =============================================================================
// Exyconn Website - Health Check Endpoint
// Service: website | Port: 4000 | Domain: exyconn.com
// Returns: JSON health status for monitoring and load balancing
// =============================================================================

export async function GET() {
  const healthResponse = {
    status: "ok",
    service: "exyconn-website",
    port: 4000,
    domain: "exyconn.com",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "production",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + "MB",
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + "MB",
    },
  };

  return new Response(JSON.stringify(healthResponse, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
