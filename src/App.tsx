import { HashRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import GlassBackground from "./components/GlassBackground";
import TopNav from "./components/TopNav";
import PostList from "./components/PostList";
import PostView from "./components/PostView";
import LoginPage from "./components/LoginPage";
import NewPostPage from "./components/NewPostPage";
import EditPostPage from "./components/EditPostPage";
import RequireEditor from "./components/RequireEditor";

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <GlassBackground />
        <div className="page">
          <TopNav />
          <Routes>
            <Route path="/" element={<PostList />} />
            <Route path="/post/:slug" element={<PostView />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/novo"
              element={
                <RequireEditor>
                  <NewPostPage />
                </RequireEditor>
              }
            />
            <Route
              path="/post/:slug/editar"
              element={
                <RequireEditor>
                  <EditPostPage />
                </RequireEditor>
              }
            />
          </Routes>
          <footer className="site-footer">
            feito com vidro, névoa e alguns arquivos .json
          </footer>
        </div>
      </HashRouter>
    </AuthProvider>
  );
}
