export const dynamic = "force-dynamic";
import "../../../styles/blogs.css";
import {
  fetchPageData,
  fetchMenuData,
  generateMetadataLib,
} from "@/lib/sheets";
import { db } from "@/lib/firestore";
import { notFound } from "next/navigation";

export async function generateMetadata({ params, searchParams }) {
  const id = searchParams?.uid;
  const BASE_URL = process.env.SITE_URL;

  if (!id || !db) return {};

  const doc = await db.collection("blogs").doc(id).get();

  if (!doc.exists) {
    return {};
  }

  const data = doc.data();

  const title = data?.title || "Blog";
  const description =
    data?.metaDescription ||
    data?.excerpt ||
    "Read this blog on Pixel Pulse Play.";

  const image =
    data?.featuredImage ||
    "https://storage.googleapis.com/pixel-pulse-play/web/h-Logo.png";

  const url = `${BASE_URL}/blogs/${params.slug}?uid=${id}`;

  return {
    title,
    description,

    alternates: {
      canonical: url,
    },

    robots: {
      index: true,
      follow: true,
    },

    openGraph: {
      type: "article",
      url,
      title,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

async function getBlogById(id) {
  if (!id || !db) return null;

  const doc = await db.collection("blogs").doc(id).get();

  if (!doc.exists) return null;
  const data = doc.data();

  let content = data.content;
  if (typeof content === "string") {
    try {
      content = JSON.parse(content);
    } catch {
      content = null;
    }
  }

  return {
    id: doc.id,
    ...data,
    content,
  };
}

function renderEditorBlocks(blocks) {
  if (!Array.isArray(blocks)) return null;

  return blocks.map((block, index) => {
    switch (block.type) {
      case "paragraph":
        return (
          <p
            key={index}
            dangerouslySetInnerHTML={{
              __html: block.data.text,
            }}
          />
        );

      case "header": {
        const Tag = `h${block.data.level || 2}`;
        return (
          <Tag
            key={index}
            dangerouslySetInnerHTML={{
              __html: block.data.text,
            }}
          />
        );
      }

      case "list":
        return block.data.style === "ordered" ? (
          <ol key={index}>
            {block.data.items.map(
              (item, i) => (
                console.log("item", item),
                (
                  <li
                    key={i}
                    dangerouslySetInnerHTML={{ __html: item?.content }}
                  />
                )
              ),
            )}
          </ol>
        ) : (
          <ul key={index}>
            {block.data.items.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: item?.content }} />
            ))}
          </ul>
        );

      case "image":
        return (
          <figure key={index}>
            <img
              src={block.data.file?.url}
              alt={block.data.caption || ""}
              style={{ maxWidth: "100%" }}
            />
            {block.data.caption && (
              <figcaption>{block.data.caption}</figcaption>
            )}
          </figure>
        );

      case "quote":
        return (
          <blockquote key={index}>
            <p>{block.data.text}</p>
            {block.data.caption && <cite>{block.data.caption}</cite>}
          </blockquote>
        );

      default:
        return null;
    }
  });
}

export default async function BlogDetail({ searchParams }) {
  const id = searchParams?.uid;

  const data = await getBlogById(id);

  if (!data) {
    notFound();
  }

  // console.log("Blog Data:", data?.content?.blocks);

  return (
    <main className="aero_blog_detail_page">
      <section className="aero_blog_container">
        {/* Featured Image */}
        {data?.featuredImage && (
          <div className="aero_blog_featured_image">
            <img src={data.featuredImage} alt={data.title} />
          </div>
        )}

        {/* Title */}
        <h1 className="aero_blog_title">{data?.title}</h1>

        {/* Meta (optional) */}
        {data?.updatedAt && (
          <p className="aero_blog_meta">
            Last updated on{" "}
            {data?.updatedAt?.seconds
              ? new Date(data.updatedAt.seconds * 1000).toDateString()
              : null}
          </p>
        )}

        {/* Content */}
        <article className="aero_blog_content">
          {renderEditorBlocks(data?.content?.blocks)}
        </article>
      </section>

      {/* Blog Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: data?.title,
            image: data?.featuredImage,
            datePublished: data?.createdAt?.seconds
              ? new Date(data.createdAt.seconds * 1000).toISOString()
              : null,
            dateModified: data?.updatedAt?.seconds
              ? new Date(data.updatedAt.seconds * 1000).toISOString()
              : null,
            author: {
              "@type": "Organization",
              name: "Pixel Pulse Play",
            },
          }),
        }}
      />
    </main>
  );
}
