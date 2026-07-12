import { app } from "./app.js";
import { env } from "./config/env.js";

app.listen(env.port, () => {
  console.log(`AssetFlow API listening on http://localhost:${env.port}`);
});
