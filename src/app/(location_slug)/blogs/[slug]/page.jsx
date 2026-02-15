import "../../../styles/blogs.css";
import { fetchPageData,fetchMenuData, generateMetadataLib } from "@/lib/sheets";
import { db } from "@/lib/firestore";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
  const { slug } = params;

  const metadata = await generateMetadataLib({
    category: 'blogs',
    page: slug
  });
  return metadata;
}

async function getBlogById(id) {
  if (!id) return null;

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
            {block.data.items.map((item, i) => (
              <li
                key={i}
                dangerouslySetInnerHTML={{ __html: item }}
              />
            ))}
          </ol>
        ) : (
          <ul key={index}>
            {block.data.items.map((item, i) => (
              <li
                key={i}
                dangerouslySetInnerHTML={{ __html: item }}
              />
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

return (
  <main className="aero_blog_detail_page">
    <section className="aero_blog_container">

      {/* Featured Image */}
      {data?.featuredImage && (
        <div className="aero_blog_featured_image">
          <img
            src={data.featuredImage}
            alt={data.title}
          />
        </div>
      )}

      {/* Title */}
      <h1 className="aero_blog_title">{data?.title}</h1>

      {/* Meta (optional) */}
      {data?.updatedAt && (
        <p className="aero_blog_meta">
          Last updated on{" "}
          {new Date(data.updatedAt.seconds * 1000).toDateString()}
        </p>
      )}

      {/* Content */}
      <article className="aero_blog_content">
        {renderEditorBlocks(data?.content?.blocks)}
      </article>

    </section>
  </main>
);

}
