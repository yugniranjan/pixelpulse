import Head from "next/head";

export default function DynamicJsonLd({ baseSchema, pageSchemas = [] }) {
  if (!baseSchema) return null;

  // Ensure baseSchema and pageSchemas are arrays of objects
  const baseArray = Array.isArray(baseSchema) ? baseSchema : [baseSchema];
  const allSchemas = [...baseArray, ...pageSchemas];

  // Normalize @type to arrays, keep all schemas
  const graphEntities = allSchemas.map((schema) => {
    const types = schema["@type"];
    return {
      ...schema,
      "@type": Array.isArray(types) ? types : [types],
    };
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": graphEntities,
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </Head>
  );
}
