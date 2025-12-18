import "dotenv/config";
import { api, APIError, Cookie } from "encore.dev/api";
import { hash, compare } from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { user } from "../../../drizzle/schema";
import { orm } from "../../../drizzle/database";

interface SignUpProps {
  username: string;
  password: string;
  email: string;
  role?: "user" | "admin";
}
interface SignUpResponse {
  statusCode: number;
  message: string;
}

export const signUp = api<SignUpProps, SignUpResponse>(
  {
    path: "/sign-up",
    method: "POST",
    expose: true,
    auth: false,
    sensitive: true,
  },

  async ({ username, password, email, role }) => {
    const saltRound = 12;
    const hashedPassword = await hash(password, saltRound);

    await orm.insert(user).values({
      username: username,
      password: hashedPassword,
      email: email,
      role: role ? role : "user",
    });

    return {
      statusCode: 201,
      message: `User has been created`,
    };
  }
);

interface SignInProps {
  username: string;
  password: string;
}
interface SignInResponse {
  cookie: Cookie<"cookie">;

  token: string;
  userData: { username: string; role: "user" | "admin" | null };
}

export const signIn = api<SignInProps, SignInResponse>(
  {
    path: "/sign-in",
    method: "POST",
    expose: true,
    auth: false,
    sensitive: true,
  },
  async ({ username, password }) => {
    const queriedUser = (
      await orm.select().from(user).where(eq(user.username, username)).limit(1)
    )[0];

    const isPasswordCorrect = await compare(password, queriedUser.password);

    if (!isPasswordCorrect) {
      throw APIError.unauthenticated("Invalid credentials");
    }

    const cookie = jwt.sign({ id: queriedUser.id }, process.env.JWT_SECRET!, {
      expiresIn: "12h",
    });
    const bearerToken = jwt.sign(
      { username: queriedUser.username, role: queriedUser.role },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" }
    );

    return {
      cookie: {
        value: cookie,
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        maxAge: 60 * 60 * 12,
        path: "/",
      },

      userData: { username: queriedUser.username, role: queriedUser.role },
      token: bearerToken,
    };
  }
);

interface SignOutResponse {
  cookie: Cookie<"cookie">;
}

export const signOut = api<void, SignOutResponse>(
  {
    path: "/sign-out",
    method: "POST",
    expose: true,
    auth: false,
    sensitive: false,
  },
  async () => {
    return {
      cookie: {
        value: "",
        maxAge: 0,
      },
    };
  }
);

interface AuthStatusProps {
  cookie?: Cookie<"cookie">;
}
interface AuthStatusResponse {
  statusCode: number;
  message: string;

  userData: { username: string; role: "user" | "admin" | "guest" | null };
  token: string;
}

export const authStatus = api<AuthStatusProps, AuthStatusResponse>(
  {
    path: "/auth-status",
    method: "GET",
    expose: true,
    auth: false,
    sensitive: true,
  },
  async ({ cookie }) => {
    if (!cookie) {
      return {
        statusCode: 401,
        message: "This is a success message",

        userData: { username: "", role: "guest" },
        token: "",
      };
    }

    if (!jwt.verify(cookie.value, process.env.JWT_SECRET!)) {
      throw APIError.unauthenticated("NAH");
    }

    const payload = jwt.decode(cookie.value, {
      json: true,
    }) as any;

    const userData = (
      await orm
        .select({ username: user.username, role: user.role })
        .from(user)
        .where(eq(user.id, payload.id))
        .limit(1)
    )[0];

    const token = jwt.sign(userData, process.env.JWT_SECRET!, {
      expiresIn: "15m",
    });

    return {
      statusCode: 200,
      message: "This is a success message",

      userData: userData,
      token: token,
    };
  }
);
