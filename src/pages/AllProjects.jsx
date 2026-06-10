import React, { useContext, useEffect, useMemo, useState } from "react";
import { AppConetxt } from "../context/context";
import ProjectsPagination from "../components/ProjectsPagination";

const DEFAULT_LIMIT = 10;

const AllProjects = () => {
  const { allProjects, navigate, deleteProject, getAllProjects } =
    useContext(AppConetxt);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  useEffect(() => {
    getAllProjects();
  }, []);

  const total = allProjects?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedProjects = useMemo(() => {
    if (!allProjects?.length) return [];
    const start = (page - 1) * limit;
    return allProjects.slice(start, start + limit);
  }, [allProjects, page, limit]);

  const rowOffset = (page - 1) * limit;

  const handleLimitChange = (nextLimit) => {
    setLimit(nextLimit);
    setPage(1);
  };

  const handleDelete = async (id) => {
    const isLastOnPage = paginatedProjects.length === 1 && page > 1;
    await deleteProject(id);
    if (isLastOnPage) setPage((p) => p - 1);
  };

  if (!allProjects) {
    return (
      <div className="admin-page flex min-h-[40vh] items-center justify-center">
        <p className="text-cream-muted">Loading projects…</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="admin-page-title">All Projects</h1>
          <p className="admin-page-subtitle">
            Manage, update, or delete existing projects.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/addProject")}
          className="admin-btn-primary"
        >
          + Add New Project
        </button>
      </header>

      {allProjects.length > 0 ? (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sr.</th>
                  <th>Project Name</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>On website</th>
                  <th>Contact</th>
                  <th>RERA possession</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProjects.map((project, i) => (
                  <tr key={project._id}>
                    <td className="cell-strong">{rowOffset + i + 1}</td>
                    <td className="cell-strong whitespace-nowrap">{project.name}</td>
                    <td>{project.location}</td>
                    <td>{project.status || "Under Construction"}</td>
                    <td>
                      <span
                        className={
                          project.active !== false
                            ? "inline-flex rounded-full bg-emerald-900/40 px-2 py-0.5 text-xs text-emerald-300"
                            : "inline-flex rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-400"
                        }
                      >
                        {project.active !== false ? "Visible" : "Hidden"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">
                      {(() => {
                        let d = String(project.contactNumber || "").replace(/\D/g, "");
                        if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
                        if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
                        return d ? (
                          <a href={`tel:+91${d}`} className="link-gold">
                            {d}
                          </a>
                        ) : (
                          "—"
                        );
                      })()}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/updateProject/${project._id}`)}
                          className="admin-btn-secondary !py-1.5 !text-xs"
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(project._id)}
                          className="admin-btn-danger !py-1.5 !text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ProjectsPagination
            page={page}
            limit={limit}
            total={total}
            onPageChange={setPage}
            onLimitChange={handleLimitChange}
          />
        </>
      ) : (
        <div className="admin-card admin-empty">
          No projects found. Get started by adding a new one.
        </div>
      )}
    </div>
  );
};

export default AllProjects;
