import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const classifyLeafPhoto = createServerFn({ method: "POST" })
  .validator((data) => z.object({ image: z.string().max(4_000_000) }).parse(data))
  .handler(async ({ data }) => {
    const { classifyLeaf } = await import("./leaf-ai.server");
    return classifyLeaf(data.image);
  });
