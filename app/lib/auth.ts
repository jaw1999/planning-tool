import { AuthOptions } from "next-auth";

export const authOptions: AuthOptions = {
  providers: [],
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET
}; 