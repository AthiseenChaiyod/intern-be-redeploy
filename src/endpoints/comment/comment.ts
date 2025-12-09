import { api } from "encore.dev/api";
import { desc, eq } from "drizzle-orm";
import { orm } from "../../../drizzle/database";
import { comment, user } from "../../../drizzle/schema";

//* REUSABLE INTERFACE
interface Comment {}

//* GET ALL POSTS
interface GetAllCommentsResponse {
  statusCode: number;
  message: string;

  data: any;
}

export const getAllComments = api<void, GetAllCommentsResponse>(
  {
    path: "/comment/get",
    method: "GET",
    expose: false,
    auth: false,
    sensitive: false,
  },
  async () => {
    const result = await orm.select().from(comment);

    return {
      statusCode: 200,
      message: "This is get all comments",

      data: result,
    };
  }
);

//* GET COMMENT BY POST ID
interface GetCommentByPostIdProps {
  postId: string;
}
interface GetCommentByPostIdResponse {
  statusCode: number;
  message: string;

  data: any;
}

export const getCommentByPostId = api<
  GetCommentByPostIdProps,
  GetCommentByPostIdResponse
>(
  {
    path: "/comment/get/:postId",
    method: "GET",
    expose: false,
    auth: false,
    sensitive: true,
  },

  async ({ postId }) => {
    const result = await orm
      .select({
        id: comment.id,
        content: comment.content,
        date: comment.created_at,
        userId: user.id,
        user: user.username,
      })
      .from(comment)
      .where(eq(comment.post_id, postId))
      .leftJoin(user, eq(user.id, comment.user_id))
      .orderBy(desc(comment.created_at));

    return {
      statusCode: 200,
      message: "This is get comment by post id",

      data: result,
    };
  }
);

//* CREATE COMMENT
interface CreateCommentProps {
  username: string;
  postId: string;
  content: string;
}
interface CreateCommentResponse {
  statusCode: number;
  message: string;

  data: any;
}

export const createComment = api<CreateCommentProps, CreateCommentResponse>(
  {
    path: "/comment",
    method: "POST",
    expose: false,
    auth: false,
    sensitive: true,
  },

  async ({ username, postId, content }) => {
    const { id } = (
      await orm
        .select({ id: user.id })
        .from(user)
        .where(eq(user.username, username))
        .limit(1)
    )[0];

    await orm
      .insert(comment)
      .values({ user_id: id, post_id: postId, content: content });
    const result = await getCommentByPostId({ postId: postId });

    return {
      statusCode: 201,
      message: "This is create comment",

      data: result.data,
    };
  }
);

//* PATCH POST

interface PatchCommentProps {}
interface PatchCommentResponse {
  statusCode: number;
  message: string;
}

export const patchComment = api<PatchCommentProps, PatchCommentResponse>(
  {
    path: "/comment",
    method: "PATCH",
    expose: false,
    auth: false,
    sensitive: false,
  },

  async ({}) => {
    return {
      statusCode: 200,
      message: "This is patch comment",
    };
  }
);

//* DELETE POST

interface DeleteCommentProps {}
interface DeleteCommentResponse {
  statusCode: number;
  message: string;
}

export const deleteComment = api<DeleteCommentProps, DeleteCommentResponse>(
  {
    path: "/comment",
    method: "DELETE",
    expose: false,
    auth: false,
    sensitive: false,
  },

  async ({}) => {
    return {
      statusCode: 200,
      message: "This is delete comment",
    };
  }
);
