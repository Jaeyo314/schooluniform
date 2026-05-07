"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calculateTotal,
  formatWon,
  INITIAL_PRICE,
  NUMBER_PRICE,
  PANTS_PRICE,
  SIZES,
  type UniformSize,
} from "@/lib/pricing";

export default function OrderForm() {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [size, setSize] = useState<UniformSize>("M");
  const [numberEnabled, setNumberEnabled] = useState(true);
  const [numberText, setNumberText] = useState("7");
  const [initialEnabled, setInitialEnabled] = useState(true);
  const [initialText, setInitialText] = useState("CLASS");
  const [pantsEnabled, setPantsEnabled] = useState(false);
  const [longSleeveEnabled, setLongSleeveEnabled] = useState(false);
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTopCompact, setIsTopCompact] = useState(false);

  const total = useMemo(
    () => calculateTotal({ numberEnabled, initialEnabled, pantsEnabled }),
    [numberEnabled, initialEnabled, pantsEnabled],
  );

  async function createOrder() {
    const confirmed = window.confirm(`Confirm this order amount: ${formatWon(total)}?`);
    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    setIsError(false);
    setStatus("Registering order...");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName,
          customerPhone,
          size,
          numberEnabled,
          numberText,
          initialEnabled,
          initialText,
          pantsEnabled,
          longSleeveEnabled,
        }),
      });

      const data = (await response.json()) as { orderId?: string; amount?: number; message?: string };
      if (!response.ok || !data.orderId) {
        throw new Error(data.message || "Cannot register order");
      }

      setStatus(`Order registered. Confirmed amount: ${formatWon(data.amount ?? total)}.`);
      window.alert(`Order registered.\nConfirmed amount: ${formatWon(data.amount ?? total)}`);
    } catch (error) {
      setIsError(true);
      setStatus(error instanceof Error ? error.message : "Cannot create order");
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    function updateTopState() {
      setIsTopCompact(window.scrollY > 180);
    }

    updateTopState();
    window.addEventListener("scroll", updateTopState, { passive: true });
    return () => window.removeEventListener("scroll", updateTopState);
  }, []);

  return (
    <main id="top" className="page-shell">
      <form
        className={`checkout-config apple-order ${isTopCompact ? "is-top-compact" : ""}`}
        onSubmit={(event) => event.preventDefault()}
      >
        <div className={`compact-top-widget ${isTopCompact ? "is-visible" : ""}`} aria-hidden={!isTopCompact}>
          <strong>Class Uniform Order</strong>
          <div className="compact-top-chips" aria-label="Selected options">
            <button type="button" className="live-chip is-static" onClick={() => document.querySelector("#size-title")?.scrollIntoView({ behavior: "smooth" })}>
              {size}
            </button>
            <button type="button" className={`live-chip ${numberEnabled ? "is-on" : ""}`} onClick={() => setNumberEnabled((value) => !value)}>
              Back number {numberEnabled ? numberText || "-" : "None"}
            </button>
            <button type="button" className={`live-chip ${initialEnabled ? "is-on" : ""}`} onClick={() => setInitialEnabled((value) => !value)}>
              Initial {initialEnabled ? initialText || "-" : "None"}
            </button>
            <button type="button" className={`live-chip ${pantsEnabled ? "is-on" : ""}`} onClick={() => setPantsEnabled((value) => !value)}>
              Shorts {pantsEnabled ? "Add" : "None"}
            </button>
            <button type="button" className={`live-chip ${longSleeveEnabled ? "is-on" : ""}`} onClick={() => setLongSleeveEnabled((value) => !value)}>
              {longSleeveEnabled ? "Long" : "Short"}
            </button>
          </div>
        </div>

        <section className="config-column" id="options" aria-labelledby="page-title">
          <div className="config-heading">
            <h1 id="page-title">Class Uniform Order</h1>
            <div className="live-chips compact-chips" aria-label="Selected options">
              <button type="button" className="live-chip is-static" onClick={() => document.querySelector("#size-title")?.scrollIntoView({ behavior: "smooth" })}>
                {size}
              </button>
              <button type="button" className={`live-chip ${numberEnabled ? "is-on" : ""}`} onClick={() => setNumberEnabled((value) => !value)}>
                Back number {numberEnabled ? numberText || "-" : "None"}
              </button>
              <button type="button" className={`live-chip ${initialEnabled ? "is-on" : ""}`} onClick={() => setInitialEnabled((value) => !value)}>
                Initial {initialEnabled ? initialText || "-" : "None"}
              </button>
              <button type="button" className={`live-chip ${pantsEnabled ? "is-on" : ""}`} onClick={() => setPantsEnabled((value) => !value)}>
                Shorts {pantsEnabled ? "Add" : "None"}
              </button>
              <button type="button" className={`live-chip ${longSleeveEnabled ? "is-on" : ""}`} onClick={() => setLongSleeveEnabled((value) => !value)}>
                {longSleeveEnabled ? "Long" : "Short"}
              </button>
            </div>
          </div>

          <section className="config-block" aria-labelledby="customer-title">
            <div className="config-row-head">
              <h3 id="customer-title">Enter your information.</h3>
            </div>
            <div className="customer-grid">
              <div className="field-row">
                <label className="sr-only" htmlFor="customerName">
                  Name
                </label>
                <input
                  id="customerName"
                  aria-label="Name"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Enter your name"
                  autoComplete="name"
                />
              </div>
              <div className="field-row">
                <label className="sr-only" htmlFor="customerPhone">
                  Phone
                </label>
                <input
                  id="customerPhone"
                  aria-label="Phone"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder="Enter your phone number"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </div>
            </div>
          </section>

          <section className="config-block" aria-labelledby="size-title">
            <div className="config-row-head">
              <h3 id="size-title">Size</h3>
            </div>
            <div className="choice-grid size-grid" role="radiogroup" aria-label="Choose your size.">
              {SIZES.map((item) => (
                <label className="choice-card" key={item}>
                  <input
                    type="radio"
                    name="size"
                    value={item}
                    checked={size === item}
                    onChange={() => setSize(item)}
                  />
                  <span>{item}</span>
                  <small>{item === "S" ? "85-90" : item === "M" ? "95" : item === "L" ? "100" : item === "XL" ? "105" : "110"}</small>
                </label>
              ))}
            </div>
          </section>

          <section className="config-block" aria-labelledby="printing-title">
            <div className="config-row-head">
              <h3 id="printing-title">Printing</h3>
            </div>

            <button
              className={`option-card ${numberEnabled ? "is-selected" : ""}`}
              type="button"
              aria-pressed={numberEnabled}
              onClick={() => setNumberEnabled((value) => !value)}
            >
              <span className="option-main">
                <span className="option-title">Back number</span>
                <span className="option-subtitle">Enter your back number.</span>
              </span>
              <span className="option-price">+{formatWon(NUMBER_PRICE)}</span>
            </button>
            <div className={`field-row ${numberEnabled ? "" : "is-hidden"}`}>
              <label className="sr-only" htmlFor="numberInput">
                Back number
              </label>
              <input
                id="numberInput"
                aria-label="Back number"
                value={numberText}
                onChange={(event) => setNumberText(event.target.value.replace(/[^\d]/g, "").slice(0, 2))}
                inputMode="numeric"
                maxLength={2}
                placeholder="Enter your back number"
              />
            </div>

            <button
              className={`option-card ${initialEnabled ? "is-selected" : ""}`}
              type="button"
              aria-pressed={initialEnabled}
              onClick={() => setInitialEnabled((value) => !value)}
            >
              <span className="option-main">
                <span className="option-title">Initial</span>
                <span className="option-subtitle">Enter your initial.</span>
              </span>
              <span className="option-price">+{formatWon(INITIAL_PRICE)}</span>
            </button>
            <div className={`field-row ${initialEnabled ? "" : "is-hidden"}`}>
              <label className="sr-only" htmlFor="initialInput">
                Initial
              </label>
              <input
                id="initialInput"
                aria-label="Initial"
                value={initialText}
                onChange={(event) => setInitialText(event.target.value.slice(0, 10))}
                maxLength={10}
                placeholder="Enter your initial"
              />
            </div>
          </section>

          <section className="config-block" aria-labelledby="extras-title">
            <div className="config-row-head">
              <h3 id="extras-title">Extra options</h3>
            </div>

            <button
              className={`option-card ${pantsEnabled ? "is-selected" : ""}`}
              type="button"
              aria-pressed={pantsEnabled}
              onClick={() => setPantsEnabled((value) => !value)}
            >
              <span className="option-main">
                <span className="option-title">Shorts</span>
                <span className="option-subtitle">Order as a set</span>
              </span>
              <span className="option-price">+{formatWon(PANTS_PRICE)}</span>
            </button>

            <button
              className={`option-card ${longSleeveEnabled ? "is-selected" : ""}`}
              type="button"
              aria-pressed={longSleeveEnabled}
              onClick={() => setLongSleeveEnabled((value) => !value)}
            >
              <span className="option-main">
                <span className="option-title">Long sleeve</span>
                <span className="option-subtitle">No extra cost</span>
              </span>
              <span className="option-price">+0₩</span>
            </button>
          </section>
        </section>

        <aside className="floating-summary" id="summary" aria-label="Summary">
          <div className="liquid-checkout">
            <div className="liquid-price">
              <strong id="totalPrice">{formatWon(total)}</strong>
            </div>
            <button className="primary-button" type="button" onClick={createOrder} disabled={isSubmitting}>
              {isSubmitting ? "Registering..." : "Register"}
            </button>
            {status ? (
              <p className={`status-message ${isError ? "error" : ""}`} role="status" aria-live="polite">
                {status}
              </p>
            ) : null}
          </div>
        </aside>
      </form>
    </main>
  );
}
