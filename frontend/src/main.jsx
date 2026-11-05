import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";

import "./index.css";
import Login from "./pages/Login.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Furniture from "./pages/Furniture";
import PropertyDetails from "./pages/PropertyDetails.jsx";
import PropertyListing from "./pages/PropertyListing.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/furniture" element={<Furniture />} />
        <Route path="/property/:id" element={<PropertyDetails />} />
        <Route path="/list-property" element={<PropertyListing />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
