import { prisma } from "@repo/db";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcrypt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "email@gmail.com",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "your password",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        try {
          // find user in db
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });
          if (!user || !user.password) {
            return null;
          }
          // compare password
          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isValid) {
            return null;
          }

          return { id: user.id, name: user.username, email: user.email };
        } catch (err: any) {
          console.error(`auth errir: `, err.message);
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email as string },
          });
          if (!existingUser) {
            const newUser = await prisma.user.create({
              data: {
                email: user.email as string,
                username: user.name || "Anonymous",
                image: user.image,
              },
            });
            user.id = newUser.id;
          } else {
            user.id = existingUser.id;
            if (existingUser.image !== user.image) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: { image: user.image },
              });
            }
          }
        } catch (err: any) {
          console.error(err.message);
          return false;
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token, user }) {
      if (user) {
        console.log(`token::`, token);
        token.id = user.id;
      }
      console.log(`token==`, token);
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id;

        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id },
            select: { id: true, username: true, email: true, image: true },
          });
          if (dbUser) {
            session.user.name = dbUser.username;
            session.user.email = dbUser.email;
            session.user.image = dbUser.image;
          }
        } catch (err: any) {
          console.error(`session callback error`,err.message);
        }
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
