import { Context, Next } from "hono";
import { z } from "zod";

export const validateBody = (schema: z.ZodSchema) => {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const validatedData = schema.parse(body);

      // store validated data in context for use in the route handler
      c.set("validatedData", validatedData);
      await next();
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return c.json(
          {
            error: "validation failed",
            details: err.errors.map((error) => ({
              field: error.path.join("."),
              message: error.message,
            })),
          },
          400
        );
      }
      return c.json(
        {
          error: "invalid request body",
        },
        400
      );
    }
  };
};

export const validateQuery = (schema: z.ZodSchema) => {
  return async (c: Context, next: Next) => {
    try {
      const query = c.req.query();
      const validatedData = schema.parse(query);
      
      // Store validated query data in context
      c.set("validatedQuery", validatedData);
      
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({
          error: "Invalid query parameters",
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }, 400);
      }
      
      return c.json({
        error: "Invalid query parameters"
      }, 400);
    }
  };
};

// Extend Hono context to include validated data
declare module "hono" {
  interface ContextVariableMap {
    validatedData: any;
    validatedQuery: any;
  }
}
