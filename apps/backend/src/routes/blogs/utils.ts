import { prisma } from "@repo/db";

export async function processTagsInBackground(blogId: string, tagnames: string[]) {
  try {
    for (const tagname of tagnames) {
      const tag = await prisma.tag.upsert({
        where: { tagName: tagname.toLowerCase() },
        update: {},
        create: { tagName: tagname.toLowerCase() },
      });

      await prisma.blog.update({
        where: { id: blogId },
        data: {
          tags: {
            connect: { id: tag.id },
          },
        },
      });
    }
  } catch (err: any) {
    console.error(err.message);
  }
}