import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { featuredPlaces } from '../data/places';
import '../styles/PlacesGuide.css'; // I will create this CSS file next

export default function PlacesGuide() {
    const { t } = useTranslation();
    const [activeCategory, setActiveCategory] = useState('hotels');

    const renderStars = (rating) => {
        return '⭐'.repeat(Math.floor(rating)) + (rating % 1 !== 0 ? '✨' : '');
    };

    const places = activeCategory === 'hotels' ? featuredPlaces.hotels : featuredPlaces.restaurants;

    return (
        <div className="places-guide">
            <div className="places-header">
                <h2 className="places-title">Khám Phá Cần Thơ</h2>
                <p className="places-subtitle">Những điểm lưu trú và ẩm thực không thể bỏ lỡ</p>
            </div>

            <div className="places-tabs">
                <button 
                    className={`places-tab ${activeCategory === 'hotels' ? 'active' : ''}`}
                    onClick={() => setActiveCategory('hotels')}
                >
                    🏨 Khách sạn & Lưu trú
                </button>
                <button 
                    className={`places-tab ${activeCategory === 'restaurants' ? 'active' : ''}`}
                    onClick={() => setActiveCategory('restaurants')}
                >
                    🍲 Quán ăn tiêu biểu
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
                            <p className="place-address">📍 {place.address}</p>
                            <p className="place-desc">{place.description}</p>
                            <div className="place-tags">
                                {place.tags.map((tag, idx) => (
                                    <span key={idx} className="place-tag">{tag}</span>
                                ))}
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}
