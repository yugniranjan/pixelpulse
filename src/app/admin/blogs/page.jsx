"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "../../styles/blogs-table.css";

export default function AllBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const limit = 10;
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);

    fetch(`/api/blogs?page=${page}&limit=${limit}`)
      .then((res) => res.json())
      .then((res) => {
        // support both formats
        if (Array.isArray(res)) {
          setBlogs(res);
          setTotal(res.length);
        } else {
          setBlogs(res.data);
          setTotal(res.total);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  const filteredBlogs = blogs.filter((blog) =>
    blog.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (blogID) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this blog?");
    if (!confirmDelete) return;

    setLoading(true);

    const res = await fetch(`/api/blogs/${blogID}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (data.success) {
      setBlogs((prevBlogs) => prevBlogs.filter((blog) => blog.id !== blogID));
    }

    setLoading(false);
  };

  if (loading) {
    return <div className="table-wrapper">Loading blogs...</div>;
  }

  return (
    <div className="table-wrapper">
      {/* HEADER */}
      <div className="table-header">
        <h2>Blogs</h2>
        <input
          type="text"
          placeholder="Search blog..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <table className="blogs-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Title</th>
            <th>Status</th>
            <th>Updated</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {blogs.length === 0 && (
            <tr>
              <td colSpan="5" className="no-data">
                No blogs found
              </td>
            </tr>
          )}

          {filteredBlogs.map(
            (blog) => (
              console.log(blog),
              (
                <tr key={blog.id}>
                  <td>
                    <img
                      src={blog.featuredImage || "/assets/images/logo.jpg"}
                      className="table-image"
                      alt="blog"
                    />
                  </td>

                  <td className="title-cell">
                    {blog.title}
                    <Link
                      href={`/admin/blogs/edit/?id=${blog.id}`}
                      className="edit-link"
                    >
                      Edit
                    </Link>
                  </td>

                  <td>
                    <span
                      className={`status-badge ${
                        blog.status === "published" ? "published" : "draft"
                      }`}
                    >
                      {blog.status || "draft"}
                    </span>
                  </td>

                  <td>
                    {blog.updatedAt?._seconds
                      ? new Date(
                          blog.updatedAt._seconds * 1000
                        ).toLocaleString()
                      : "-"}
                  </td>
                  <td>
                    {blog.createdAt?._seconds
                      ? new Date(
                          blog.createdAt._seconds * 1000
                        ).toLocaleString()
                      : "-"}
                  </td>

                  <td>
                    <button onClick={(e) => handleDelete(blog.id)} className="delete-btn">Delete</button>
                  </td>
                </tr>
              )
            )
          )}
        </tbody>
      </table>

      {/* PAGINATION */}
      {/* <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          Prev
        </button>

        <span>
          Page {page} of {totalPages || 1}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div> */}
    </div>
  );
}
