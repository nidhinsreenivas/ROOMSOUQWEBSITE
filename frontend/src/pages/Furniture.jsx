
import { useEffect, useMemo, useState } from "react";
import "../App.css";

const API_URL = "http://localhost:8000/api/furniture/";

const categories = [
  { label: "All Furniture", value: "all" },
  { label: "Sofas", value: "sofa" },
  { label: "Beds", value: "bed" },
  { label: "Tables", value: "table" },
  { label: "Chairs", value: "chair" },
  { label: "Wardrobes", value: "wardrobe" },
  { label: "Other", value: "other" },
];

function Furniture() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  useEffect(() => {
    async function loadWhatsAppNumber() {
      try {
        const response = await fetch(
          "http://localhost:8000/api/properties/whatsapp/"
        );

        if (!response.ok) return;

        const data = await response.json();
        setWhatsappNumber(data.number || "");
      } catch (error) {
        console.error("Unable to load WhatsApp number", error);
      }
    }

    async function loadFurniture() {
      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Unable to load furniture. Please try again.");
        }

        const data = await response.json();
        setItems(Array.isArray(data) ? data : data.results || []);
      } catch (err) {
        setError(err.message || "Could not connect to the server.");
      } finally {
        setLoading(false);
      }
    }

    loadFurniture();
    loadWhatsAppNumber();
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesCategory =
        category === "all" || item.category === category;

      const searchableText = [
        item.name,
        item.category,
        item.description,
        item.location,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesCategory && searchableText.includes(query);
    });
  }, [items, search, category]);

  function getWhatsAppLink(item) {
    if (!whatsappNumber) return null;

    const message = `Hello Room Souq! I'm interested in "${item.name}" listed for ₹${item.price}. Could you please share more details?`;

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      message
    )}`;
  }

  return (
    <main className="furniture-page">

      {/* Navigation Bar */}
      <nav className="furniture-nav">
        <a href="/" className="furniture-nav-logo">
          ROOM <span>SOUQ</span>
        </a>

        <div className="furniture-nav-links">
          <a href="/" className="furniture-nav-link">
            Properties
          </a>

          <a
            href="/furniture"
            className="furniture-nav-link active"
            aria-current="page"
          >
            Furniture
          </a>
        </div>
      </nav>

      {/* Furniture Hero Section */}
      <section className="furniture-hero">
        <div className="furniture-hero-content">
          <span className="furniture-eyebrow">
            THE ROOM SOUQ COLLECTION
          </span>

          <h1>Make your space feel like home.</h1>

          <p>
            Discover furniture that brings comfort, style, and personality
            to your space.
          </p>

          <div className="furniture-search">
            <span aria-hidden="true">⌕</span>

            <input
              type="search"
              placeholder="Search sofas, beds, locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search furniture"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Furniture Catalogue */}
      <section className="furniture-catalogue">
        <div className="furniture-section-heading">
          <div>
            <span className="furniture-eyebrow">FIND YOUR STYLE</span>
            <h2>Explore furniture</h2>
          </div>

          <p>{filteredItems.length} items</p>
        </div>

        {/* Category Filters */}
        <div
          className="furniture-filters"
          aria-label="Furniture categories"
        >
          {categories.map((item) => (
            <button
              key={item.value}
              type="button"
              className={
                category === item.value
                  ? "furniture-filter active"
                  : "furniture-filter"
              }
              onClick={() => setCategory(item.value)}
              aria-pressed={category === item.value}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <p className="furniture-message">
            Loading furniture...
          </p>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="furniture-message furniture-error">
            <p>{error}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        )}

        {/* No Furniture */}
        {!loading && !error && items.length === 0 && (
          <div className="furniture-empty">
            <span aria-hidden="true">◇</span>
            <h3>Your next favourite piece starts here.</h3>
            <p>New furniture listings will appear here soon.</p>
          </div>
        )}

        {/* No Search Results */}
        {!loading &&
          !error &&
          items.length > 0 &&
          filteredItems.length === 0 && (
            <div className="furniture-empty">
              <h3>No matching furniture found</h3>

              <p>
                Try another search or choose a different category.
              </p>

              <button
                type="button"
                className="furniture-reset"
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                }}
              >
                Clear filters
              </button>
            </div>
          )}

        {/* Furniture Cards */}
        {!loading && !error && filteredItems.length > 0 && (
          <div className="furniture-grid">
            {filteredItems.map((item) => (
              <article
                className="furniture-card"
                key={item.id}
              >
                <div className="furniture-card-image">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      loading="lazy"
                    />
                  ) : (
                    <div className="furniture-image-placeholder">
                      <span aria-hidden="true">◇</span>
                      <span>ROOM SOUQ</span>
                    </div>
                  )}

                  <span className="furniture-category-tag">
                    {(item.category || "other").replaceAll("_", " ")}
                  </span>
                </div>

                <div className="furniture-card-content">
                  <p className="furniture-location">
                    <span aria-hidden="true">⌖</span>{" "}
                    {item.location}
                  </p>

                  <h3>{item.name}</h3>

                  <p className="furniture-description">
                    {item.description ||
                      "A great addition to your space."}
                  </p>

                  <div className="furniture-card-footer">
                    <div>
                      <span className="furniture-price-label">
                        PRICE
                      </span>

                      <p className="furniture-price">
                        ₹
                        {Number(item.price).toLocaleString("en-IN", {
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>

                    {whatsappNumber ? (
                      <a
                        className="furniture-enquire"
                        href={getWhatsAppLink(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Enquire on WhatsApp ↗
                      </a>
                    ) : (
                      <button
                        type="button"
                        className="furniture-enquire"
                        disabled
                      >
                        Loading WhatsApp...
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Furniture;
