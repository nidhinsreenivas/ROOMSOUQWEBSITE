
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import { API_BASE_URL } from "./config";
const API_URL = `${API_BASE_URL}/api/properties/`;
const WHATSAPP_API_URL =
  `${API_BASE_URL}/api/properties/whatsapp/`

const categories = [
  "All",
  "Studio",
  "1 BHK",
  "2 BHK",
  "Sharing Room",
  "Master Bedroom",
  "Bedspace",
  "Partition",
];

function App() {
  const navigate = useNavigate();

  const [properties, setProperties] = useState([]);
  const [category, setCategory] = useState("All");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  // Load approved properties
  useEffect(() => {
    fetch(API_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to load properties");
        }
        return response.json();
      })
      .then((data) => {
        setProperties(
          Array.isArray(data) ? data : data.results || []
        );
      })
      .catch(() => {
        setError(
          "Could not connect to Room Souq. Please check the backend."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Load the WhatsApp number saved by the admin
  useEffect(() => {
    async function loadWhatsAppNumber() {
      try {
        const response = await fetch(WHATSAPP_API_URL);

        if (!response.ok) {
          throw new Error("Unable to load WhatsApp number");
        }

        const data = await response.json();
        setWhatsappNumber(data.number || "");
      } catch (err) {
        console.error(
          "Unable to load WhatsApp number:",
          err
        );
      }
    }

    loadWhatsAppNumber();
  }, []);

  // Filter properties by category and location
  const filteredProperties = properties.filter((property) => {
    const matchesCategory =
      category === "All" ||
      property.category?.toLowerCase() ===
        category.toLowerCase().replaceAll(" ", "_");

    const matchesLocation = property.location
      ?.toLowerCase()
      .includes(location.toLowerCase());

    return matchesCategory && matchesLocation;
  });

  // Build a WhatsApp message with the direct property URL
  function getWhatsAppLink(property) {
    if (!whatsappNumber || !property.id) {
      return undefined;
    }

    const rent = Number(property.monthly_rent).toLocaleString(
      "en-IN",
      { maximumFractionDigits: 2 }
    );

    const propertyUrl =
      `${window.location.origin}/property/${property.id}`;

    const message = `Hi Room Souq! I'm interested in this property.

Property: ${property.title}
Location: ${property.location}
Monthly Rent: ₹${rent}

View this property: ${propertyUrl}

Please share more details about this property.`;

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      message
    )}`;
  }

  // Navigate to the selected property's details page
  function openProperty(property) {
    navigate(`/property/${property.id}`);
  }

  return (
    <div className="app">
      <header className="navbar">
        <a className="logo" href="/">
          Room<span>Souq</span>
        </a>

        <nav>
          <a href="#properties">Find a Room</a>
          <a href="/furniture">Furniture</a>
          <a href="#how-it-works">How it Works</a>
        </nav>

        <div className="nav-actions">
          <a className="login-button" href="/login">
            Log In
          </a>

          <a className="list-button" href="#list-property">
            + List Property
          </a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow">
              YOUR SPACE. YOUR STORY.
            </span>

            <h1>
              Find a place
              <br />
              <span>to call home.</span>
            </h1>

            <p>
              Discover rooms, apartments and bedspaces that fit
              your lifestyle and budget.
            </p>

            <div className="search-box">
              <div className="search-field">
                <label htmlFor="location">LOCATION</label>

                <input
                  id="location"
                  value={location}
                  onChange={(event) =>
                    setLocation(event.target.value)
                  }
                  placeholder="Where do you want to stay?"
                />
              </div>

              <a href="#properties" className="search-button">
                Find a Room →
              </a>
            </div>

            <div className="hero-note">
              <span>✓</span> Explore listings reviewed by our team
            </div>
          </div>

          <div className="hero-decoration">
            <div className="decoration-circle circle-one" />
            <div className="decoration-circle circle-two" />

            <div className="hero-card">
              <span className="hero-card-icon">⌂</span>
              <p>YOUR NEXT CHAPTER</p>
              <h3>Starts here.</h3>
              <span className="hero-card-line" />
              <small>Find your space with Room Souq</small>
            </div>
          </div>
        </section>

        <section className="categories-section">
          <div>
            <span className="section-label">
              EXPLORE YOUR OPTIONS
            </span>
            <h2>What are you looking for?</h2>
          </div>

          <div className="category-list">
            {categories.map((item) => (
              <button
                key={item}
                className={
                  category === item
                    ? "category active"
                    : "category"
                }
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <section
          className="properties-section"
          id="properties"
        >
          <div className="section-heading">
            <div>
              <span className="section-label">
                FIND YOUR SPACE
              </span>
              <h2>Places you might love</h2>
            </div>

            <span className="property-count">
              {filteredProperties.length} properties
            </span>
          </div>

          {loading && (
            <p className="status-message">
              Loading properties...
            </p>
          )}

          {error && (
            <p className="status-message error">{error}</p>
          )}

          {!loading &&
            !error &&
            filteredProperties.length === 0 && (
              <div className="empty-state">
                <span>⌂</span>
                <h3>No properties found</h3>
                <p>
                  Try another location or property category.
                </p>
              </div>
            )}

          <div className="property-grid">
            {filteredProperties.map((property) => (
              <article
                className="property-card"
                key={property.id}
              >
                <div
                  className="property-image"
                  role="link"
                  tabIndex={0}
                  aria-label={`View ${property.title}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => openProperty(property)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" ||
                      event.key === " "
                    ) {
                      event.preventDefault();
                      openProperty(property);
                    }
                  }}
                >
                  {property.image ? (
                    <img
                      src={
                        property.image.startsWith("http")
                          ? property.image
                          : property.image?.startsWith("http")
                          ? property.image
                          : `${API_BASE_URL}${property.image}`
                      }
                      alt={property.title}
                    />
                  ) : property.image_url ? (
                    <img
                      src={property.image_url}
                      alt={property.title}
                    />
                  ) : (
                    <div className="image-placeholder">⌂</div>
                  )}

                  <span className="verified-badge">
                    ✓ Verified listing
                  </span>
                </div>

                <div className="property-details">
                  <span className="property-category">
                    {property.category?.replaceAll("_", " ")}
                  </span>

                  <h3
                    style={{ cursor: "pointer" }}
                    onClick={() => openProperty(property)}
                  >
                    {property.title}
                  </h3>

                  <p className="property-location">
                    ⌖ {property.location}
                  </p>

                  <div className="property-footer">
                    <p>
                      <strong>
                        {Number(
                          property.monthly_rent
                        ).toLocaleString("en-IN")}
                      </strong>
                      <span> / month</span>
                    </p>

                    {whatsappNumber ? (
                      <a
                        href={getWhatsAppLink(property)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="contact-button"
                      >
                        Enquire ↗
                      </a>
                    ) : (
                      <button
                        type="button"
                        className="contact-button"
                        disabled
                      >
                        WhatsApp unavailable
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          className="how-section"
          id="how-it-works"
        >
          <span className="section-label">
            SIMPLE. CLEAR. CONVENIENT.
          </span>

          <h2>Your next home in three steps.</h2>

          <div className="steps-grid">
            <div className="step-card">
              <span>01</span>
              <h3>Explore</h3>
              <p>
                Browse rooms and apartments that match your needs.
              </p>
            </div>

            <div className="step-card">
              <span>02</span>
              <h3>Connect</h3>
              <p>
                Send an enquiry to our team about a property.
              </p>
            </div>

            <div className="step-card">
              <span>03</span>
              <h3>Move in</h3>
              <p>
                Find your space and start your next chapter.
              </p>
            </div>
          </div>
        </section>

       
        <section className="list-cta" id="list-property">
          <div>
            <span className="section-label">
              HAVE A SPACE TO RENT?
            </span>
            <h2>Let your property find its people.</h2>
            <p>
              Submit your property to Room Souq for review.
            </p>
          </div>

          <a href="/list-property">
            List Your Property →
          </a>
        </section>

      </main>

      <footer className="footer">
        <a className="logo" href="/">
          Room<span>Souq</span>
        </a>

        <p>
          Making it easier to find a place to call home.
        </p>

        <small>
          © {new Date().getFullYear()} Room Souq
        </small>
      </footer>
    </div>
  );
}

export default App;
