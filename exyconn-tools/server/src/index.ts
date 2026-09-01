import { createApp, PORT } from "./app";

const app = createApp();

app.listen(PORT, () => {
  console.log(`🚀 Creative Tools Server running on http://localhost:${PORT}`);
  console.log(`📋 API Documentation: GET /api`);
  console.log(`🔧 Tools API: /api/tools/<tool-name>/`);
  console.log(`💚 Health Check: GET /health`);
});
