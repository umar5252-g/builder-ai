import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/api";
import Loading from "../components/Loading";
import PreviewPanel from "../components/PreviewPanel";

const PreviewPage = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    const fetchProject = async () => {
      try {
        const { data } = await api.get(`/api/projects/${id}`);
        setProject(data);
      } catch (err) {
        console.error("Failed to load preview project", err);
        setError("Failed to load project preview");
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  if (loading) return <Loading />;
  if (error || !project) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50 text-zinc-600">
        <p>{error || "Project not found"}</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-white">
      <PreviewPanel project={project} activeFile="/App.js" showCode={false} />
    </div>
  );
};

export default PreviewPage;
