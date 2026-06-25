import React, { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Hero Banner Slides
  const heroSlides = [
    {
      id: 1,
      title: 'Summer Collection 2024',
      subtitle: 'Discover the latest trends at unbeatable prices',
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200',
      cta: 'Shop Now',
      link: '/products'
    },
    {
      id: 2,
      title: 'Electronics Sale',
      subtitle: 'Up to 40% off on premium gadgets',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200',
      cta: 'Explore Deals',
      link: '/products?category=electronics'
    },
    {
      id: 3,
      title: 'New Arrivals',
      subtitle: 'Fresh collection just landed',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
      cta: 'View Collection',
      link: '/products?sort=newest'
    }
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (Array.isArray(data)) {
          setProducts(data.slice(0, 8));
          setFeaturedProducts(data.slice(0, 4));
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Auto-slide carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '20px' }}>
      
      {/* Hero Carousel Section */}
      <section style={{ marginBottom: '60px', position: 'relative' }}>
        <div style={{ 
          position: 'relative', 
          height: '550px', 
          borderRadius: '20px', 
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          {heroSlides.map((slide, index) => (
            <div
              key={slide.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: index === currentSlide ? 1 : 0,
                transition: 'opacity 0.8s ease-in-out',
                background: `linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 100%), url(${slide.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                padding: '60px'
              }}
            >
              <div style={{ maxWidth: '600px', color: 'white' }}>
                <h1 style={{ 
                  fontSize: '3.5rem', 
                  fontWeight: '700', 
                  marginBottom: '16px',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                }}>
                  {slide.title}
                </h1>
                <p style={{ 
                  fontSize: '1.3rem', 
                  marginBottom: '30px',
                  opacity: 0.95,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                }}>
                  {slide.subtitle}
                </p>
                <button
                  onClick={() => window.location.href = slide.link}
                  style={{
                    padding: '14px 40px',
                    background: '#f97316',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(249, 115, 22, 0.4)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 6px 25px rgba(249, 115, 22, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 4px 15px rgba(249, 115, 22, 0.4)';
                  }}
                >
                  {slide.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Navigation Dots */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginTop: '20px'
        }}>
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              style={{
                width: index === currentSlide ? '40px' : '12px',
                height: '12px',
                borderRadius: '6px',
                border: 'none',
                background: index === currentSlide ? '#f97316' : '#d1d5db',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>

        {/* Previous/Next Buttons */}
        <button
          onClick={prevSlide}
          style={{
            position: 'absolute',
            top: '50%',
            left: '20px',
            transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            fontSize: '24px',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.4)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
        >
          ❮
        </button>
        <button
          onClick={nextSlide}
          style={{
            position: 'absolute',
            top: '50%',
            right: '20px',
            transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            fontSize: '24px',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.4)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
        >
          ❯
        </button>
      </section>

      {/* Category Section */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ 
          fontSize: '2.2rem', 
          fontWeight: '700', 
          marginBottom: '30px',
          color: '#1a1a1a'
        }}>
          Shop by Category
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '20px'
        }}>
          {['Electronics', 'Fashion', 'Home & Living', 'Beauty', 'Sports', 'Books'].map((category) => (
            <div
              key={category}
              style={{
                background: 'white',
                padding: '30px 20px',
                borderRadius: '16px',
                textAlign: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '1px solid #f0f0f0'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-8px)';
                e.target.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
                e.target.style.borderColor = '#f97316';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 10px rgba(0,0,0,0.06)';
                e.target.style.borderColor = '#f0f0f0';
              }}
              onClick={() => window.location.href = `/products?category=${category.toLowerCase()}`}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>
                {category === 'Electronics' && '📱'}
                {category === 'Fashion' && '👗'}
                {category === 'Home & Living' && '🏠'}
                {category === 'Beauty' && '💄'}
                {category === 'Sports' && '⚽'}
                {category === 'Books' && '📚'}
              </div>
              <h3 style={{ fontSize: '1.1rem', margin: '0', color: '#1a1a1a' }}>{category}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section style={{ marginBottom: '60px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '700', color: '#1a1a1a' }}>
            Featured Products
          </h2>
          <button
            onClick={() => window.location.href = '/products'}
            style={{
              background: 'none',
              border: 'none',
              color: '#f97316',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'color 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#e85d04'}
            onMouseLeave={(e) => e.target.style.color = '#f97316'}
          >
            View All →
          </button>
        </div>

        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '30px'
          }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                height: '300px',
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
            ))}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '30px'
          }}>
            {featuredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Special Offers Banner */}
      <section style={{ marginBottom: '60px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #f97316 0%, #e85d04 100%)',
          padding: '60px 40px',
          borderRadius: '20px',
          textAlign: 'center',
          color: 'white'
        }}>
          <span style={{
            display: 'inline-block',
            padding: '6px 20px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50px',
            fontSize: '0.9rem',
            fontWeight: '600',
            marginBottom: '20px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Limited Time Offer
          </span>
          <h2 style={{ 
            fontSize: '2.8rem', 
            fontWeight: '700', 
            marginBottom: '16px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
          }}>
            Up to 50% Off
          </h2>
          <p style={{ 
            fontSize: '1.2rem', 
            marginBottom: '30px',
            opacity: 0.95,
            maxWidth: '500px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            On selected items. Hurry, offer ends soon!
          </p>
          <button
            onClick={() => window.location.href = '/products?discount=true'}
            style={{
              padding: '14px 48px',
              background: 'white',
              color: '#f97316',
              border: 'none',
              borderRadius: '50px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = 'none';
            }}
          >
            Shop Now
          </button>
        </div>
      </section>

      {/* All Products Grid */}
      <section>
        <h2 style={{ 
          fontSize: '2.2rem', 
          fontWeight: '700', 
          marginBottom: '30px',
          color: '#1a1a1a'
        }}>
          All Products
        </h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
            Loading products...
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '30px'
          }}>
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Newsletter Subscription */}
      <section style={{
        marginTop: '60px',
        padding: '60px 40px',
        background: '#f8f9fa',
        borderRadius: '20px',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '12px', color: '#1a1a1a' }}>
          Subscribe to Our Newsletter
        </h2>
        <p style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '30px' }}>
          Get the latest updates on new products and exclusive offers
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <input
            type="email"
            placeholder="Enter your email"
            style={{
              flex: '1',
              padding: '14px 24px',
              fontSize: '1rem',
              border: '2px solid #e5e7eb',
              borderRadius: '50px',
              minWidth: '250px',
              outline: 'none',
              transition: 'border-color 0.3s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#f97316'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
          <button
            style={{
              padding: '14px 40px',
              background: '#f97316',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#e85d04';
              e.target.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#f97316';
              e.target.style.transform = 'scale(1)';
            }}
          >
            Subscribe
          </button>
        </div>
      </section>

      {/* CSS Animation for Loading */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default Home;