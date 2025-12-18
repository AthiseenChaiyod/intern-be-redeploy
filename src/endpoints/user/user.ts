import { api } from "encore.dev/api";
import { eq } from "drizzle-orm";
import { orm } from "../../../drizzle/database";
import { user } from "../../../drizzle/schema";
import { hash } from "bcrypt";

interface User {
  id: string;

  username: string;
  password: string;
  email: string;
  role?: "user" | "admin";
}

interface UserCredentials {
  username: string;
  password: string;
  email: string;
  role?: "user" | "admin";
}

interface GetAllUsersResponse {
  statusCode: number;
  message: string;

  data: any;
}

export const getAllUsers = api<void, GetAllUsersResponse>(
  {
    path: "/user",
    method: "GET",
    expose: false,
    auth: false,
    sensitive: false,
  },

  async () => {
    const result = await orm.select().from(user);

    return {
      statusCode: 200,
      message: "This is get all users",

      data: result,
    };
  }
);

interface GetUserByUsernameProps {
  username: string;
}
interface GetUserByUsernameResponse {
  statusCode: number;
  message: string;

  data: any;
}

export const getUserByUsername = api<
  GetUserByUsernameProps,
  GetUserByUsernameResponse
>(
  {
    path: "/user/:username",
    method: "GET",
    expose: false,
    auth: false,
    sensitive: false,
  },

  async ({ username }) => {
    const result = await orm
      .select()
      .from(user)
      .where(eq(user.username, username))
      .limit(1);

    return {
      statusCode: 200,
      message: "This is get user by username",

      data: result,
    };
  }
);

interface CreateUserProps {
  credentials: UserCredentials;
}
interface CreateUserResponse {
  statusCode: number;
  message: string;

  data: any;
}

export const createUser = api<CreateUserProps, CreateUserResponse>(
  { path: "/user", method: "POST", expose: true, auth: false, sensitive: true },
  async ({ credentials: { username, password, email, role } }) => {
    await orm.insert(user).values({
      username: username,
      password: password,
      email: email,
      role: role ? role : "user",
    });

    const result = await getUserByUsername({ username: username });

    return {
      statusCode: 201,
      message: "This is create user",

      data: result.data,
    };
  }
);

interface PatchUserProps {
  username: string;
  password: string;
}
interface PatchUserResponse {
  statusCode: number;
  message: string;
}

export const patchUser = api<PatchUserProps, PatchUserResponse>(
  {
    path: "/user",
    method: "PATCH",
    expose: false,
    auth: false,
    sensitive: false,
  },
  async (props) => {
    const saltRound = 12;
    const hashedPassword = await hash(props.password, saltRound);

    await orm
      .update(user)
      .set({ username: props.username, password: hashedPassword })
      .where(eq(user.username, props.username));

    return {
      statusCode: 204,
      message: "User has been updated",
    };
  }
);

interface DeleteUserProps {
  username: string;
}
interface DeleteUserResponse {
  statusCode: number;
  message: string;
}

export const deleteUser = api<DeleteUserProps, DeleteUserResponse>(
  {
    path: "/user",
    method: "DELETE",
    expose: false,
    auth: false,
    sensitive: false,
  },
  async ({ username }) => {
    await orm.delete(user).where(eq(user.username, username));

    return {
      statusCode: 200,
      message: `User: ${username} has been deleted`,
    };
  }
);
