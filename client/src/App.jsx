import React from "react";
import { Route, Routes } from "react-router-dom";
import { AuthLayout, GuestLayout } from "./pages/Layout";
import AuthPage from "./pages/AuthPage";
import PreviewPage from "./pages/PreviewPage";
import HomePage from "./pages/HomePage";
import BuilderPage from "./pages/BuilderPage";

const App = () => {
  return (
    <>
      <Routes>
        {"// login Route"}
        <Route element={<GuestLayout />}>
          <Route path="/login" element={<AuthPage mode="login" />}></Route>
          <Route path="/register" element={<AuthPage mode="register" />} />
        </Route>
        {"// protected Route"}
        <Route element={<AuthLayout />}>
          <Route path="/" element={<HomePage />}></Route>
          <Route path="/Builder/:id" element={<BuilderPage />} />
          <Route path="/Preview/:id" element={<PreviewPage />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
