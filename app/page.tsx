import OrderForm from "./order-form";

export default function HomePage() {
  return (
    <>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Home">
          <span className="brand-mark">B</span>
          <span>Order Your Class Uniform</span>
        </a>
        <nav className="top-nav" aria-label="Menu">
          <a href="#options">Options</a>
          <a href="#summary">Payment</a>
        </nav>
      </header>
      <OrderForm />
    </>
  );
}
