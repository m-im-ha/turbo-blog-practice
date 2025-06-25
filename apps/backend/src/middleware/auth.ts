import "dotenv/config";
import { Context, Next } from "hono";
import jwt from "jsonwebtoken";
import { decode } from "next-auth/jwt";

// interface JWTPayload {
//   id: string;
//   email?: string;
//   name?: string;
//   iat?: number;
//   exp?: number;
//   jti?: string;
// }

declare module "hono" {
  interface ContextVariableMap {
    userId: string;
    userEmail?: string;
    userName?: string;
  }
}

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "No token provided" }, 401);
    }

    const token = authHeader.split(" ")[1];
    if (!process.env.NEXTAUTH_SECRET) {
      console.error("nextauth secret is not set");
      return c.json({ error: "server configuration error" }, 500);
    }

    // verify jwt token
    // const decoded = jwt.verify(
    //   token,
    //   process.env.NEXTAUTH_SECRET
    // ) as JWTPayload;
    // console.log(decoded);
    // if (!decoded.id) {
    //   return c.json({ error: "Invalid token payload" }, 401);
    // }

     // Use NextAuth's decode instead of jwt.verify
    const decoded = await decode({
      token: token,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    if (!decoded || !decoded.id) {
      return c.json({ error: "Invalid token payload" }, 401);
    }

    // add user info to context
    c.set("userId", decoded.id as string);
    c.set("userEmail", decoded.email as string);
    c.set("userName", decoded.name as string);

    await next();
  } catch (err: any) {
    if (err instanceof jwt.JsonWebTokenError) {
      return c.json({ error: "Invalid token" }, 401);
    }
    if (err instanceof jwt.TokenExpiredError) {
      return c.json({ error: "Token expired" }, 401);
    }
    console.error("Auth middleware error:", err);
    return c.json({ error: "Authentication failed" }, 401);
  }
};
