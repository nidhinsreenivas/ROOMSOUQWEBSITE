import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";
import { API_BASE_URL } from "../config";
const API_URL = API_BASE_URL;

const EMPTY_FURNITURE_FORM = {
  name: "",
  category: "sofa",
  description: "",
  price: "",
  location: "",
  image_url: "",
  is_available: true,
};

const EMPTY_PROPERTY_FORM = {
  agent_name: "",
  title: "",
  description: "",
  category: "studio",
  location: "",
  monthly_rent: "",
  image_url: "",
  is_available: true,
};

const PROPERTY_CATEGORIES = [
  ["studio", "Studio"],
  ["1_bhk", "1 BHK"],
  ["2_bhk", "2 BHK"],
  ["sharing_room", "Sharing Room"],
  ["master_bedroom", "Master Bedroom"],
  ["bedspace_gents", "Bedspace - Gents"],
  ["bedspace_ladies", "Bedspace - Ladies"],
  ["partition_single", "Partition - Single"],
  ["partition_couple", "Partition - Couple"],
];

function readList(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

function imageUrl(value) {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `${API_URL}${value.startsWith("/") ? "" : "/"}${value}`;
}

function money(value) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })
    : "0";
}

function StatusPill({ children, tone = "neutral" }) {
  return <span className={`rs-status rs-status-${tone}`}>{children}</span>;
}

function AdminDashboard() {
  const navigate = useNavigate();

  const [section, setSection] = useState("overview");
  const [pendingProperties, setPendingProperties] = useState([]);
  const [approvedProperties, setApprovedProperties] = useState([]);
  const [furnitureItems, setFurnitureItems] = useState([]);

  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingFurniture, setLoadingFurniture] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [furnitureBusy, setFurnitureBusy] = useState(false);

  const [propertySearch, setPropertySearch] = useState("");
  const [pendingSearch, setPendingSearch] = useState("");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [editingPropertyId, setEditingPropertyId] = useState(null);
  const [propertyForm, setPropertyForm] = useState({ ...EMPTY_PROPERTY_FORM });
  const [propertySaving, setPropertySaving] = useState(false);

  const [editingFurnitureId, setEditingFurnitureId] = useState(null);
  const [furnitureForm, setFurnitureForm] = useState({ ...EMPTY_FURNITURE_FORM });
  const [selectedFurnitureImage, setSelectedFurnitureImage] = useState(null);
  const [furnitureImagePreview, setFurnitureImagePreview] = useState("");

  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappSaving, setWhatsappSaving] = useState(false);
  const [showWhatsAppEditor, setShowWhatsAppEditor] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadPendingProperties = useCallback(async () => {
    setLoadingProperties(true);
    try {
      const response = await fetch(`${API_URL}/api/properties/pending/`, {
        credentials: "include",
      });
      if (response.status === 401 || response.status === 403) {
        navigate("/login");
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || data.error || "Unable to load pending properties.");
      }
      setPendingProperties(readList(data));
    } catch (err) {
      setError(err.message || "Could not load pending properties.");
    } finally {
      setLoadingProperties(false);
    }
  }, [navigate]);

  const loadApprovedProperties = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/properties/manage/`, {
        credentials: "include",
      });
      if (response.status === 401 || response.status === 403) {
        navigate("/login");
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || data.error || "Unable to load approved properties.");
      }
      setApprovedProperties(readList(data));
    } catch (err) {
      setError(err.message || "Could not load approved properties.");
    }
  }, [navigate]);

  const loadFurniture = useCallback(async () => {
    setLoadingFurniture(true);
    try {
      const response = await fetch(`${API_URL}/api/furniture/manage/`, {
        credentials: "include",
      });
      if (response.status === 401 || response.status === 403) {
        navigate("/login");
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || data.error || "Unable to load furniture.");
      }
      setFurnitureItems(readList(data));
    } catch (err) {
      setError(err.message || "Could not load furniture listings.");
    } finally {
      setLoadingFurniture(false);
    }
  }, [navigate]);

  async function getCsrfToken() {
    const response = await fetch(`${API_URL}/api/csrf/`, {
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.csrfToken) {
      throw new Error("Unable to get a CSRF token. Please refresh and try again.");
    }
    return data.csrfToken;
  }

  async function readResponse(response, fallbackMessage) {
    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`${fallbackMessage} Server returned HTTP ${response.status} with a non-JSON response.`);
    }
    if (!response.ok) {
      const validation = Object.entries(data)
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
        .join("; ");
      throw new Error(data.detail || data.error || validation || fallbackMessage);
    }
    return data;
  }

  useEffect(() => {
    loadPendingProperties();
    loadApprovedProperties();
    loadFurniture();
  }, [loadPendingProperties, loadApprovedProperties, loadFurniture]);

  const allProperties = useMemo(
    () => [...pendingProperties, ...approvedProperties],
    [pendingProperties, approvedProperties]
  );

  const filteredApproved = useMemo(() => {
    const query = propertySearch.trim().toLowerCase();
    if (!query) return approvedProperties;
    return approvedProperties.filter((property) =>
      [
        property.agent_name,
        property.title,
        property.location,
        property.category,
        property.description,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [approvedProperties, propertySearch]);

  const filteredPending = useMemo(() => {
    const query = pendingSearch.trim().toLowerCase();
    if (!query) return pendingProperties;
    return pendingProperties.filter((property) =>
      [
        property.agent_name,
        property.title,
        property.location,
        property.category,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [pendingProperties, pendingSearch]);

  async function approveProperty(property) {
    setBusyId(property.id);
    setError("");
    setMessage("");
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch(`${API_URL}/api/properties/approve/${property.id}/`, {
        method: "POST",
        credentials: "include",
        headers: { "X-CSRFToken": csrfToken },
      });
      await readResponse(response, "Unable to approve property.");
      await Promise.all([loadPendingProperties(), loadApprovedProperties()]);
      setMessage(`“${property.title}” was approved successfully.`);
    } catch (err) {
      setError(err.message || "Could not approve property.");
    } finally {
      setBusyId(null);
    }
  }

  async function togglePropertyAvailability(property) {
    setBusyId(property.id);
    setError("");
    setMessage("");
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch(
        `${API_URL}/api/properties/manage/${property.id}/availability/`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify({ is_available: !property.is_available }),
        }
      );
      await readResponse(response, "Unable to update property availability.");
      await loadApprovedProperties();
      setMessage(`“${property.title}” is now ${property.is_available ? "unavailable" : "available"}.`);
    } catch (err) {
      setError(err.message || "Could not update availability.");
    } finally {
      setBusyId(null);
    }
  }

  async function openPropertyDetails(property) {
    setError("");
    setMessage("");
    setSelectedProperty(property);
    setEditingPropertyId(null);
    try {
      const response = await fetch(`${API_URL}/api/properties/manage/${property.id}/`, {
        credentials: "include",
      });
      const data = await readResponse(response, "Unable to load property details.");
      setSelectedProperty(data);
    } catch (err) {
      // Keep the property card data available if the detail endpoint fails.
      setError(err.message || "Could not load complete property details.");
    }
  }

  function startPropertyEdit(property) {
    setPropertyForm({
      agent_name: property.agent_name || "",
      title: property.title || "",
      description: property.description || "",
      category: property.category || "studio",
      location: property.location || "",
      monthly_rent: property.monthly_rent ?? "",
      image_url: property.image_url || "",
      is_available: Boolean(property.is_available),
    });
    setEditingPropertyId(property.id);
    setSelectedProperty(property);
  }

  function updatePropertyField(event) {
    const { name, value, type, checked } = event.target;
    setPropertyForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function saveProperty(event) {
    event.preventDefault();
    if (!editingPropertyId) return;
    setPropertySaving(true);
    setError("");
    setMessage("");
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch(`${API_URL}/api/properties/manage/${editingPropertyId}/`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({
          ...propertyForm,
          monthly_rent: String(propertyForm.monthly_rent),
        }),
      });
      const data = await readResponse(response, "Unable to save property changes.");
      await Promise.all([loadPendingProperties(), loadApprovedProperties()]);
      setSelectedProperty(data);
      setEditingPropertyId(null);
      setMessage("Property details updated successfully.");
    } catch (err) {
      setError(err.message || "Could not save property changes.");
    } finally {
      setPropertySaving(false);
    }
  }

  function updateFurnitureField(event) {
    const { name, value, type, checked } = event.target;
    setFurnitureForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function resetFurnitureForm() {
    setEditingFurnitureId(null);
    setFurnitureForm({ ...EMPTY_FURNITURE_FORM });
    setSelectedFurnitureImage(null);
    setFurnitureImagePreview("");
  }

  function editFurniture(item) {
    setEditingFurnitureId(item.id);
    setFurnitureForm({
      name: item.name || "",
      category: item.category || "other",
      description: item.description || "",
      price: item.price ?? "",
      location: item.location || "",
      image_url: item.image_url || "",
      is_available: item.is_available !== false,
    });
    setSelectedFurnitureImage(null);
    setFurnitureImagePreview(imageUrl(item.image || item.image_url || ""));
    setSection("furniture");
    window.setTimeout(() => {
      document.getElementById("furniture-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  async function saveFurniture(event) {
    event.preventDefault();
    setFurnitureBusy(true);
    setError("");
    setMessage("");
    try {
      const csrfToken = await getCsrfToken();
      const editing = Boolean(editingFurnitureId);
      const formData = new FormData();
      formData.append("name", furnitureForm.name);
      formData.append("category", furnitureForm.category);
      formData.append("description", furnitureForm.description);
      formData.append("price", String(Number(furnitureForm.price)));
      formData.append("location", furnitureForm.location);
      formData.append("is_available", String(furnitureForm.is_available));
      if (furnitureForm.image_url) formData.append("image_url", furnitureForm.image_url);
      if (selectedFurnitureImage) formData.append("image", selectedFurnitureImage);

      const response = await fetch(
        editing
          ? `${API_URL}/api/furniture/manage/${editingFurnitureId}/`
          : `${API_URL}/api/furniture/manage/`,
        {
          method: editing ? "PATCH" : "POST",
          credentials: "include",
          headers: { "X-CSRFToken": csrfToken },
          body: formData,
        }
      );
      await readResponse(response, "Unable to save furniture.");
      await loadFurniture();
      resetFurnitureForm();
      setMessage(editing ? "Furniture updated successfully." : "Furniture added successfully.");
    } catch (err) {
      setError(err.message || "Could not save furniture.");
    } finally {
      setFurnitureBusy(false);
    }
  }

  async function toggleFurnitureAvailability(item) {
    setFurnitureBusy(true);
    setError("");
    setMessage("");
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch(`${API_URL}/api/furniture/manage/${item.id}/`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({ is_available: !item.is_available }),
      });
      await readResponse(response, "Unable to update furniture availability.");
      await loadFurniture();
      setMessage("Furniture availability updated.");
    } catch (err) {
      setError(err.message || "Could not update furniture availability.");
    } finally {
      setFurnitureBusy(false);
    }
  }

  async function deleteFurniture(item) {
    if (!window.confirm(`Delete "${item.name}" permanently? This cannot be undone.`)) return;
    setFurnitureBusy(true);
    setError("");
    setMessage("");
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch(`${API_URL}/api/furniture/manage/${item.id}/`, {
        method: "DELETE",
        credentials: "include",
        headers: { "X-CSRFToken": csrfToken },
      });
      if (!response.ok) {
        await readResponse(response, "Unable to delete furniture.");
      }
      await loadFurniture();
      if (editingFurnitureId === item.id) resetFurnitureForm();
      setMessage("Furniture deleted successfully.");
    } catch (err) {
      setError(err.message || "Could not delete furniture.");
    } finally {
      setFurnitureBusy(false);
    }
  }

  async function loadWhatsAppNumber() {
    try {
      const response = await fetch(`${API_URL}/api/properties/admin/whatsapp/`, {
        credentials: "include",
      });
      const data = await readResponse(response, "Unable to load WhatsApp number.");
      setWhatsappNumber(data.number || "");
    } catch (err) {
      setError(err.message || "Could not load WhatsApp number.");
    }
  }

  async function saveWhatsAppNumber(event) {
    event.preventDefault();
    setWhatsappSaving(true);
    setError("");
    setMessage("");
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch(`${API_URL}/api/properties/admin/whatsapp/`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({ number: whatsappNumber }),
      });
      const data = await readResponse(response, "Unable to save WhatsApp number.");
      setWhatsappNumber(data.number || "");
      setShowWhatsAppEditor(false);
      setMessage("WhatsApp number updated successfully.");
    } catch (err) {
      setError(err.message || "Could not save WhatsApp number.");
    } finally {
      setWhatsappSaving(false);
    }
  }

  function showSection(nextSection) {
    setSection(nextSection);
    setError("");
    setMessage("");
    if (nextSection === "settings") {
      setShowWhatsAppEditor(true);
      loadWhatsAppNumber();
    }
  }

  function PropertyCard({ property, pending = false }) {
    const photoCount = Array.isArray(property.gallery_images) ? property.gallery_images.length : 0;
    const cover = property.image || property.image_url || property.gallery_images?.[0]?.image;
    return (
      <article className="rs-listing-card" key={property.id}>
        <button className="rs-listing-cover" type="button" onClick={() => openPropertyDetails(property)} aria-label={`View ${property.title}`}>
          {cover ? <img src={imageUrl(cover)} alt={property.title} /> : <span className="rs-cover-placeholder">⌂</span>}
        </button>
        <div className="rs-listing-body">
          <div className="rs-card-topline">
            <span className="rs-category">{String(property.category || "Property").replaceAll("_", " ")}</span>
            <div className="rs-pills">
              {pending ? <StatusPill tone="warning">Pending approval</StatusPill> : <StatusPill tone="success">Approved</StatusPill>}
              {!pending && (
                <StatusPill tone={property.is_available ? "success" : "muted"}>
                  {property.is_available ? "Available" : "Unavailable"}
                </StatusPill>
              )}
            </div>
          </div>
          <h3>{property.title}</h3>
          <p className="rs-muted">⌖ {property.location || "Location not provided"}</p>
          <div className="rs-agent-line">
            <span className="rs-avatar">{(property.agent_name || "A").trim().charAt(0).toUpperCase()}</span>
            <span>Listed by <strong>{property.agent_name || "Agent name not provided"}</strong></span>
          </div>
          <div className="rs-card-meta">
            <strong>₹{money(property.monthly_rent)} <small>/ month</small></strong>
            <span>▧ {photoCount} gallery photo{photoCount === 1 ? "" : "s"}</span>
          </div>
          <div className="rs-card-actions">
            <button type="button" className="rs-button rs-button-secondary" onClick={() => openPropertyDetails(property)}>View details</button>
            {pending ? (
              <button type="button" className="rs-button rs-button-primary" disabled={busyId === property.id} onClick={() => approveProperty(property)}>
                {busyId === property.id ? "Approving…" : "Approve listing"}
              </button>
            ) : (
              <button type="button" className="rs-button rs-button-primary" disabled={busyId === property.id} onClick={() => togglePropertyAvailability(property)}>
                {busyId === property.id ? "Updating…" : property.is_available ? "Mark unavailable" : "Mark available"}
              </button>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <main className="admin-page rs-admin">
      <style>{`
        .rs-admin{min-height:100vh;background:#111613;color:#f4f1e9;padding:24px;box-sizing:border-box}
        .rs-admin *{box-sizing:border-box}
        .rs-admin .rs-shell{max-width:1440px;margin:0 auto}
        .rs-admin .rs-header{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:26px}
        .rs-admin .rs-header p{color:#a9b0a8;margin:6px 0 0}
        .rs-admin .rs-layout{display:grid;grid-template-columns:230px minmax(0,1fr);gap:24px}
        .rs-admin .rs-sidebar{background:#171d19;border:1px solid #303a32;border-radius:18px;padding:14px;height:max-content;position:sticky;top:18px}
        .rs-admin .rs-nav-button{width:100%;text-align:left;border:0;background:transparent;color:#c6cec5;padding:13px 14px;border-radius:10px;margin:3px 0;cursor:pointer;font:inherit}
        .rs-admin .rs-nav-button.active,.rs-admin .rs-nav-button:hover{background:#39472f;color:#fff}
        .rs-admin .rs-main{min-width:0}
        .rs-admin .rs-page-title{font-size:clamp(25px,3vw,36px);margin:0 0 8px}
        .rs-admin .rs-muted{color:#aab2a9}
        .rs-admin .rs-summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin:22px 0}
        .rs-admin .rs-summary{background:#1a211c;border:1px solid #344036;border-radius:15px;padding:20px}
        .rs-admin .rs-summary span{display:block;color:#aab2a9;font-size:14px}
        .rs-admin .rs-summary strong{display:block;font-size:32px;margin-top:9px}
        .rs-admin .rs-section-head{display:flex;justify-content:space-between;align-items:end;gap:16px;flex-wrap:wrap;margin:28px 0 16px}
        .rs-admin .rs-section-head h2{margin:0;font-size:24px}
        .rs-admin .rs-search{width:min(100%,360px);background:#101411;border:1px solid #465147;color:#f4f1e9;padding:12px 14px;border-radius:10px;font:inherit}
        .rs-admin .rs-listing-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
        .rs-admin .rs-listing-card{background:#171c19;border:1px solid #354036;border-radius:16px;overflow:hidden;display:grid;grid-template-columns:150px minmax(0,1fr);min-width:0}
        .rs-admin .rs-listing-cover{border:0;background:#222a23;padding:0;cursor:pointer;min-height:100%;display:flex;align-items:center;justify-content:center}
        .rs-admin .rs-listing-cover img{width:100%;height:100%;min-height:210px;max-height:260px;object-fit:cover}
        .rs-admin .rs-cover-placeholder{font-size:48px;color:#87917e}
        .rs-admin .rs-listing-body{padding:17px;min-width:0}
        .rs-admin .rs-card-topline,.rs-admin .rs-pills,.rs-admin .rs-card-meta,.rs-admin .rs-card-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
        .rs-admin .rs-category{text-transform:capitalize;color:#c4d68d;font-size:12px;font-weight:700;letter-spacing:.06em}
        .rs-admin .rs-pills{justify-content:flex-start}
        .rs-admin .rs-status{display:inline-flex;border-radius:999px;padding:5px 9px;font-size:11px;font-weight:700;border:1px solid transparent;white-space:nowrap}
        .rs-admin .rs-status-success{background:#1d3828;color:#9ee0b0;border-color:#315b3e}
        .rs-admin .rs-status-warning{background:#45351b;color:#f3cb7a;border-color:#695027}
        .rs-admin .rs-status-muted,.rs-admin .rs-status-neutral{background:#292f2b;color:#c0c8bf;border-color:#424b43}
        .rs-admin .rs-listing-body h3{font-size:19px;margin:12px 0 8px;overflow-wrap:anywhere}
        .rs-admin .rs-agent-line{display:flex;align-items:center;gap:9px;color:#aab2a9;font-size:13px;margin:13px 0}
        .rs-admin .rs-agent-line strong{color:#f4f1e9}
        .rs-admin .rs-avatar{display:inline-flex;width:30px;height:30px;border-radius:50%;background:#39472f;align-items:center;justify-content:center;color:#dce7c3;font-weight:700;flex-shrink:0}
        .rs-admin .rs-card-meta{padding:12px 0;border-top:1px solid #303a32;border-bottom:1px solid #303a32;margin-bottom:12px}
        .rs-admin .rs-card-meta small{font-weight:400;color:#aab2a9}
        .rs-admin .rs-card-meta span{color:#aab2a9;font-size:12px}
        .rs-admin .rs-button{border:1px solid #465343;border-radius:9px;padding:10px 12px;cursor:pointer;font:inherit;font-size:13px;font-weight:700}
        .rs-admin .rs-button:disabled{opacity:.55;cursor:wait}
        .rs-admin .rs-button-primary{background:#637a4e;color:white;border-color:#637a4e}
        .rs-admin .rs-button-secondary{background:transparent;color:#e6ebdf}
        .rs-admin .rs-panel{background:#171d19;border:1px solid #354036;border-radius:16px;padding:22px;margin-top:18px}
        .rs-admin .rs-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}
        .rs-admin .rs-field{display:flex;flex-direction:column;gap:7px;color:#cbd2c9;font-size:14px}
        .rs-admin .rs-field input,.rs-admin .rs-field select,.rs-admin .rs-field textarea{width:100%;padding:11px 12px;border:1px solid #465147;border-radius:9px;background:#101411;color:#f4f1e9;font:inherit}
        .rs-admin .rs-field textarea{min-height:110px;resize:vertical}
        .rs-admin .rs-wide{grid-column:1/-1}
        .rs-admin .rs-inline-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
        .rs-admin .rs-alert{padding:12px 15px;border-radius:10px;margin:14px 0}
        .rs-admin .rs-alert-error{background:#3b211f;color:#ffb7ad;border:1px solid #78423b}
        .rs-admin .rs-alert-success{background:#1d3828;color:#a8e1b6;border:1px solid #315b3e}
        .rs-admin .rs-empty{padding:38px 20px;text-align:center;border:1px dashed #414b41;border-radius:14px;color:#aab2a9}
        .rs-admin .rs-detail-grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(280px,.7fr);gap:20px}
        .rs-admin .rs-gallery-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}
        .rs-admin .rs-gallery-grid img{width:100%;height:110px;object-fit:cover;border-radius:8px}
        .rs-admin .rs-furniture-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
        .rs-admin .rs-furniture-card{background:#171c19;border:1px solid #354036;border-radius:14px;padding:14px}
        .rs-admin .rs-furniture-card img{width:100%;height:150px;object-fit:cover;border-radius:9px;background:#222a23}
        .rs-admin .rs-top-actions{display:flex;gap:10px;flex-wrap:wrap}
        @media(max-width:1100px){.rs-admin .rs-listing-grid{grid-template-columns:1fr}.rs-admin .rs-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:760px){.rs-admin{padding:14px}.rs-admin .rs-layout{grid-template-columns:1fr}.rs-admin .rs-sidebar{position:static;display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.rs-admin .rs-listing-card{grid-template-columns:1fr}.rs-admin .rs-listing-cover img{height:190px;min-height:190px}.rs-admin .rs-form-grid,.rs-admin .rs-detail-grid,.rs-admin .rs-furniture-grid{grid-template-columns:1fr}.rs-admin .rs-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.rs-admin .rs-gallery-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      `}</style>

      <div className="rs-shell">
        <header className="rs-header">
          <div>
            <Link to="/" className="logo">Room<span>Souq</span></Link>
            <p>Property, agent and furniture operations</p>
          </div>
          <div className="rs-top-actions">
            <button className="rs-button rs-button-secondary" type="button" onClick={() => showSection("settings")}>WhatsApp settings</button>
            <Link to="/" className="rs-button rs-button-primary">View website ↗</Link>
          </div>
        </header>

        <div className="rs-layout">
          <aside className="rs-sidebar" aria-label="Admin sections">
            {[
              ["overview", "▦  Overview"],
              ["pending", "◷  Pending approvals"],
              ["properties", "⌂  Property management"],
              ["furniture", "▤  Furniture management"],
              ["settings", "⚙  Settings"],
            ].map(([key, label]) => (
              <button key={key} type="button" className={`rs-nav-button ${section === key ? "active" : ""}`} onClick={() => showSection(key)}>
                {label}
              </button>
            ))}
          </aside>

          <section className="rs-main">
            <span className="section-label">ROOM SOUQ MANAGEMENT</span>
            <h1 className="rs-page-title">
              {section === "overview" && "Admin overview"}
              {section === "pending" && "Pending approvals"}
              {section === "properties" && "Property management"}
              {section === "furniture" && "Furniture management"}
              {section === "settings" && "Admin settings"}
            </h1>
            <p className="rs-muted">Review listings, identify agents, update availability and keep the catalogue accurate.</p>

            {error && <p role="alert" className="rs-alert rs-alert-error">{error}</p>}
            {message && <p role="status" className="rs-alert rs-alert-success">{message}</p>}

            {(section === "overview" || section === "pending") && (
              <div className="rs-summary-grid">
                <div className="rs-summary"><span>Total properties</span><strong>{allProperties.length}</strong></div>
                <div className="rs-summary"><span>Pending approval</span><strong>{pendingProperties.length}</strong></div>
                <div className="rs-summary"><span>Approved listings</span><strong>{approvedProperties.length}</strong></div>
                <div className="rs-summary"><span>Furniture items</span><strong>{furnitureItems.length}</strong></div>
              </div>
            )}

            {section === "overview" && (
              <>
                <div className="rs-section-head">
                  <div><h2>Recent pending properties</h2><p className="rs-muted">Approve submissions after reviewing their details.</p></div>
                  <button className="rs-button rs-button-secondary" type="button" onClick={() => { loadPendingProperties(); loadApprovedProperties(); loadFurniture(); }}>↻ Refresh dashboard</button>
                </div>
                {loadingProperties ? <div className="rs-empty">Loading properties…</div> : pendingProperties.length ? (
                  <div className="rs-listing-grid">{pendingProperties.slice(0, 4).map((property) => <PropertyCard key={property.id} property={property} pending />)}</div>
                ) : <div className="rs-empty">No pending submissions right now.</div>}
                <div className="rs-section-head">
                  <div><h2>Approved listings</h2><p className="rs-muted">Quick access to published properties and availability.</p></div>
                  <button className="rs-button rs-button-secondary" type="button" onClick={() => showSection("properties")}>Manage all properties →</button>
                </div>
                <div className="rs-listing-grid">{approvedProperties.slice(0, 4).map((property) => <PropertyCard key={property.id} property={property} />)}</div>
                {!approvedProperties.length && <div className="rs-empty">No approved properties yet.</div>}
              </>
            )}

            {section === "pending" && (
              <>
                <div className="rs-section-head">
                  <div><h2>Submissions awaiting review</h2><p className="rs-muted">Search by agent, property name or location.</p></div>
                  <input className="rs-search" value={pendingSearch} onChange={(event) => setPendingSearch(event.target.value)} placeholder="Search pending listings…" />
                </div>
                {loadingProperties ? <div className="rs-empty">Loading pending properties…</div> : filteredPending.length ? (
                  <div className="rs-listing-grid">{filteredPending.map((property) => <PropertyCard key={property.id} property={property} pending />)}</div>
                ) : <div className="rs-empty">No pending properties match your search.</div>}
              </>
            )}

            {section === "properties" && (
              <>
                <div className="rs-section-head">
                  <div><h2>All approved properties</h2><p className="rs-muted">Search by agent name, title, category, location or description.</p></div>
                  <input className="rs-search" value={propertySearch} onChange={(event) => setPropertySearch(event.target.value)} placeholder="Search agent or property…" />
                </div>
                <p className="rs-muted">{filteredApproved.length} listing(s) found</p>
                {filteredApproved.length ? (
                  <div className="rs-listing-grid">{filteredApproved.map((property) => <PropertyCard key={property.id} property={property} />)}</div>
                ) : <div className="rs-empty">No approved properties match your search.</div>}
              </>
            )}

            {section === "furniture" && (
              <>
                <div className="rs-section-head">
                  <div><h2>{editingFurnitureId ? "Edit furniture item" : "Add furniture"}</h2><p className="rs-muted">Create, update, publish, unpublish or remove furniture listings.</p></div>
                </div>
                <form id="furniture-form" className="rs-panel" onSubmit={saveFurniture}>
                  <div className="rs-form-grid">
                    <label className="rs-field">Furniture name *<input name="name" value={furnitureForm.name} onChange={updateFurnitureField} required maxLength={200} /></label>
                    <label className="rs-field">Category *
                      <select name="category" value={furnitureForm.category} onChange={updateFurnitureField} required>
                        <option value="sofa">Sofa</option><option value="bed">Bed</option><option value="table">Table</option><option value="chair">Chair</option><option value="wardrobe">Wardrobe</option><option value="other">Other</option>
                      </select>
                    </label>
                    <label className="rs-field">Price (₹) *<input name="price" type="number" min="0.01" step="0.01" value={furnitureForm.price} onChange={updateFurnitureField} required /></label>
                    <label className="rs-field">Location *<input name="location" value={furnitureForm.location} onChange={updateFurnitureField} required maxLength={200} /></label>
                    <label className="rs-field rs-wide">Description<textarea name="description" value={furnitureForm.description} onChange={updateFurnitureField} rows={3} /></label>
                    <label className="rs-field">Upload photo<input type="file" accept="image/*" onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      if (!file.type.startsWith("image/")) { setError("Please choose a valid image file."); event.target.value = ""; return; }
                      setError("");
                      setSelectedFurnitureImage(file);
                      setFurnitureImagePreview(URL.createObjectURL(file));
                    }} /></label>
                    <label className="rs-field">Existing image URL (optional)<input name="image_url" type="url" value={furnitureForm.image_url} onChange={updateFurnitureField} placeholder="https://…" /></label>
                  </div>
                  {furnitureImagePreview && <div style={{ marginTop: 14 }}><img src={furnitureImagePreview} alt="Furniture preview" style={{ width: 180, height: 130, objectFit: "cover", borderRadius: 10 }} /></div>}
                  <label style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 16 }}><input type="checkbox" name="is_available" checked={furnitureForm.is_available} onChange={updateFurnitureField} /> Available for customers</label>
                  <div className="rs-inline-actions">
                    <button className="rs-button rs-button-primary" type="submit" disabled={furnitureBusy}>{furnitureBusy ? "Saving…" : editingFurnitureId ? "Save furniture changes" : "Add furniture"}</button>
                    {editingFurnitureId && <button className="rs-button rs-button-secondary" type="button" onClick={resetFurnitureForm} disabled={furnitureBusy}>Cancel edit</button>}
                  </div>
                </form>

                <div className="rs-section-head"><div><h2>Furniture catalogue</h2><p className="rs-muted">{furnitureItems.length} item(s) total</p></div></div>
                {loadingFurniture ? <div className="rs-empty">Loading furniture…</div> : furnitureItems.length ? (
                  <div className="rs-furniture-grid">
                    {furnitureItems.map((item) => (
                      <article className="rs-furniture-card" key={item.id}>
                        {item.image || item.image_url ? <img src={imageUrl(item.image || item.image_url)} alt={item.name} /> : <div className="rs-empty">No photo</div>}
                        <h3>{item.name}</h3>
                        <p className="rs-muted">{item.category} · {item.location}</p>
                        <strong>₹{money(item.price)}</strong>
                        <p><StatusPill tone={item.is_available ? "success" : "muted"}>{item.is_available ? "Available" : "Unavailable"}</StatusPill></p>
                        <div className="rs-inline-actions">
                          <button className="rs-button rs-button-secondary" type="button" onClick={() => editFurniture(item)}>Edit</button>
                          <button className="rs-button rs-button-secondary" type="button" disabled={furnitureBusy} onClick={() => toggleFurnitureAvailability(item)}>{item.is_available ? "Mark unavailable" : "Mark available"}</button>
                          <button className="rs-button rs-button-secondary" type="button" disabled={furnitureBusy} onClick={() => deleteFurniture(item)}>Delete</button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : <div className="rs-empty">No furniture listings found. Add your first item above.</div>}
              </>
            )}

            {section === "settings" && (
              <section className="rs-panel">
                <h2>WhatsApp contact settings</h2>
                <p className="rs-muted">This number is used by customers to enquire about listings.</p>
                {!showWhatsAppEditor ? (
                  <button className="rs-button rs-button-primary" type="button" onClick={() => { setShowWhatsAppEditor(true); loadWhatsAppNumber(); }}>Change WhatsApp number</button>
                ) : (
                  <form onSubmit={saveWhatsAppNumber}>
                    <label className="rs-field" style={{ maxWidth: 500 }}>WhatsApp number with country code
                      <input type="tel" value={whatsappNumber} onChange={(event) => setWhatsappNumber(event.target.value)} placeholder="e.g. 9715XXXXXXXX" minLength={8} maxLength={20} required />
                    </label>
                    <div className="rs-inline-actions">
                      <button className="rs-button rs-button-primary" type="submit" disabled={whatsappSaving}>{whatsappSaving ? "Saving…" : "Save number"}</button>
                      <button className="rs-button rs-button-secondary" type="button" onClick={() => setShowWhatsAppEditor(false)}>Cancel</button>
                    </div>
                  </form>
                )}
              </section>
            )}
          </section>
        </div>
      </div>

      {selectedProperty && (
        <div role="presentation" onClick={() => { setSelectedProperty(null); setEditingPropertyId(null); }} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.72)", padding: 18, overflowY: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
          <section role="dialog" aria-modal="true" aria-label="Property details" onClick={(event) => event.stopPropagation()} className="rs-panel" style={{ width: "min(980px,100%)", margin: "25px auto", background: "#171d19", boxShadow: "0 20px 80px #000" }}>
            <div className="rs-section-head" style={{ marginTop: 0 }}>
              <div><span className="section-label">PROPERTY RECORD</span><h2>{editingPropertyId ? "Edit property" : selectedProperty.title}</h2></div>
              <button className="rs-button rs-button-secondary" type="button" onClick={() => { setSelectedProperty(null); setEditingPropertyId(null); }}>Close ✕</button>
            </div>

            {editingPropertyId ? (
              <form onSubmit={saveProperty}>
                <div className="rs-form-grid">
                  <label className="rs-field">Agent name *<input name="agent_name" value={propertyForm.agent_name} onChange={updatePropertyField} required maxLength={100} /></label>
                  <label className="rs-field">Property title *<input name="title" value={propertyForm.title} onChange={updatePropertyField} required maxLength={200} /></label>
                  <label className="rs-field">Room type *
                    <select name="category" value={propertyForm.category} onChange={updatePropertyField} required>
                      {PROPERTY_CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <label className="rs-field">Location *<input name="location" value={propertyForm.location} onChange={updatePropertyField} required maxLength={200} /></label>
                  <label className="rs-field">Monthly rent (₹) *<input name="monthly_rent" type="number" min="1" step="0.01" value={propertyForm.monthly_rent} onChange={updatePropertyField} required /></label>
                  <label className="rs-field">Legacy image URL (optional)<input name="image_url" type="url" value={propertyForm.image_url} onChange={updatePropertyField} placeholder="https://…" /></label>
                  <label className="rs-field rs-wide">Description *<textarea name="description" value={propertyForm.description} onChange={updatePropertyField} required rows={5} /></label>
                </div>
                <label style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 16 }}><input type="checkbox" name="is_available" checked={propertyForm.is_available} onChange={updatePropertyField} /> Available to customers</label>
                <div className="rs-inline-actions">
                  <button className="rs-button rs-button-primary" type="submit" disabled={propertySaving}>{propertySaving ? "Saving…" : "Save property changes"}</button>
                  <button className="rs-button rs-button-secondary" type="button" onClick={() => setEditingPropertyId(null)} disabled={propertySaving}>Cancel</button>
                </div>
              </form>
            ) : (
              <div className="rs-detail-grid">
                <div>
                  {selectedProperty.image || selectedProperty.image_url ? <img src={imageUrl(selectedProperty.image || selectedProperty.image_url)} alt={selectedProperty.title} style={{ width: "100%", maxHeight: 330, objectFit: "cover", borderRadius: 12 }} /> : <div className="rs-empty">No cover photo available.</div>}
                  <div className="rs-gallery-grid">
                    {(selectedProperty.gallery_images || []).map((photo, index) => (
                      <img key={photo.id || photo.image || index} src={imageUrl(photo.image)} alt={`${selectedProperty.title} photo ${index + 1}`} />
                    ))}
                  </div>
                  <p className="rs-muted">{selectedProperty.gallery_images?.length || 0} gallery photo(s)</p>
                  <h3>About this property</h3>
                  <p style={{ whiteSpace: "pre-wrap" }}>{selectedProperty.description || "No description provided."}</p>
                </div>
                <div>
                  <div className="rs-panel" style={{ marginTop: 0 }}>
                    <p className="rs-muted">Agent</p><h3>{selectedProperty.agent_name || "Agent name not provided"}</h3>
                    <p className="rs-muted">Location</p><strong>{selectedProperty.location}</strong>
                    <p className="rs-muted">Room type</p><strong>{String(selectedProperty.category || "").replaceAll("_", " ")}</strong>
                    <p className="rs-muted">Monthly rent</p><strong>₹{money(selectedProperty.monthly_rent)}</strong>
                    <p className="rs-muted">Approval status</p><StatusPill tone={selectedProperty.is_approved ? "success" : "warning"}>{selectedProperty.is_approved ? "Approved" : "Pending approval"}</StatusPill>
                    <p className="rs-muted">Availability</p><StatusPill tone={selectedProperty.is_available ? "success" : "muted"}>{selectedProperty.is_available ? "Available" : "Unavailable"}</StatusPill>
                    <div className="rs-inline-actions">
                      <button className="rs-button rs-button-primary" type="button" onClick={() => startPropertyEdit(selectedProperty)}>Edit details</button>
                      {selectedProperty.is_approved && <button className="rs-button rs-button-secondary" type="button" disabled={busyId === selectedProperty.id} onClick={async () => { await togglePropertyAvailability(selectedProperty); setSelectedProperty((current) => current ? { ...current, is_available: !current.is_available } : current); }}>{selectedProperty.is_available ? "Mark unavailable" : "Mark available"}</button>}
                      {!selectedProperty.is_approved && <button className="rs-button rs-button-primary" type="button" disabled={busyId === selectedProperty.id} onClick={async () => { await approveProperty(selectedProperty); setSelectedProperty((current) => current ? { ...current, is_approved: true } : current); }}>Approve listing</button>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

export default AdminDashboard;
