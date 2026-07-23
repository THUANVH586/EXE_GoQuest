import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/PlacesGuide.css';
import { featuredPlaces } from '../data/places';

export default function PlacesGuide() {
    const { t } = useTranslation();
    const [activeCategory, setActiveCategory] = useState('hotels');

    const renderStars = (rating) => {
        const full = Math.floor(rating);
        return '⭐'.repeat(full);
    };

    const places = activeCategory === 'hotels' ? featuredPlaces.hotels : featuredPlaces.restaurants;

    return (
        <div className="places-guide">
            <div className="places-header">
                <h2 className="places-title">{t('places.title')}</h2>
                <p className="places-subtitle">{t('places.subtitle')}</p>
            </div>

            <div className="places-tabs">
                <button
                    className={`places-tab ${activeCategory === 'hotels' ? 'active' : ''}`}
                    onClick={() => setActiveCategory('hotels')}
                >
                    🏨 {t('places.hotels')}
                </button>
                <button
                    className={`places-tab ${activeCategory === 'restaurants' ? 'active' : ''}`}
                    onClick={() => setActiveCategory('restaurants')}
                >
                    🍲 {t('places.restaurants')}
                </button>
            </div>

            <div className="places-grid">
                {places.map(place => (
                    <article key={place.id} className="place-card">
                        <div className="place-img-wrap">
                            <img src={place.image} alt={place.name} className="place-img" loading="lazy" />
                        </div>
                        <div className="place-body">
                            <h3 className="place-name">{place.name}</h3>
                            <div className="place-rating">
                                {renderStars(place.rating)} <span className="rating-num">({place.rating})</span>
                            </div>
                            <p className="place-address">📍 {t(`places_data.${place.id}.address`, { defaultValue: place.address })}</p>
                            <p className="place-desc">{t(`places_data.${place.id}.description`, { defaultValue: place.description })}</p>
                            <div className="place-tags">
                                {place.tags.map((tag, idx) => (
                                    <span key={idx} className="place-tag">
                                        {t(`places_data.${place.id}.tags.${idx}`, { defaultValue: tag })}
                                    </span>
                                ))}
                            </div>
                            <a
                                href={place.mapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="place-map-btn"
                            >
                                🗺️ {t('places.view_map')}
                            </a>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}
