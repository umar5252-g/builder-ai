import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { api } from "../api/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import debounce from "lodash.debounce";

const AppContext = createContext(undefined);

export function AppContextProvider({ children }) {
  const navigate = useNavigate();

  // auth states
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // states
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [activeProject, setActiveProject] = useState(null);
  const [loadingActiveProject, setLoadingActiveProject] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [generatingProject, setGeneratingProject] = useState(false);
  const [activeFile, setActiveFile] = useState("/App.js");
  const [showCode, setShowCode] = useState(false);

  // auth actions
  const createSession = async () => {
    try {
      const { data } = await api.get("/api/auth/me");
      setUser(data.user);
    } catch (err) {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };
  useEffect(() => {
    createSession();
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      setUser(data.user);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      console.error("Login failed", err);
      const errMsg = err?.response?.data?.error || "Invalid email or password";
      toast.error(errMsg);
      throw new Error(errMsg);
    }
  };
  const register = async (name, email, password) => {
    try {
      const { data } = await api.post("/api/auth/register", {
        name,
        email,
        password,
      });
      setUser(data.user);
      toast.success("Account created successfully");
      navigate("/");
    } catch (err) {
      console.error("Registration failed", err);
      const errMsg = err?.response?.data?.error || "Registration failed";
      toast.error(errMsg);
      throw new Error(errMsg);
    }
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
      setUser(null);
      setProjects([]);
      setActiveProject(null);
      toast.success("logged out successfully");
      navigate("/login");
    } catch (err) {
      console.error("logout failed", err);
      toast.error("logout failed");
    }
  };

  const loadProjects = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get("/api/projects");
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("failed to list projects", err);
      toast.error("failed to load projects list");
    } finally {
      setLoadingProjects(false);
    }
  }, [user]);

  const loadProject = useCallback(async (id, silent = false) => {
    if (!user) return;
    if (!silent) setLoadingActiveProject(true);
    try {
      const { data } = await api.get(`/api/projects/${id}`);
      setActiveProject(data);
      // default file selection
      const files = Object.keys(data.files || {});
      if (files.length > 0) {
        setActiveFile((prev) => {
          if (files.includes(prev)) return prev;
          if (files.includes("/App.js")) return "/App.js";
          return files[0];
        });
      }
    } catch (err) {
      console.error("failed to load project", err);
    } finally {
      if (!silent) setLoadingActiveProject(false);
    }
  }, [user]);

  // Automatically poll active project status while it is being generated.
  useEffect(() => {
    if (!activeProject?._id || !user) return;
    const isOngoing = ["generating", "pending", "revising"].includes(
      activeProject.status,
    );

    setChatLoading(isOngoing);
    if (!isOngoing) return;

    const interval = setInterval(
      () => loadProject(activeProject._id, true),
      2000,
    );
    return () => clearInterval(interval);
  }, [activeProject?._id, activeProject?.status, loadProject, user]);

  const handleGenerate = useCallback(
    async (prompt) => {
      if (!user) {
        return;
      }
      setGeneratingProject(true);
      try {
        const { data } = await api.post("/api/projects", { prompt });
        toast.success("AI agent is planning the structure...");
        if (data?._id) {
          setProjects((prev) => [data, ...prev]);
          navigate(`/builder/${data._id}`);
        }
      } catch (err) {
        console.error("failed to generate project", err);
        toast.error(err?.response?.data?.error || "failed to generate project");
      } finally {
        setGeneratingProject(false);
      }
    },
    [navigate, user],
  );
  const handleDelete = useCallback(
    async (id) => {
      if (!user) {
        return;
      }
      try {
        await api.delete(`/api/projects/${id}`);
        setProjects((prev) => prev.filter((p) => p._id !== id));
        toast.success("Project deleted successfully");
      } catch (err) {
        console.error("failed to delete the project", err);
        toast.error(err?.response?.data?.error || "failed to delete project");
      }
    },
    [user],
  );

  const handleChat = useCallback(
    async (prompt) => {
      if (!activeProject || !user) return;
      setChatLoading(true);

      try {
        const { data } = await api.post(
          `/api/projects/${activeProject._id}/chat`,
          { prompt },
        );
        setActiveProject(data);
        if (data.errors && data.errors.length > 0) {
          toast.success(`${data.errors.length} revision patch(es) failed`);
        } else {
          toast.success(`Updated to version ${data.version}`);
        }
      } catch (error) {
        console.error("Revision request failed", error);
        toast.error(error?.response?.data?.error || "Revision request failed");
      } finally {
        setChatLoading(false);
      }
    },
    [activeProject, user],
  );

  const debouncedSave = useMemo(
    () =>
      debounce(async (files, id) => {
        try {
          await api.put(`/api/projects/${id}/files`, { files });
        } catch (err) {
          console.log("failed to auto-save files: ", err);
          toast.error("Failed to save code modifications");
        }
      }, 1000),
    [],
  );

  useEffect(() => {
    return () => {
      debouncedSave.flush();
    };
  }, [debouncedSave]);

  const updateProjectFiles = useCallback(
    async (files) => {
      if (!activeProject || !user) return;
      debouncedSave(files, activeProject._id);
    },
    [activeProject, user, debouncedSave],
  );

  return (
    <>
      <AppContext.Provider
        value={{
          user,
          loadingUser,
          login,
          register,
          logout,
          projects,
          loadingProjects,
          activeProject,
          loadingActiveProject,
          chatLoading,
          generatingProject,
          activeFile,
          showCode,
          setActiveFile,
          setShowCode,
          loadProjects,
          loadProject,
          handleGenerate,
          handleDelete,
          handleChat,
          updateProjectFiles,
        }}
      >
        {children}
      </AppContext.Provider>
    </>
  );
}
// a place where authentication realted data can be stored

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
}
