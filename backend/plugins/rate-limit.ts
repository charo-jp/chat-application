import type { RateLimitPluginOptions } from "@fastify/rate-limit";

// It uses IP address for distinguishing clients and tracking their request counts.
export const rateLimitConfigurations: RateLimitPluginOptions = {
  global: false,
};
