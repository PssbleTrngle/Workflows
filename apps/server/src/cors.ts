import cors from "cors";

const corsMiddleware = cors({
  allowedHeaders: ["Content-Type", "Authorization"],
});

export default corsMiddleware;
