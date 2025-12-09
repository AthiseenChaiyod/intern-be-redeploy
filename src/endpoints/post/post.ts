import jwt from "jsonwebtoken";
import { api, APIError, Cookie } from "encore.dev/api";
import { eq } from "drizzle-orm";
import { post, user } from "../../../drizzle/schema";
import { orm } from "../../../drizzle/database";

//* REUSABLE INTERFACE

interface Post {}

//* GET ALL POSTS

interface GetAllPostsResponse {
  statusCode: number;
  message: string;

  data: any;
}

export const getAllPosts = api<void, GetAllPostsResponse>(
  {
    path: "/post/get",
    method: "GET",
    expose: false,
    auth: false,
    sensitive: false,
  },

  async () => {
    const result = await orm
      .select({
        id: post.id,
        title: post.title,
        category: post.category,
        excerpt: post.excerpt,
        content: post.content,
        author: user.username,
        date: post.created_at,
      })
      .from(post)
      .leftJoin(user, eq(user.id, post.user_id));

    return {
      statusCode: 200,
      message: "This is get all posts",

      data: result,
    };
  }
);

//* GET POST(S) BY "USER ID"

interface GetPostByUserIdProps {
  userId: string;
}
interface GetPostByUserIdResponse {
  statusCode: number;
  message: string;

  data: any;
}

export const getPostByUserId = api<
  GetPostByUserIdProps,
  GetPostByUserIdResponse
>(
  {
    path: "/post/get/user/:userId",
    method: "GET",
    expose: false,
    auth: false,
    sensitive: true,
  },

  async ({ userId }) => {
    const result = await orm
      .select({
        id: post.id,
        title: post.title,
        category: post.category,
        excerpt: post.excerpt,
        content: post.content,
        author: user.username,
        date: post.created_at,
      })
      .from(post)
      .where(eq(post.user_id, userId))
      .leftJoin(user, eq(user.id, userId));

    return {
      statusCode: 200,
      message: "This is get post by user id",

      data: result,
    };
  }
);

//* GET POST BY "POST ID"
interface GetPostByPostIdProps {
  postId: string;
}
interface GetPostByPostIdResponse {
  statusCode: number;
  message: string;

  data: any;
}

export const getPostByPostId = api<
  GetPostByPostIdProps,
  GetPostByPostIdResponse
>(
  {
    path: "/post/get/id/:postId",
    method: "GET",
    expose: false,
    auth: false,
    sensitive: false,
  },
  async ({ postId }) => {
    const result = (
      await orm
        .select({
          id: post.id,
          title: post.title,
          category: post.category,
          excerpt: post.excerpt,
          content: post.content,
          author: user.username,
          date: post.created_at,
        })
        .from(post)
        .where(eq(post.id, postId))
        .leftJoin(user, eq(user.id, post.user_id))
        .limit(1)
    )[0];

    return {
      statusCode: 200,
      message: `Get post with [post id]: ${postId} success`,

      data: result,
    };
  }
);

//* CREATE POST
interface CreatePostProps {
  cookie: Cookie<"cookie">;

  title: string;
  category: "news" | "business" | "security" | "technology";
  excerpt: string;
  content: string;
}
interface CreatePostResponse {
  statusCode: number;
  message: string;

  data: any;
}

export const createPost = api<CreatePostProps, CreatePostResponse>(
  {
    path: "/post",
    method: "POST",
    expose: false,
    auth: false,
    sensitive: false,
  },

  async ({ cookie, title, content, category, excerpt }) => {
    const payload = jwt.decode(cookie.value) as any;
    console.log(payload.id);

    await orm.insert(post).values({
      user_id: payload.id,
      title: title,
      category: category,
      excerpt: excerpt,
      content: content,
    });
    const result = await getPostByUserId({ userId: payload.id });

    return {
      statusCode: 201,
      message: "Post has been created",

      data: result,
    };
  }
);

//* PATCH POST
interface PatchPostProps {
  postId: string;
  title: string;
  content: string;
}
interface PatchPostResponse {
  statusCode: number;
  message: string;
}

export const patchPost = api<PatchPostProps, PatchPostResponse>(
  {
    path: "/post/patch/:postId",
    method: "PATCH",
    expose: false,
    auth: false,
    sensitive: false,
  },

  async ({ postId, title, content }) => {
    await orm
      .update(post)
      .set({ title: title, content: content })
      .where(eq(post.id, postId));

    return {
      statusCode: 204,
      message: `Post id: ${postId} has been updated`,
    };
  }
);

//* DELETE POST
interface DeletePostProps {
  postId: string;
}
interface DeletePostResponse {
  statusCode: number;
  message: string;
}

export const deletePost = api<DeletePostProps, DeletePostResponse>(
  {
    path: "/post/delete/:postId",
    method: "DELETE",
    expose: false,
    auth: false,
    sensitive: false,
  },

  async ({ postId }) => {
    await orm.delete(post).where(eq(post.id, postId));

    return {
      statusCode: 204,
      message: `Post id: ${postId} has been deleted`,
    };
  }
);
