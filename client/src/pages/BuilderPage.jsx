import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import BuilderHeader from "../components/BuilderHeader";
import Loading from "../components/Loading";
import { FolderTreeIcon, MessageSquareIcon } from "lucide-react";
import ChatPanel from "../components/ChatPanel";
import PreviewPanel from "../components/PreviewPanel";
import FileExplorer from "../components/FileExplorer";
import { exportProjectZip } from "../utils/exportProject";
import api from "../api/api";
import toast from "react-hot-toast";
import AgentProgressDashboard from "../components/AgentProgressDashboard";
import PublishModel from "../components/PublishModel";

const BuilderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [leftTab, setLeftTab] = useState("chat");
  const [publishing, setPublishing] = useState(false);
  const [publishUrl, setPublishUrl] = useState(null);

  const {
    activeProject,
    loadingActiveProject,
    activeFile,
    showCode,
    setActiveFile,
    setShowCode,
    loadProject,
    logout,
    chatLoading,
    handleChat,
  } = useAppContext();

  useEffect(() => {
    if (!id) return;
    loadProject(id);
  }, [id, loadProject]);

  // useEffect(() => {
  //   if (!id || !activeProject) return;
  //   if (
  //     activeProject.status === "generating" ||
  //     activeProject.status === "pending"
  //   ) {
  //     const interval = setInterval(() => {
  //       loadProject(id, true);
  //     }, 1500);
  //     return () => clearInterval(interval);
  //   }
  // }, [id, loadProject, activeProject]);

  const handleOpenPreview = () => {
    if (!id) return;

    window.open(`/preview/${id}`, "_blank");
  };

  const handlePublish = async () => {
    if (!id || publishing) return;
    setPublishing(true);
    try {
      await api.post(`/api/projects/${id}/publish`);
      toast.success("Project published successfully!");
      setPublishUrl(`${window.location.origin}/publish/${id}`);
    } catch (err) {
      console.error("Publish failed:", err);
      toast.error("Failed to publish project");
    } finally {
      setPublishing(false);
    }
  };

  const handleDownload = () => {
    if (!activeProject) return;
    exportProjectZip(activeProject);
  };

  if (loadingActiveProject || !activeProject) {
    return <Loading />;
  }

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden text-zinc-900 relative">
      {/* Top Bar header */}

      <BuilderHeader
        projectName={activeProject.name}
        version={activeProject.version}
        showCode={showCode}
        publishing={publishing}
        onToggleShowCode={() => setShowCode(!showCode)}
        onOpenPreview={handleOpenPreview}
        onPublish={handlePublish}
        onDownload={handleDownload}
        onBack={() => navigate("/")}
        onLogout={logout}
      />

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* left Sidebar */}
        <div className="w-[320px] shrink-0 flex flex-col border-r border-zinc-200 bg-white">
          <div className="flex border-b border-zinc-100">
            <button
              onClick={() => setLeftTab("chat")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium cursor-pointer ${leftTab === "chat" ? "text-zinc-900 border-b-2 border-zinc-900 " : "text-zinc-400 hover:text-zinc-700"}`}
            >
              <MessageSquareIcon size={13} /> Chat
            </button>
            <button
              onClick={() => setLeftTab("files")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium cursor-pointer ${leftTab === "files" ? "text-zinc-900 border-b-2 border-zinc-900 " : "text-zinc-400 hover:text-zinc-700"}`}
            >
              <FolderTreeIcon size={13} /> Files
            </button>
          </div>
          {/* Sidebar Tabs */}
          <div className="flex-1 overflow-hidden">
            {leftTab === "chat" ? (
              <ChatPanel
                messages={activeProject.messages}
                onSend={handleChat}
                loading={chatLoading}
              />
            ) : (
              <FileExplorer
                files={activeProject.files}
                activeFile={activeFile}
                onFileSelect={setActiveFile}
              />
            )}
          </div>
        </div>
        {/* Preview / Code Area */}
        <div className="flex-1 overflow-hidden">
          {activeProject.status === "pending" ||
          activeProject.status === "generating" ||
          activeProject.status === "failed" ? (
            <AgentProgressDashboard project={activeProject} />
          ) : (
            <PreviewPanel
              project={activeProject}
              activeFile={activeFile}
              showCode={showCode}
            />
          )}
        </div>
      </div>
      {publishUrl && (
        <PublishModel
          publishUrl={publishUrl}
          onClose={() => setPublishUrl(null)}
        />
      )}
    </div>
  );
};

export default BuilderPage;
