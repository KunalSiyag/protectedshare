import { makeOgImage } from "../../../lib/og";
import { getBlogPost } from "../../../lib/blog";

export const alt = "ProtectedShare Blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return makeOgImage("ProtectedShare Blog", "Security guides and updates");
  }

  return makeOgImage(post.title, post.description);
}
