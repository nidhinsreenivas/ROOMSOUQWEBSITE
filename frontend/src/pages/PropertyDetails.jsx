
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../App.css";
import { API_BASE_URL } from "../config";
const API_URL = `${API_BASE_URL}/api/properties/`;
const MEDIA_URL = API_BASE_URL;
const WHATSAPP_API_URL =
  `${API_BASE_URL}/api/properties/whatsapp/`

function PropertyDetails() {
  const { id } = useParams();

  const [property, setProperty] = useState(null);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [propertiesResponse, whatsappResponse] =
          await Promise.all([
            fetch(API_URL),
            fetch(WHATSAPP_API_URL),
          ]);

        if (!propertiesResponse.ok) {
          throw new Error("Unable to load properties.");
        }

        const data = await propertiesResponse.json();
        const properties = Array.isArray(data)
          ? data
          : data.results || [];

        const foundProperty = properties.find(
          (item) => String(item.id) === String(id)
        );

        if (!foundProperty) {
          throw new Error("Property not found.");
        }

        if (cancelled) return;

        setProperty(foundProperty);

        if (whatsappResponse.ok) {
          const whatsappData = await whatsappResponse.json();
          if (!cancelled) {
            setWhatsappNumber(whatsappData.number || "");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load property details.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [id]);

  function getImageUrl(image) {
    if (!image) return "";

    if (typeof image !== "string") return "";

    return image.startsWith("http")
      ? image
      : `${MEDIA_URL}${image.startsWith("/") ? "" : "/"}${image}`;
  }

  // Support the new gallery and existing single-image listings.
  const galleryImages = property
    ? [
        ...(Array.isArray(property.gallery_images)
          ? property.gallery_images
              .map((item) =>
                typeof item === "string" ? item : item.image
              )
              .filter(Boolean)
          : []),
        property.image,
        property.image_url,
      ]
        .filter(Boolean)
        .map(getImageUrl)
        .filter(Boolean)
        .filter((url, index, all) => all.indexOf(url) === index)
    : [];

  function getWhatsAppLink() {
    if (!property || !whatsappNumber) return undefined;

    const rent = Number(property.monthly_rent).toLocaleString(
      "en-IN",
      { maximumFractionDigits: 2 }
    );

    const message = `Hi Room Souq! I'm interested in this property.

Property: ${property.title}
Location: ${property.location}
Monthly Rent: ₹${rent}
Agent: ${property.agent_name || "Room Souq"}

View this property: ${window.location.href}

Please share more details.`;

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      message
    )}`;
  }

  function showPreviousImage() {
    setActiveImage((current) =>
      current === 0 ? galleryImages.length - 1 : current - 1
    );
  }

  function showNextImage() {
    setActiveImage((current) =>
      current === galleryImages.length - 1 ? 0 : current + 1
    );
  }

  if (loading) {
    return (
      <main className="property-details-page">
        <p className="status-message">Loading property details...</p>
      </main>
    );
  }

  if (error || !property) {
    return (
      <main className="property-details-page">
        <p className="status-message error">
          {error || "Property not found."}
        </p>
        <Link to="/">← Back to properties</Link>
      </main>
    );
  }

  const categoryLabel = (property.category || "Property")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const rent = Number(property.monthly_rent).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

  return (
    <main className="property-details-page professional-property-page">
      <Link to="/" className="back-link">
        ← Back to properties
      </Link>

      <div className="property-detail-heading">
        <div>
          <span className="property-category">{categoryLabel}</span>
          <h1>{property.title}</h1>
          <p className="property-location">
            <span aria-hidden="true">📍</span> {property.location}
          </p>
        </div>

        <div className="property-heading-price">
          <strong>₹{rent}</strong>
          <span>per month</span>
        </div>
      </div>

      <section className="property-gallery" aria-label="Property photos">
        <div className="property-gallery-main">
          {galleryImages.length > 0 ? (
            <>
              <img
                src={galleryImages[activeImage]}
                alt={`${property.title} photo ${activeImage + 1}`}
                onError={(event) => {
                  event.currentTarget.style.visibility = "hidden";
                }}
              />

              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    className="gallery-arrow gallery-arrow-left"
                    onClick={showPreviousImage}
                    aria-label="Previous photo"
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    className="gallery-arrow gallery-arrow-right"
                    onClick={showNextImage}
                    aria-label="Next photo"
                  >
                    ›
                  </button>

                  <span className="gallery-counter">
                    {activeImage + 1} / {galleryImages.length}
                  </span>
                </>
              )}
            </>
          ) : (
            <div className="image-placeholder">
              <span aria-hidden="true">⌂</span>
              <p>No property photos available</p>
            </div>
          )}
        </div>

        {galleryImages.length > 1 && (
          <div className="property-gallery-thumbnails">
            {galleryImages.map((image, index) => (
              <button
                type="button"
                key={`${image}-${index}`}
                className={`gallery-thumbnail ${
                  index === activeImage ? "active" : ""
                }`}
                onClick={() => setActiveImage(index)}
                aria-label={`Show photo ${index + 1}`}
                aria-pressed={index === activeImage}
              >
                <img
                  src={image}
                  alt={`Property thumbnail ${index + 1}`}
                />
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="property-detail-layout">
        <div className="property-detail-main">
          <section className="property-info-panel">
            <h2>About this property</h2>
            <p className="property-full-description">
              {property.description || "No description provided."}
            </p>
          </section>

          <section className="property-info-panel">
            <h2>Property information</h2>

            <div className="property-facts">
              <div>
                <span>Room type</span>
                <strong>{categoryLabel}</strong>
              </div>

              <div>
                <span>Location</span>
                <strong>{property.location}</strong>
              </div>

              <div>
                <span>Monthly rent</span>
                <strong>₹{rent}</strong>
              </div>

              <div>
                <span>Availability</span>
                <strong>
                  {property.is_available === false
                    ? "Currently unavailable"
                    : "Available"}
                </strong>
              </div>
            </div>
          </section>
        </div>

        <aside className="property-contact-panel">
          <span className="property-contact-label">INTERESTED IN THIS PROPERTY?</span>
          <h2>Make this your next home.</h2>
          <p>
            Contact Room Souq to ask about availability, viewing arrangements,
            and further details.
          </p>

          {property.agent_name && (
            <div className="property-agent">
              <span className="property-agent-avatar" aria-hidden="true">
                {property.agent_name.trim().charAt(0).toUpperCase()}
              </span>

              <div>
                <span>Listed by</span>
                <strong>{property.agent_name}</strong>
              </div>
            </div>
          )}

          {whatsappNumber ? (
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-button property-whatsapp-button"
            >
              Enquire on WhatsApp ↗
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

          <p className="property-contact-note">
            Share the property link with your enquiry for faster assistance.
          </p>
        </aside>
      </div>
    </main>
  );
}

export default PropertyDetails;
