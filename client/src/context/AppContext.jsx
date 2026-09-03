import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { api } from "../api/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

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
  const [generatinProject, setGeneratingProject] = useState(false);
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
  }, [createSession]);

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

  const loadProjects = async () => {
    if (!user) return;
    try {
      const { data } = await api.get("/api/auth/projects");
      setProjects(data);
    } catch (err) {
      console.error("failed to list projects", err);
      toast.error("failed to load projects list");
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadProject = async (id, silent = false) => {
    if (!user) return;
    if (!silent) setLoadingActiveProject(true);
    try {
      const { data } = await api.get(`api/projects/${id}`);
      setActiveProject(data);
      // default file selection
      const files = object.keys(data.files);
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

    //automatically poll active project status if pending or loading
    useEffect(() => {
      if (!activeProject?._id || !user) return;
      const isOngoing =
        activeProject.status === "generating" ||
        activeProject.status === "pending" ||
        activeProject.status === "revising";

      if (isOngoing) {
        setChatLoading(true);
        const intervel = setInterval(
          () => loadProject(activeProject?._id, true),
          2000,
        );
        return () => clearInterval(intervel);
      } else {
        setChatLoading(true);
      }
    }, [activeProject?.id, activeProject?.status, loadProject, user]);
  };

  const handleGenerate = useCallback(
    async (prompt) => {
      if (!user) {
        return;
      }
      setGeneratingProject(true);
      try {
        const { data } = await api.post("api/projects", { prompt });
        toast.success("AI agent is planning the structure...");
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
    async (prompt) => {
      if (!user) {
        return;
      }
      try {
        await api.delete(`api/projects/${id}`, { prompt });
        setProjects((prev) => prev.filter((p) => p._id !== id));
        toast.success("Project deleted successfully");
      } catch (err) {
        console.error("failed to delete the project", err);
        toast.error(err?.response?.data?.error || "failed to delete project");
      }
    },
    [user],
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
          generatinProject,
          activeFile,
          setShowCode,
          loadProjects,
          handleGenerate,
          handleDelete,
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
