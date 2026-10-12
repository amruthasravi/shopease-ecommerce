
import { useEffect, useState } from 'react';
import './App.css';

const fallbackImages = {
  'Wireless Headphones':
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
  'Smart Watch':
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
  'Bluetooth Speaker':
    'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600',
  'Running Shoes':
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
};


function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loginError, setLoginError] = useState('');

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('All');

  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderMessage, setOrderMessage] = useState('');

  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  const [historyPhone, setHistoryPhone] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    address: '',
  });

  // Keep the rest of your existing App.js code below.

  useEffect(() => {
    fetch('http://localhost:5000/api/products')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unable to fetch products');
        }
        return response.json();
      })
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Products fetch error:', err);
        setError('Could not load products. Check your backend.');
        setLoading(false);
      });
  }, []);

  // Add a product or increase its quantity
  const addToCart = (product) => {
    setOrderMessage('');

    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item._id === product._id
      );

      const currentQuantity = existing ? existing.quantity : 0;

      if (currentQuantity >= Number(product.stock)) {
        return currentCart;
      }

      if (existing) {
        return currentCart.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...currentCart, { ...product, quantity: 1 }];
    });
  };

  // Remove one quantity
  const removeFromCart = (productId) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item._id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (total, item) =>
      total + Number(item.price) * item.quantity,
    0
  );

  
const handleCheckout = async (event) => {
  event.preventDefault();

  if (cart.length === 0) {
    return;
  }

  setSubmittingOrder(true);
  setCheckoutError('');
  setOrderMessage('');

  try {
    const response = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer: {
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
        },
        items: cart.map((item) => ({
          productId: item._id,
          quantity: item.quantity,
        })),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Could not save your order.');
    }

    setOrderMessage(
      `Order saved successfully! Order ID: ${data.orderId}. ` +
      `Total: ₹${Number(data.total).toLocaleString('en-IN')}. ` +
      `Status: ${data.status}.`
    );

    setCart([]);
    setShowCheckout(false);
    setCustomer({
      name: '',
      phone: '',
      address: '',
    });
  } catch (error) {
    setCheckoutError(
      error.message || 'Something went wrong while saving your order.'
    );
  } finally {
    setSubmittingOrder(false);
  }
};

const fetchOrderHistory = async (event) => {
  event.preventDefault();

  setHistoryLoading(true);
  setHistoryError('');
  setOrderHistory([]);

  try {
    const response = await fetch(
      `http://localhost:5000/api/orders?phone=${encodeURIComponent(historyPhone)}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Could not load order history.');
    }

    setOrderHistory(data.orders);
  } catch (error) {
    setHistoryError(
      error.message || 'Something went wrong while loading orders.'
    );
  } finally {
    setHistoryLoading(false);
  }
  };

// PASTE THE CATEGORY CODE HERE
const categories = [
  'All',
  ...new Set(
    products
      .map((product) => product.category)
      .filter(Boolean)
  ),
];

const filteredProducts =
  selectedCategory === 'All'
    ? products
    : products.filter(
        (product) => product.category === selectedCategory
      );

  return (
    <div className="app">
      {/* Navigation */}
      <header className="navbar">
        <h2>ShopEase 🛍️</h2>

<nav>
  <a href="#home">Home</a>
  <a href="#products">Products</a>

  <button
    type="button"
    className="cart-button"
    onClick={() => {
      setShowCart((previous) => !previous);
      setShowCheckout(false);
      setShowOrderHistory(false);
    }}
  >
    🛒 Cart ({cartCount})
  </button>

  <button
    type="button"
    className="cart-button"
    onClick={() => {
      setShowOrderHistory(true);
      setShowCart(false);
      setShowCheckout(false);
      setHistoryError('');
    }}
  >
    Order History
  </button>

  {loggedInUser ? (
    <span className="logged-in-user">
      <span className="user-icon" title="Logged in">
        👤
      </span>

      <button
        type="button"
        className="login-button"
        onClick={() => {
          setLoggedInUser(null);
          setLoginError('');
        }}
      >
        Logout
      </button>
    </span>
  ) : (
    <button
      type="button"
      className="login-button"
      onClick={() => {
        setShowLogin(true);
        setShowCart(false);
        setShowCheckout(false);
        setShowOrderHistory(false);
      }}
    >
      👤 Login / Sign Up
    </button>
  )}
</nav>
      </header>
      
{showOrderHistory && (
  <section className="cart-section">
    <h2>Order History</h2>

    <form onSubmit={fetchOrderHistory}>
      <label htmlFor="historyPhone">
        Enter your checkout phone number
      </label>

      <input
        id="historyPhone"
        type="tel"
        value={historyPhone}
        onChange={(event) => setHistoryPhone(event.target.value)}
        placeholder="10-digit phone number"
        maxLength={10}
        pattern="[0-9]{10}"
        required
      />

      <button type="submit" disabled={historyLoading}>
        {historyLoading ? 'Searching...' : 'Find My Orders'}
      </button>
    </form>

    {historyError && (
      <p role="alert">{historyError}</p>
    )}

    {!historyLoading && orderHistory.length === 0 && !historyError && (
      <p>Enter your phone number to find your orders.</p>
    )}

    {orderHistory.map((order) => (
      <div key={order._id} className="cart-item">
        <h3>Order ID: {order._id}</h3>
        <p>
          Date: {new Date(order.createdAt).toLocaleString()}
        </p>
        <p>Total: ₹{order.total.toLocaleString('en-IN')}</p>
        <p>Status: {order.status}</p>

        <h4>Products</h4>
        {order.items.map((item, index) => (
          <p key={`${order._id}-${index}`}>
            {item.name} × {item.quantity} — ₹
            {(item.price * item.quantity).toLocaleString('en-IN')}
          </p>
        ))}
      </div>
    ))}

    <button
      type="button"
      className="close-cart"
      onClick={() => setShowOrderHistory(false)}
    >
      Close Order History
    </button>
  </section>
)}


{showLogin && (
  <div
    className="login-overlay"
    onClick={() => setShowLogin(false)}
  >
    <div
      className="login-modal"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="login-close"
        onClick={() => setShowLogin(false)}
      >
        ✕
      </button>

      <h2>Welcome to ShopEase!</h2>
      <p>Login to your account</p>

       <form
  onSubmit={(event) => {
    event.preventDefault();

    const email = event.currentTarget.email.value.trim();
    const password = event.currentTarget.password.value;

    if (!email || !password) {
      setLoginError('Please enter your email and password.');
      return;
    }

    // Demo login only — not verified against a database
    setLoggedInUser(email);
    setLoginError('');
    setShowLogin(false);

    alert(`Welcome, ${email}!`);
  }}
>
  <label htmlFor="login-email">Email Address</label>
  <input
    id="login-email"
    name="email"
    type="email"
    placeholder="Enter your email"
    required
  />

  <label htmlFor="login-password">Password</label>
  <input
    id="login-password"
    name="password"
    type="password"
    placeholder="Enter your password"
    required
  />

  {loginError && <p className="login-error">{loginError}</p>}

  <button type="submit" className="login-submit">
    Login
  </button>
</form>
    </div>
  </div>
)}


<section className="hero-banner">
  <div className="hero-content">
    <span className="hero-tag">
      WELCOME TO SHOPEASE
    </span>

    <h1>
      Shop Smarter.
      <br />
      Live Better.
    </h1>

    <p>
      Discover trending electronics, fashion, and
      everyday essentials at prices you'll love.
    </p>

    <div className="hero-actions">
      <a href="#products" className="shop-button">
        Shop Now →
      </a>

      <a href="#offers" className="offer-button">
        Explore Offers
      </a>
    </div>

    <div className="hero-benefits">
      ✓ Great Prices &nbsp; ✓ Quality Products &nbsp; ✓ Easy Shopping
    </div>
  </div>
</section>


      {/* Special Offers */}
      <section className="offers-section" id="special-offers">
        <div className="offers-heading">
          <span className="offers-label">DON'T MISS OUT</span>
          <h2>Special Offers 🎉</h2>
          <p>Find your next favourite product for less.</p>
        </div>

        <div className="offers-grid">
          <article className="offer-card offer-purple">
            <div className="offer-content">
              <span className="offer-pill">HOT DEAL</span>
              <h3>Upgrade Your Tech</h3>
              <p>Discover headphones, watches, and speakers.</p>
              <a href="#products" className="offer-button">
                Shop Electronics →
              </a>
            </div>
            <div className="offer-emoji">🎧</div>
          </article>

          <article className="offer-card offer-pink">
            <div className="offer-content">
              <span className="offer-pill">STYLE PICKS</span>
              <h3>Refresh Your Style</h3>
              <p>Explore fashion and everyday essentials.</p>
              <a href="#products" className="offer-button">
                Explore Products →
              </a>
            </div>
            <div className="offer-emoji">👟</div>
          </article>
        </div>
      </section>

      {/* Shopping cart */}
      {showCart && (
        <section className="cart-section" id="cart">
          <div className="cart-heading">
            <h2>Your Shopping Cart</h2>

            <button
              type="button"
            className="close-cart"
              onClick={() => {
                setShowCart(false);
                setShowCheckout(false);
              }}
            >
              Close ✕
            </button>
          </div>

          {cart.length === 0 ? (
            <p>Your cart is empty. Add some products!</p>
          ) : (
            <>
              <div className="cart-items">
                {cart.map((item) => (
                  <article className="cart-item" key={item._id}>
                    <div>
                      <h3>{item.name}</h3>
                      <p>
                        ₹{Number(item.price).toLocaleString('en-IN')}
                        {' '}× {item.quantity}
                      </p>
                      <strong>
                        Subtotal: ₹
                        {(Number(item.price) * item.quantity)
                          .toLocaleString('en-IN')}
                      </strong>
                    </div>

                    <button
                      type="button"
                      className="remove-button"
                      onClick={() => removeFromCart(item._id)}
                    >
                      Remove One
                    </button>
                  </article>
                ))}
              </div>

              <h3 className="cart-total">
                Total: ₹{cartTotal.toLocaleString('en-IN')}
              </h3>

              <button
                type="button"
                className="add-to-cart-button"
                onClick={() => setShowCheckout(true)}
                disabled={cart.length === 0}
              >
                Proceed to Checkout
              </button>

              <button
                type="button"
                className="clear-cart-button"
                onClick={() => {
                  setCart([]);
                  setShowCheckout(false);
                  setOrderMessage('');
                }}
              >
                Clear Cart
              </button>

              {/* Checkout form */}
              {showCheckout && (
                <form
                  className="checkout-form"
                  onSubmit={handleCheckout}
                >
                  <h2>Checkout</h2>

                  <h3>Order Summary</h3>

                  {cart.map((item) => (
                    <p key={item._id}>
                      {item.name} × {item.quantity}
                      {' — '}₹
                      {(Number(item.price) * item.quantity)
                        .toLocaleString('en-IN')}
                    </p>
                  ))}

                  <h3>
                    Total: ₹{cartTotal.toLocaleString('en-IN')}
                  </h3>

                  <label>
                    Full Name
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      value={customer.name}
                      onChange={(event) =>
                        setCustomer({
                          ...customer,
                          name: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Phone Number
                    <input
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      title="Enter a 10-digit phone number"
                      autoComplete="tel"
                      value={customer.phone}
                      onChange={(event) =>
                        setCustomer({
                          ...customer,
                          phone: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Delivery Address
                    <textarea
                      required
                      autoComplete="street-address"
                      value={customer.address}
                      onChange={(event) =>
                        setCustomer({
                          ...customer,
                          address: event.target.value,
                        })
                      }
                    />
                  </label>

                  
{checkoutError && (
  <p role="alert" className="error-message">
    {checkoutError}
  </p>
)}

<button
  type="submit"
  className="add-to-cart-button"
  disabled={submittingOrder}
>
  {submittingOrder ? 'Saving Order...' : 'Place Order'}
</button>


                  <button
                    type="button"
                    className="close-cart"
                    onClick={() => setShowCheckout(false)}
                  >
                    Cancel
                  </button>
                </form>
              )}
            </>
          )}

          {orderMessage && (
            <p role="status" aria-live="polite">
              {orderMessage}
            </p>
          )}
        </section>
      )}

      {/* Products */}
      <main className="products-section" id="products">
        <h2>Our Products</h2>        <div className="category-filters">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={
                selectedCategory === category
                  ? 'category-button active'
                  : 'category-button'
              }
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'All' ? 'All Products' : category}
            </button>
          ))}
        </div>

        {loading && <p>Loading products...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && !error && products.length === 0 && (
          <p>No products found in MongoDB yet.</p>
        )}

        <div className="product-grid">
          {filteredProducts.map((product) => (
            <article className="product-card" key={product._id}>
              <div className="product-image">
                <img
                  src={
                    product.image || fallbackImages[product.name] ||
                    'https://placehold.co/400x400?text=Product'
                  }
                  alt={product.name}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src =
                      'https://placehold.co/400x400?text=Product';
                  }}
                />
              </div>

              <h3>{product.name}</h3>
                            <div className="product-rating" aria-label={
                product.rating
                  ? `${product.rating} out of 5 stars`
                  : 'Not rated yet'
              }>
                {product.rating ? (
                  <>
                    <span className="stars">
                      {'★'.repeat(Math.max(0, Math.min(5, Math.round(product.rating))))}
                      {'☆'.repeat(5 - Math.max(0, Math.min(5, Math.round(product.rating))))}
                    </span>
                    <span className="rating-number">
                      {Number(product.rating).toFixed(1)}/5
                    </span>
                    {product.reviewCount > 0 && (
                      <span className="review-count">
                        ({product.reviewCount} reviews)
                      </span>
                    )}
                  </>
                ) : (
                  <span className="review-count">Not rated yet</span>
                )}
              </div>

              <p className="product-price">
                ₹{Number(product.price).toLocaleString('en-IN')}
              </p>

              <p>Category: {product.category}</p>
              <p>Stock: {product.stock}</p>

              {product.description && (
                <p className="product-description">
                  {product.description}
                </p>
              )}

              <button
                type="button"
                className="add-to-cart-button"
                onClick={() => addToCart(product)}
                disabled={
                  Number(product.stock) <= 0 ||
                  cart.some(
                    (item) =>
                      item._id === product._id &&
                      item.quantity >= Number(product.stock)
                  )
                }
              >
                {Number(product.stock) <= 0
                  ? 'Out of Stock'
                  : cart.some(
                      (item) =>
                        item._id === product._id &&
                        item.quantity >= Number(product.stock)
                    )
                  ? 'Stock Limit Reached'
                  : 'Add to Cart'}
              </button>
            </article>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer>
        <p>© 2026 ShopEase. Happy shopping!</p>
      </footer>
    </div>
  );
}

export default App;
