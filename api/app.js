const dotenv = require("dotenv");
const { getEnv } = require("./src/config/env");
const app = require("./src/app");

dotenv.config();

const env = getEnv();

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on port ${env.port}`);
});
