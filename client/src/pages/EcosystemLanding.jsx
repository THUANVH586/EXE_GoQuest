import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { ECO_SPOTS, MOCK_HOTELS, MOCK_RESTAURANTS, MOCK_REVIEWS } from '../utils/mockData';
import '../Ecosystem.css';

// Map spot id -> translation key suffix
const SPOT_KEY_MAP = {
    'con-son': 'con-son',
    'cai-rang': 'cai-rang',
    'my-khanh': 'my-khanh',
};

// Map hotel id -> translation key suffix
const HOTEL_KEY_MAP = {
    1: 'vinpearl',
    2: 'victoria',
    3: 'azerai',
};

// Map restaurant id -> translation key suffix
const RESTAURANT_KEY_MAP = {
    1: 'lau-mam',
    2: 'banh-xeo',
    3: 'vit-nau-chao',
    4: 'nem-nuong',
    5: 'banh-cong',
};

// Map review id -> translation key suffix
const REVIEW_KEY_MAP = {
    1: 'review1',
    2: 'review2',
};

const EcosystemLanding = () => {
    const { user } = useAuth();
    const { t, i18n } = useTranslation();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className="eco-wrapper">
            {/* Nav */}
            <nav className="lp-nav lp-nav--scrolled">
                <div className="lp-nav-inner">
                    <div className="lp-nav-brand">
                        <img src="https://res.cloudinary.com/dnnz4ze3b/image/upload/v1773476778/Asset_3_on57x4.png" alt="Logo" style={{ height: '35px' }} />
                        <span style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--color-accent-primary)' }}>Go Quest</span>
                    </div>

                    <div className="lp-nav-links">
                        <a href="#destinations" className="lp-nav-link">{t('ecosystem.nav.destinations')}</a>
                        <a href="#hotels" className="lp-nav-link">{t('ecosystem.nav.hotels')}</a>
                        <a href="#foods" className="lp-nav-link">{t('ecosystem.nav.foods')}</a>
                    </div>

                    <div className="lp-nav-actions">
                        <div className="lang-switcher" style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', padding: '4px', borderRadius: '24px', marginRight: 'var(--space-md)' }}>
                            <button
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', border: 'none', background: i18n.language === 'vi' ? 'var(--color-accent-primary)' : 'transparent', color: i18n.language === 'vi' ? '#fff' : 'var(--color-text-primary)', cursor: 'pointer', transition: 'all 0.3s' }}
                                onClick={() => changeLanguage('vi')}
                                title="Tiếng Việt"
                            >
                                <img src="https://flagcdn.com/w20/vn.png" width="20" alt="VN Flag" />
                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>VI</span>
                            </button>
                            <button
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', border: 'none', background: i18n.language === 'en' ? 'var(--color-accent-primary)' : 'transparent', color: i18n.language === 'en' ? '#fff' : 'var(--color-text-primary)', cursor: 'pointer', transition: 'all 0.3s' }}
                                onClick={() => changeLanguage('en')}
                                title="English"
                            >
                                <img src="https://flagcdn.com/w20/gb.png" width="20" alt="UK Flag" />
                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>EN</span>
                            </button>
                        </div>

                        {user ? (
                            <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="btn btn-primary">
                                {t('nav.dashboard')}
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="btn" style={{ marginRight: '10px', color: 'var(--color-accent-primary)', fontWeight: 600 }}>
                                    {t('nav.login')}
                                </Link>
                                <Link to="/register" className="btn btn-primary">
                                    {t('nav.register')}
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="eco-hero">
                <div className="eco-hero-overlay"></div>
                <div className="container eco-hero-content animate-fade-in">
                    <span className="eco-badge">{t('ecosystem.hero.badge')}</span>
                    <h1 className="eco-title">{t('ecosystem.hero.title')} <br /><span>{t('ecosystem.hero.title_highlight')}</span></h1>
                    <p className="eco-subtitle">{t('ecosystem.hero.subtitle')}</p>
                    <div className="eco-hero-actions">
                        <a href="#destinations" className="btn btn-primary lp-btn-large">{t('ecosystem.hero.cta')}</a>
                    </div>
                </div>
            </section>

            {/* Featured Destinations */}
            <section className="lp-section" id="destinations">
                <div className="container">
                    <div className="lp-section-header" style={{ textAlign: 'left', marginBottom: 'var(--space-2xl)' }}>
                        <span className="lp-section-label">{t('ecosystem.destinations.label')}</span>
                        <h2 className="lp-section-title">{t('ecosystem.destinations.title')}</h2>
                    </div>

                    <div className="eco-grid">
                        {ECO_SPOTS.map(spot => {
                            const spotKey = SPOT_KEY_MAP[spot.id];
                            return (
                                <div key={spot.id} className="eco-card animate-up">
                                    <div className="eco-card-img" style={{ backgroundImage: `url(${spot.image})` }}>
                                        <div className="eco-card-tag">{spot.category}</div>
                                    </div>
                                    <div className="eco-card-body">
                                        <h3 className="eco-card-title">
                                            {spotKey ? t(`ecosystem.spots.${spotKey}.title`) : spot.title}
                                        </h3>
                                        <p className="eco-card-text">
                                            {spotKey ? t(`ecosystem.spots.${spotKey}.description`) : spot.description}
                                        </p>
                                        <div className="eco-card-footer">
                                            <div className="eco-rating">⭐ {spot.rating} ({spot.reviews})</div>
                                            <Link to={spot.link} className="eco-link">{t('ecosystem.destinations.explore_btn')}</Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Hotels Section */}
            <section className="lp-section lp-section--alt" id="hotels">
                <div className="container">
                    <div className="lp-section-header">
                        <span className="lp-section-label">{t('ecosystem.hotels.label')}</span>
                        <h2 className="lp-section-title">{t('ecosystem.hotels.title')}</h2>
                    </div>
                    <div className="eco-list-grid">
                        {MOCK_HOTELS.map(hotel => {
                            const hotelKey = HOTEL_KEY_MAP[hotel.id];
                            return (
                                <div key={hotel.id} className="eco-row-card">
                                    <img src={hotel.image} alt={hotel.name} className="eco-row-img" />
                                    <div className="eco-row-content">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h3>{hotel.name}</h3>
                                            <span className="eco-price">{hotel.price}{t('ecosystem.hotels.per_night')}</span>
                                        </div>
                                        <div className="eco-stars">{'★'.repeat(Math.floor(hotel.rating))}</div>
                                        <p>{hotelKey ? t(`ecosystem.hotels_data.${hotelKey}.description`) : hotel.description}</p>
                                        <button className="btn btn-outline">{t('ecosystem.hotels.view_rooms')}</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Food Section */}
            <section className="lp-section" id="foods">
                <div className="container">
                    <div className="lp-section-header">
                        <span className="lp-section-label">{t('ecosystem.foods.label')}</span>
                        <h2 className="lp-section-title">{t('ecosystem.foods.title')}</h2>
                    </div>
                    <div className="eco-grid">
                        {MOCK_RESTAURANTS.map(rest => {
                            const restKey = RESTAURANT_KEY_MAP[rest.id];
                            return (
                                <div key={rest.id} className="eco-card eco-card--minimal">
                                    <img src={rest.image} alt={rest.name} className="eco-minimal-img" />
                                    <div className="eco-card-body">
                                        <h3>{restKey ? t(`ecosystem.restaurants_data.${restKey}.name`) : rest.name}</h3>
                                        <p className="eco-card-text">
                                            {restKey ? t(`ecosystem.restaurants_data.${restKey}.description`) : rest.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Community Reviews */}
            <section className="lp-section lp-section--alt" id="reviews">
                <div className="container">
                    <div className="lp-section-header">
                        <span className="lp-section-label">{t('ecosystem.reviews.label')}</span>
                        <h2 className="lp-section-title">{t('ecosystem.reviews.title')}</h2>
                    </div>
                    <div className="eco-reviews">
                        {MOCK_REVIEWS.map(rev => {
                            const revKey = REVIEW_KEY_MAP[rev.id];
                            return (
                                <div key={rev.id} className="eco-review-card">
                                    <div className="eco-rev-header">
                                        <div className="eco-rev-user">
                                            <div className="eco-rev-avatar">{rev.user[0]}</div>
                                            <div>
                                                <strong>{rev.user}</strong>
                                                <div className="eco-rev-date">{rev.date}</div>
                                            </div>
                                        </div>
                                        <div className="eco-rev-rating">{'★'.repeat(rev.rating)}</div>
                                    </div>
                                    <p className="eco-rev-text">
                                        "{revKey ? t(`ecosystem.reviews_data.${revKey}.comment`) : rev.comment}"
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="lp-footer">
                <div className="container">
                    <div className="lp-footer-grid">
                        <div className="lp-footer-brand">
                            <div style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img src="https://res.cloudinary.com/dnnz4ze3b/image/upload/v1773476778/Asset_3_on57x4.png" alt="Go Quest Logo" style={{ height: '40px', width: 'auto' }} />
                                <span style={{ fontWeight: 800, fontSize: '1.5rem', color: 'white' }}>Go Quest</span>
                            </div>
                            <p className="lp-footer-desc">
                                {t('footer.desc')}
                            </p>
                        </div>

                        <div>
                            <h5 className="lp-footer-heading">{t('ecosystem.footer.explore')}</h5>
                            <ul className="lp-footer-links">
                                <li><a href="#destinations" className="lp-footer-link">{t('ecosystem.footer.experiences')}</a></li>
                                <li><a href="#hotels" className="lp-footer-link">{t('ecosystem.footer.hotels')}</a></li>
                                <li><a href="#foods" className="lp-footer-link">{t('ecosystem.footer.foods')}</a></li>
                                <li><a href="#reviews" className="lp-footer-link">{t('ecosystem.footer.reviews')}</a></li>
                            </ul>
                        </div>

                        <div>
                            <h5 className="lp-footer-heading">{t('ecosystem.footer.contact')}</h5>
                            <ul className="lp-footer-links">
                                <li>📍 TP. Cần Thơ, Việt Nam</li>
                                <li>✉️ CanThoGoQuest@gmail.com</li>
                                <li>📞 +84 (0) 898 654 592</li>
                            </ul>
                        </div>
                    </div>

                    <div className="lp-footer-bottom">
                        <p>{t('ecosystem.footer.copyright')}</p>
                        <div className="lp-footer-socials">
                            <a href="#" className="lp-footer-link">Facebook</a>
                            <a href="#" className="lp-footer-link">Instagram</a>
                            <a href="#" className="lp-footer-link">YouTube</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default EcosystemLanding;
