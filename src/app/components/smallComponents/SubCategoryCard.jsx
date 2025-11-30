
import Link from "next/link";
import Image from "next/image";
const SubCategoryCard = ({ attractionsData, location_slug, theme, title, text, parentpath }) => {

  return (
    <section className="aero_home_article_section">
      <h2 className="heading-with-icon" ><svg
        className="promotions__icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"  >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" />
      </svg>{title}</h2>
      <section className="aero-max-container ">

        <ul className="attractions-grid">
          {attractionsData?.map((item, i) => (
            <li key={i}>
              <Link
                href={`/${location_slug}/${item?.parentid}/${item?.path}`}
                prefetch
                key={i}
              >

                <article className="d-flex-dir-col">
                  <figure >
                    <Image
                      src={item?.smallimage}
                      width={330}
                      height={240}
                      alt={item?.title}

                      unoptimized
                    />
                    <figcaption className="figcaption-bg"><h3>{item?.desc}</h3></figcaption>
                  </figure>   </article>
              </Link></li>
          ))}

        </ul>

      </section>

    </section>


  );
};

export default SubCategoryCard